/**
 * Dynamic Route Page Template
 *
 * This template demonstrates a dynamic route page with:
 * - Dynamic params ([id], [slug], etc.)
 * - Dynamic metadata generation
 * - Static params generation for SSG
 * - Not found handling
 * - Related data fetching
 *
 * Usage:
 * 1. Copy to app/[route]/[id]/page.tsx (or [slug], etc.)
 * 2. Replace ENTITY_NAME with your entity name
 * 3. Implement your data fetching logic
 *
 * Location: app/[route-name]/[id]/page.tsx
 */

import { Suspense } from "react"
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

// ============================================================================
// TYPES
// ============================================================================

interface Entity {
  id: string
  title: string
  slug: string
  description: string
  content: string
  image: string
  publishedAt: string
  author: {
    id: string
    name: string
    avatar: string
  }
  tags: string[]
}

interface RelatedEntity {
  id: string
  title: string
  slug: string
}

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch single entity by ID or slug
 */
async function getEntity(id: string): Promise<Entity | null> {
  try {
    const res = await fetch(`https://api.example.com/entities/${id}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error("Error fetching entity:", error)
    return null
  }
}

/**
 * Fetch all entities for static generation
 */
async function getAllEntities(): Promise<Entity[]> {
  const res = await fetch("https://api.example.com/entities", {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    return []
  }

  return res.json()
}

/**
 * Fetch related entities
 */
async function getRelatedEntities(
  entityId: string,
  tags: string[]
): Promise<RelatedEntity[]> {
  const res = await fetch(
    `https://api.example.com/entities/${entityId}/related?tags=${tags.join(",")}`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) {
    return []
  }

  return res.json()
}

// ============================================================================
// STATIC GENERATION
// ============================================================================

/**
 * Generate static params for all entities
 * This pre-renders pages at build time
 */
export async function generateStaticParams() {
  const entities = await getAllEntities()

  return entities.map((entity) => ({
    id: entity.id,
    // Or use slug: entity.slug for [slug] routes
  }))
}

// ============================================================================
// DYNAMIC METADATA
// ============================================================================

/**
 * Generate metadata dynamically based on entity data
 */
export async function generateMetadata(
  { params, searchParams }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const entity = await getEntity(params.id)

  if (!entity) {
    return {
      title: "Not Found",
      description: "The requested page could not be found.",
    }
  }

  // Optionally extend parent metadata
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: entity.title,
    description: entity.description,
    authors: [{ name: entity.author.name }],
    openGraph: {
      title: entity.title,
      description: entity.description,
      type: "article",
      publishedTime: entity.publishedAt,
      authors: [entity.author.name],
      images: [entity.image, ...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: entity.title,
      description: entity.description,
      images: [entity.image],
    },
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Entity header with author info
 */
function EntityHeader({ entity }: { entity: Entity }) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/entities" className="hover:text-blue-500">
          Entities
        </Link>
        <span>/</span>
        <span>{entity.title}</span>
      </div>

      <h1 className="text-4xl font-bold mb-4">{entity.title}</h1>

      <p className="text-xl text-gray-600 mb-6">{entity.description}</p>

      <div className="flex items-center gap-4">
        <img
          src={entity.author.avatar}
          alt={entity.author.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-medium">{entity.author.name}</p>
          <time
            dateTime={entity.publishedAt}
            className="text-sm text-gray-500"
          >
            {new Date(entity.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>

      {entity.tags.length > 0 && (
        <div className="flex gap-2 mt-4">
          {entity.tags.map((tag) => (
            <Link
              key={tag}
              href={`/entities?tag=${tag}`}
              className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

/**
 * Related entities sidebar
 */
async function RelatedEntities({
  entityId,
  tags,
}: {
  entityId: string
  tags: string[]
}) {
  const related = await getRelatedEntities(entityId, tags)

  if (related.length === 0) {
    return null
  }

  return (
    <aside className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-semibold mb-4">Related</h2>
      <ul className="space-y-3">
        {related.map((item) => (
          <li key={item.id}>
            <Link
              href={`/entities/${item.id}`}
              className="text-blue-600 hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/**
 * Loading skeleton for related entities
 */
function RelatedEntitiesSkeleton() {
  return (
    <aside className="mt-12 pt-8 border-t">
      <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 bg-gray-200 rounded w-3/4" />
        ))}
      </div>
    </aside>
  )
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Dynamic route page component
 *
 * This page:
 * 1. Receives dynamic params (id, slug, etc.)
 * 2. Fetches entity data
 * 3. Generates dynamic metadata
 * 4. Handles not found cases
 * 5. Streams related content
 */
export default async function ENTITY_NAMEPage({ params, searchParams }: PageProps) {
  const entity = await getEntity(params.id)

  // Handle not found
  if (!entity) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Entity Header */}
      <EntityHeader entity={entity} />

      {/* Featured Image */}
      {entity.image && (
        <figure className="mb-8">
          <img
            src={entity.image}
            alt={entity.title}
            className="w-full rounded-lg"
          />
        </figure>
      )}

      {/* Main Content */}
      <article className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: entity.content }} />
      </article>

      {/* Related Entities (Streamed) */}
      <Suspense fallback={<RelatedEntitiesSkeleton />}>
        <RelatedEntities entityId={entity.id} tags={entity.tags} />
      </Suspense>

      {/* Navigation */}
      <nav className="mt-12 pt-8 border-t flex justify-between">
        <Link
          href="/entities"
          className="text-blue-600 hover:underline"
        >
          ← Back to all entities
        </Link>
      </nav>
    </main>
  )
}

// ============================================================================
// ROUTE SEGMENT CONFIG
// ============================================================================

// Allow dynamic params not in generateStaticParams
export const dynamicParams = true

// Revalidate this page every hour
export const revalidate = 3600
