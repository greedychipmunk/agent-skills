# MedusaJS Module Development Guide

## Module Structure

### Basic Module Setup
```
src/modules/my-module/
├── models/           # Data models
├── services/         # Business logic
├── index.ts          # Module exports
└── migrations/       # Database migrations
```

## Data Models

### Model Definition
```typescript
// src/modules/blog/models/post.ts
import { model } from "@medusajs/framework/utils"

const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  content: model.text().nullable(),
  slug: model.text().searchable(),
  published: model.boolean().default(false),
  published_at: model.dateTime().nullable(),
  author_id: model.text(),
  category_id: model.text().nullable(),
  tags: model.json().nullable(),
  metadata: model.json().nullable(),
})

export default Post
```

### Model Relationships
```typescript
// One-to-Many relationship
const Author = model.define("author", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().searchable(),
  bio: model.text().nullable(),
})

const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  author_id: model.text(),
  author: model.belongsTo(() => Author, {
    mappedBy: "author_id"
  })
})

// Many-to-Many relationship
const Tag = model.define("tag", {
  id: model.id().primaryKey(),
  name: model.text(),
  posts: model.manyToMany(() => Post, {
    mappedBy: "post_tags",
    joinColumn: "tag_id",
    inverseJoinColumn: "post_id"
  })
})
```

### Model Validation
```typescript
import { z } from "zod"

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  published: z.boolean().default(false),
  tags: z.array(z.string()).optional()
})

const Post = model.define("post", {
  // ... model definition
}, {
  validation: PostSchema
})
```

## Service Layer

### Basic Service
```typescript
// src/modules/blog/services/post.ts
import { MedusaService } from "@medusajs/framework/utils"

class PostService extends MedusaService({
  Post: () => import("../models/post").then(m => m.default)
}) {
  
  async createPost(data: {
    title: string
    content?: string
    slug: string
    author_id: string
  }) {
    const post = await this.postRepository.create({
      ...data,
      published: false,
      published_at: null
    })
    
    return await this.postRepository.save(post)
  }
  
  async publishPost(postId: string) {
    const post = await this.postRepository.findOne({ 
      where: { id: postId } 
    })
    
    if (!post) {
      throw new Error("Post not found")
    }
    
    post.published = true
    post.published_at = new Date()
    
    return await this.postRepository.save(post)
  }
  
  async listPosts(options: {
    published?: boolean
    author_id?: string
    limit?: number
    offset?: number
  } = {}) {
    const { published, author_id, limit = 20, offset = 0 } = options
    
    const where: any = {}
    if (published !== undefined) where.published = published
    if (author_id) where.author_id = author_id
    
    return await this.postRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: "DESC" }
    })
  }
  
  async getPostBySlug(slug: string) {
    return await this.postRepository.findOne({
      where: { slug },
      relations: ["author"]
    })
  }
  
  async searchPosts(query: string, options: {
    limit?: number
    offset?: number
  } = {}) {
    const { limit = 20, offset = 0 } = options
    
    return await this.postRepository.findAndCount({
      where: [
        { title: { contains: query } },
        { content: { contains: query } }
      ],
      take: limit,
      skip: offset
    })
  }
}

export default PostService
```

### Service with External Integration
```typescript
// src/modules/blog/services/post-analytics.ts
import { MedusaService } from "@medusajs/framework/utils"

class PostAnalyticsService extends MedusaService({
  Post: () => import("../models/post").then(m => m.default)
}) {
  
  private analyticsClient = new AnalyticsClient(
    process.env.ANALYTICS_API_KEY
  )
  
  async trackPostView(postId: string, viewerInfo: {
    ip: string
    userAgent: string
    referrer?: string
  }) {
    const post = await this.postRepository.findOne({ 
      where: { id: postId } 
    })
    
    if (!post || !post.published) return
    
    // Track in external analytics service
    await this.analyticsClient.trackEvent({
      event: "post_view",
      properties: {
        post_id: postId,
        post_title: post.title,
        post_slug: post.slug,
        ...viewerInfo
      }
    })
    
    // Update local view count
    await this.postRepository.update(
      { id: postId },
      { view_count: () => "view_count + 1" }
    )
  }
  
  async getPostMetrics(postId: string) {
    const metrics = await this.analyticsClient.getMetrics({
      filters: { post_id: postId },
      metrics: ["views", "unique_visitors", "engagement_time"]
    })
    
    return metrics
  }
}
```

## Module Configuration

### Module Index
```typescript
// src/modules/blog/index.ts
import PostService from "./services/post"
import AuthorService from "./services/author"
import TagService from "./services/tag"

export const blogModuleDefinition = {
  key: "blog",
  registrationName: "blogService",
  defaultPackage: false,
  label: "Blog Module",
  dependencies: ["eventBusService"],
  defaultModuleDeclaration: {
    resolve: "./modules/blog",
    options: {
      // Module configuration options
      enableAnalytics: true,
      cacheEnabled: true,
      maxPostsPerPage: 50
    }
  }
}

export default blogModuleDefinition

export {
  PostService,
  AuthorService,
  TagService
}
```

