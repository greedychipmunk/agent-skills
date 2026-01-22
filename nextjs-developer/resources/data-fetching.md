# Next.js Data Fetching Guide

## Overview

Next.js App Router provides powerful data fetching capabilities with automatic caching and revalidation.

---

## Server Component Data Fetching

### Basic Fetch
```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts")

  if (!res.ok) {
    throw new Error("Failed to fetch posts")
  }

  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post: Post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Direct Database Access
```typescript
// app/users/page.tsx
import { db } from "@/lib/db"

export default async function UsersPage() {
  const users = await db.user.findMany()

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

---

## Caching Strategies

### Static Data (Default)
```typescript
// Cached indefinitely until revalidated
async function getData() {
  const res = await fetch("https://api.example.com/data")
  return res.json()
}
```

### Dynamic Data (No Cache)
```typescript
// Never cached, always fresh
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    cache: "no-store",
  })
  return res.json()
}
```

### Time-based Revalidation
```typescript
// Revalidate every hour
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 },
  })
  return res.json()
}
```

---

## Route Segment Config

### Force Dynamic Rendering
```typescript
// app/dashboard/page.tsx
export const dynamic = "force-dynamic"
// Options: 'auto' | 'force-dynamic' | 'error' | 'force-static'
```

### Revalidation at Route Level
```typescript
// app/blog/page.tsx
export const revalidate = 3600 // Revalidate every hour
// Use 0 for no caching, false to cache indefinitely
```

### Dynamic Params
```typescript
// app/posts/[id]/page.tsx
export const dynamicParams = true // Allow params not in generateStaticParams
// false = return 404 for unknown params
```

---

## On-Demand Revalidation

### Revalidate by Path
```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path")

  if (path) {
    revalidatePath(path)
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    message: "Missing path param",
  })
}
```

### Revalidate by Tag
```typescript
// Fetch with tag
async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  })
  return res.json()
}

// Revalidate the tag
import { revalidateTag } from "next/cache"

export async function POST() {
  revalidateTag("posts")
  return Response.json({ revalidated: true })
}
```

---

## Parallel Data Fetching

### Using Promise.all
```typescript
// app/dashboard/page.tsx
async function getUser(userId: string) {
  const res = await fetch(`/api/users/${userId}`)
  return res.json()
}

async function getPosts(userId: string) {
  const res = await fetch(`/api/users/${userId}/posts`)
  return res.json()
}

export default async function Dashboard({
  params,
}: {
  params: { userId: string }
}) {
  // Fetch in parallel
  const [user, posts] = await Promise.all([
    getUser(params.userId),
    getPosts(params.userId),
  ])

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post: Post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Using Suspense for Streaming
```typescript
// app/dashboard/page.tsx
import { Suspense } from "react"

async function UserInfo({ userId }: { userId: string }) {
  const user = await getUser(userId)
  return <h1>{user.name}</h1>
}

async function UserPosts({ userId }: { userId: string }) {
  const posts = await getPosts(userId)
  return (
    <ul>
      {posts.map((post: Post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

export default function Dashboard({
  params,
}: {
  params: { userId: string }
}) {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserInfo userId={params.userId} />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId={params.userId} />
      </Suspense>
    </div>
  )
}
```

---

## Sequential Data Fetching

When data depends on previous results:

```typescript
// app/artist/[id]/page.tsx
async function getArtist(id: string) {
  const res = await fetch(`/api/artists/${id}`)
  return res.json()
}

async function getAlbums(artistId: string) {
  const res = await fetch(`/api/artists/${artistId}/albums`)
  return res.json()
}

export default async function ArtistPage({
  params,
}: {
  params: { id: string }
}) {
  // Sequential: albums depend on artist
  const artist = await getArtist(params.id)
  const albums = await getAlbums(artist.id)

  return (
    <div>
      <h1>{artist.name}</h1>
      <ul>
        {albums.map((album: Album) => (
          <li key={album.id}>{album.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Preloading Data

```typescript
// lib/data.ts
import { cache } from "react"

export const getUser = cache(async (id: string) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
})

export const preloadUser = (id: string) => {
  void getUser(id)
}
```

```typescript
// app/user/[id]/page.tsx
import { getUser, preloadUser } from "@/lib/data"

export default async function UserPage({
  params,
}: {
  params: { id: string }
}) {
  // Start loading early
  preloadUser(params.id)

  // ... other work

  const user = await getUser(params.id)
  return <div>{user.name}</div>
}
```

---

## Static Generation

### generateStaticParams
```typescript
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  )

  return posts.map((post: Post) => ({
    id: post.id.toString(),
  }))
}

export default async function PostPage({
  params,
}: {
  params: { id: string }
}) {
  const post = await getPost(params.id)
  return <article>{post.content}</article>
}
```

### Generating Multiple Params
```typescript
// app/[lang]/[slug]/page.tsx
export async function generateStaticParams() {
  const products = await getProducts()

  return products.flatMap((product) =>
    ["en", "es", "fr"].map((lang) => ({
      lang,
      slug: product.slug,
    }))
  )
}
```

---

## Request Memoization

React automatically memoizes fetch requests with the same URL and options:

```typescript
// This fetch is called in multiple components
async function getItem(id: string) {
  // Only one request is made even if called multiple times
  const res = await fetch(`/api/items/${id}`)
  return res.json()
}

// Component A
async function ComponentA({ id }: { id: string }) {
  const item = await getItem(id) // Request 1
  return <div>{item.name}</div>
}

// Component B
async function ComponentB({ id }: { id: string }) {
  const item = await getItem(id) // Deduplicated, uses cached result
  return <div>{item.description}</div>
}
```

---

## Error Handling

### Try-Catch Pattern
```typescript
async function getData() {
  try {
    const res = await fetch("https://api.example.com/data")

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error("Fetch error:", error)
    throw error // Re-throw to trigger error boundary
  }
}
```

### With Error Boundary
```typescript
// app/posts/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Failed to load posts</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Retry</button>
    </div>
  )
}
```

---

**Last Updated**: January 2026
