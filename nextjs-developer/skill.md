---
name: nextjs-developer
description: Expert Next.js development with App Router, Server Components, and modern React patterns
---

# Next.js Developer Skill

## Overview

This skill provides comprehensive expertise in building production-ready Next.js applications using the **App Router** (Next.js 15+). It covers Server Components, React 19 support, data fetching patterns, routing, API routes, caching, and performance optimization.

## Core Capabilities

### App Router Architecture
- **Server Components**: Default rendering model for optimal performance
- **Client Components**: Interactive components with `"use client"` directive
- **Layouts**: Shared UI with preserved state across routes
- **Templates**: Fresh instances on navigation (no state preservation)
- **Loading UI**: Streaming with `loading.tsx` files
- **Error Handling**: Granular error boundaries with `error.tsx`

### Data Fetching
- **Server-side fetching**: Direct database/API access in Server Components
- **Caching strategies**: Dynamic rendering by default, explicit caching, and incremental regeneration
- **Revalidation**: Time-based and on-demand cache invalidation
- **Parallel fetching**: Optimized data loading patterns

### Routing System
- **File-based routing**: Automatic route generation from file structure
- **Dynamic routes**: `[param]` and catch-all `[...slug]` patterns
- **Route groups**: `(folder)` for organization without URL impact
- **Parallel routes**: `@slot` for simultaneous route rendering
- **Intercepting routes**: Modal patterns with `(.)`, `(..)`, `(...)`

### Server Actions
- **Form handling**: Progressive enhancement with `action` attribute
- **Mutations**: Server-side data modifications
- **Revalidation**: Automatic cache updates after mutations
- **Optimistic updates**: Immediate UI feedback patterns

## Implementation Patterns

### Project Structure
```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page
├── globals.css         # Global styles
├── (auth)/             # Route group
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Dashboard layout
│   ├── page.tsx        # Dashboard home
│   ├── loading.tsx     # Loading UI
│   ├── error.tsx       # Error boundary
│   └── [id]/page.tsx   # Dynamic route
├── api/
│   └── [route]/route.ts # API routes
└── components/         # Shared components
```

### Component Patterns

#### Server Component (Default)
```typescript
// app/posts/page.tsx
async function PostsPage() {
  const posts = await db.posts.findMany()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

export default PostsPage
```

#### Client Component
```typescript
// app/components/counter.tsx
"use client"

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

### Data Fetching Patterns

#### Dynamic Rendering (Default)
```typescript
// In Next.js 15+, fetch is uncached by default (implicit cache: 'no-store')
async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

#### Static Generation (Opt-in)
```typescript
// Explicitly opt into caching
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache',
  })
  return <div>{data}</div>
}
```

#### Time-based Revalidation
```typescript
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Revalidate every hour
  })
  return <div>{data}</div>
}
```

> Note: The client router cache is also uncached by default in Next.js 15, replacing the old 30s/5m defaults.

### Server Actions
```typescript
// app/actions.ts
"use server"

import { revalidatePath } from "next/cache"

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string

  await db.posts.create({ data: { title } })

  revalidatePath("/posts")
}
```

```typescript
// app/posts/new/page.tsx
import { createPost } from "@/app/actions"

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Partial Prerendering (PPR)
- PPR combines a static shell with dynamic streaming in a single HTTP request.
- It is production-ready in Next.js 15+ and was experimental in Next.js 14.
- Enable incremental adoption with `experimental.ppr: 'incremental'` in `next.config.js`, or use `ppr: true` when you want full PPR.
- Use `Suspense` boundaries to define dynamic holes inside static shells.
- Adopt PPR route by route so you can gradually expand coverage without rewriting the whole app.

```typescript
// app/page.tsx — static shell with dynamic hole
export const experimental_ppr = true

export default function Page() {
  return (
    <main>
      <StaticHeader />
      <Suspense fallback={<ProductSkeleton />}>
        <DynamicProductList />
      </Suspense>
    </main>
  )
}
```

### Turbopack
- Turbopack is stable for `next dev` in Next.js 15 and for `next build` in Next.js 15.3+.
- The production build path passes 8,298 test suite cases.
- Use `next dev --turbopack` and `next build --turbopack` to opt in.
- It can be up to 10x faster than Webpack for dev server startup.
- Some Webpack loaders and plugins may still need migration work.

```bash
next dev --turbopack
next build --turbopack
```

### React 19 Features
- React 19 is the default runtime in Next.js 15+ App Router projects.
- Use `use()` to consume promises and contexts during render.
- Server Actions are stable and no longer experimental.
- Use `useFormStatus()` for form state without prop drilling.
- Use `useOptimistic()` for optimistic UI updates.

```typescript
import { use } from "react"
import { useFormStatus } from "react-dom"
import { useOptimistic } from "react"