### Module Options
```typescript
// src/modules/blog/types.ts
export interface BlogModuleOptions {
  enableAnalytics?: boolean
  cacheEnabled?: boolean
  maxPostsPerPage?: number
  allowedImageFormats?: string[]
  autoGenerateSlug?: boolean
}
```

## Database Migrations

### Generated Migration
```typescript
// src/modules/blog/migrations/1234567890123-CreatePost.ts
import { Migration } from '@medusajs/framework/utils'

export const migration: Migration = {
  name: "CreatePost1234567890123",
  
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE "post" (
        "id" character varying NOT NULL,
        "title" character varying NOT NULL,
        "content" text,
        "slug" character varying NOT NULL,
        "published" boolean NOT NULL DEFAULT false,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "author_id" character varying NOT NULL,
        "view_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_post" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_slug" UNIQUE ("slug")
      )
    `)
    
    await queryRunner.query(`
      CREATE INDEX "IDX_post_published" ON "post" ("published")
    `)
    
    await queryRunner.query(`
      CREATE INDEX "IDX_post_author_id" ON "post" ("author_id")
    `)
  },
  
  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX "IDX_post_author_id"`)
    await queryRunner.query(`DROP INDEX "IDX_post_published"`)
    await queryRunner.query(`DROP TABLE "post"`)
  }
}
```

### Custom Migration Commands
```bash
# Generate migration for module
npx medusa db:generate blog

# Run migrations
npx medusa db:migrate

# Rollback migration
npx medusa db:migrate:rollback
```

## Event Handling

### Event Subscribers
```typescript
// src/modules/blog/subscribers/post-events.ts
import { SubscriberConfig, SubscriberArgs } from "@medusajs/framework"

export default async function postEventHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const postService = container.resolve("postService")
  const eventBusService = container.resolve("eventBusService")
  
  const post = await postService.retrievePost(event.data.id)
  
  if (event.name === "post.published") {
    // Send notifications
    await eventBusService.emit("notification.send", {
      type: "post_published",
      recipients: ["subscribers"],
      data: { post }
    })
    
    // Update search index
    await container.resolve("searchService").indexPost(post)
  }
}

export const config: SubscriberConfig = {
  event: ["post.created", "post.published", "post.deleted"]
}
```

## Testing Modules

### Service Tests
```typescript
// __tests__/modules/blog/services/post.test.ts
import PostService from "../../../../src/modules/blog/services/post"

describe("PostService", () => {
  let service: PostService
  
  beforeEach(() => {
    service = new PostService({
      postRepository: mockPostRepository
    })
  })
  
  describe("createPost", () => {
    it("should create a post with correct data", async () => {
      const postData = {
        title: "Test Post",
        content: "Test content",
        slug: "test-post",
        author_id: "author-1"
      }
      
      const createdPost = await service.createPost(postData)
      
      expect(createdPost.title).toBe("Test Post")
      expect(createdPost.published).toBe(false)
    })
  })
  
  describe("publishPost", () => {
    it("should publish an existing post", async () => {
      const postId = "post-1"
      mockPostRepository.findOne.mockResolvedValue({
        id: postId,
        published: false
      })
      
      const result = await service.publishPost(postId)
      
      expect(result.published).toBe(true)
      expect(result.published_at).toBeInstanceOf(Date)
    })
    
    it("should throw error for non-existent post", async () => {
      mockPostRepository.findOne.mockResolvedValue(null)
      
      await expect(service.publishPost("invalid-id"))
        .rejects
        .toThrow("Post not found")
    })
  })
})
```

### Integration Tests
```typescript
// __tests__/modules/blog/integration/post-workflow.test.ts
describe("Post Publishing Workflow", () => {
  it("should complete full post lifecycle", async () => {
    // Create author
    const author = await authorService.createAuthor({
      name: "John Doe",
      email: "john@example.com"
    })
    
    // Create post
    const post = await postService.createPost({
      title: "Integration Test Post",
      slug: "integration-test-post",
      author_id: author.id
    })
    
    expect(post.published).toBe(false)
    
    // Publish post
    const publishedPost = await postService.publishPost(post.id)
    
    expect(publishedPost.published).toBe(true)
    expect(publishedPost.published_at).toBeDefined()
    
    // Verify post is searchable
    const searchResults = await postService.searchPosts("Integration")
    expect(searchResults[1]).toBe(1) // count
    expect(searchResults[0][0].id).toBe(post.id)
  })
})
```