function ProductName({ productPromise }: { productPromise: Promise<{ name: string }> }) {
  const product = use(productPromise)
  return <h1>{product.name}</h1>
}
```

### `after()` Post-Response Work
- Next.js 15 introduces `after()` for post-response work.
- Use it for logging, analytics, and other non-critical tasks after the response is sent.
- Import it from `next/server`.

```typescript
import { after } from 'next/server'

after(() => {
  logAnalytics()
})
```

### Navigation Hooks (Next.js 15.4)
- `useLinkStatus()` helps show inline link-loading indicators.
- `onNavigate` lets you track or block client-side navigation.
- `useLinkStatus()` is a client hook from `next/link` and returns `{ pending }`.
- `onNavigate` is a `Link` prop for SPA navigations only.

```typescript
'use client'

import Link, { useLinkStatus } from 'next/link'

function LinkHint() {
  const { pending } = useLinkStatus()
  return <span aria-hidden>{pending ? 'Loading…' : null}</span>
}

export function Nav() {
  return (
    <nav>
      <Link href="/dashboard" prefetch={false} onNavigate={() => trackNavigation('/dashboard')}>
        Dashboard <LinkHint />
      </Link>
    </nav>
  )
}
```

### next.config.js Patterns
- Keep experimental flags only when needed; several features have graduated to stable in Next.js 15+.
- Use `experimental.ppr: 'incremental'` for route-by-route PPR adoption.
- Use `ppr: true` only when you want a fully PPR-enabled app.
- Turbopack is enabled via CLI flags, not a `next.config.js` switch.

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental',
  },
  // For full PPR:
  // ppr: true,
}

export default nextConfig
```

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack"
  }
}
```

## Best Practices

### Performance
- Use Server Components by default
- Prefer dynamic rendering unless you explicitly need caching
- Use PPR for fast static shells with dynamic holes
- Optimize images with `next/image`
- Use `next/font` for font optimization
- Implement streaming with Suspense boundaries

### Security
- Validate all inputs in Server Actions
- Use environment variables for secrets
- Implement proper authentication patterns
- Sanitize user-generated content

### Code Organization
- Colocate components with routes when possible
- Use route groups for logical organization
- Implement proper error boundaries
- Create reusable layout patterns

## Scripts

This skill includes executable scripts in the `scripts/` folder:

### Development
- **dev-server.sh**: Start the development server with hot reloading
  ```bash
  ./scripts/dev-server.sh [--port PORT] [--turbo]
  ```

- **build-production.sh**: Create optimized production build
  ```bash
  ./scripts/build-production.sh [--analyze]
  ```

- **analyze-bundle.sh**: Analyze bundle size and dependencies
  ```bash
  ./scripts/analyze-bundle.sh
  ```

### Code Generation
- **create-page.sh**: Generate a new page with optional layout/loading/error files
  ```bash
  ./scripts/create-page.sh <page-path> [--layout] [--loading] [--error]
  ```

- **create-api-route.sh**: Generate API route handlers
  ```bash
  ./scripts/create-api-route.sh <route-name> [--dynamic]
  ```

- **create-component.sh**: Generate React components with optional tests
  ```bash
  ./scripts/create-component.sh <name> [--client] [--test] [--dir DIR]
  ```

### Testing
- **setup-testing.sh**: Set up Jest and React Testing Library
  ```bash
  ./scripts/setup-testing.sh [--playwright]
  ```

- **run-tests.sh**: Run tests with various options
  ```bash
  ./scripts/run-tests.sh [--watch] [--coverage] [--file FILE]
  ```

## Templates

This skill includes production-ready templates in the `templates/` folder:

### Pages
- **page-server.tsx**: Server Component page with async data fetching, metadata, and Suspense streaming
- **page-client.tsx**: Client Component page with state management, hooks, and interactivity
- **page-dynamic.tsx**: Dynamic route page with params, generateStaticParams, and generateMetadata

### Components
- **component-server.tsx**: Server Component with data fetching and composition patterns
- **component-client.tsx**: Client Component with hooks, event handlers, and localStorage

### API & Backend
- **api-route.ts**: Complete API route handler with CRUD, validation (Zod), auth, and CORS
- **server-action.ts**: Server Actions with form handling, validation, and revalidation
- **middleware.ts**: Middleware with auth, rate limiting, i18n, and security headers

### Infrastructure
- **layout.tsx**: Root/nested layout with navigation, footer, metadata, and fonts
- **page.test.tsx**: Testing patterns for pages, components, API routes, and Server Actions

## Resources

This skill includes detailed reference guides in the `resources/` folder:

- **app-router-patterns.md**: Comprehensive App Router patterns and examples
- **data-fetching.md**: Data fetching strategies and caching
- **server-components.md**: Server vs Client Components guide
- **routing-reference.md**: Complete routing system reference
- **performance-optimization.md**: Performance best practices
- **api-routes.md**: API route handlers and patterns
- **testing-patterns.md**: Testing strategies for Next.js apps

---

**Specialization**: Next.js App Router Development
**Version**: 2.0
**Last Updated**: May 2026
