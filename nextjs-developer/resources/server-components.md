# Server Components vs Client Components

## Overview

Next.js App Router uses React Server Components by default. Understanding when to use Server vs Client Components is crucial for building performant applications.

---

## Server Components (Default)

Server Components render on the server and send HTML to the client.

### Benefits
- **Zero JavaScript**: No JS bundle sent to client for the component
- **Direct backend access**: Query databases, access file system
- **Improved security**: Keep sensitive data on server
- **Caching**: Results can be cached and reused
- **Better SEO**: Full HTML available for crawlers

### Capabilities
- Fetch data directly
- Access backend resources
- Keep sensitive information server-side
- Import large dependencies without client impact

### Limitations
- Cannot use hooks (useState, useEffect)
- Cannot use browser APIs
- Cannot add event handlers (onClick, onChange)
- Cannot use Context providers

### Example
```typescript
// app/posts/page.tsx (Server Component by default)
import { db } from "@/lib/db"

export default async function PostsPage() {
  // Direct database access
  const posts = await db.post.findMany({
    include: { author: true },
  })

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <h2>{post.title}</h2>
          <p>By {post.author.name}</p>
        </li>
      ))}
    </ul>
  )
}
```

---

## Client Components

Client Components are pre-rendered on the server and hydrated on the client for interactivity.

### When to Use
- **Interactivity**: onClick, onChange handlers
- **State**: useState, useReducer
- **Effects**: useEffect, useLayoutEffect
- **Browser APIs**: window, document, localStorage
- **Custom hooks**: Hooks that depend on state/effects
- **React Class components**: If using legacy patterns

### Declaration
```typescript
"use client" // Add at the top of the file

import { useState } from "react"

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

---

## Composition Patterns

### Pattern 1: Server Component with Client Children
```typescript
// app/dashboard/page.tsx (Server Component)
import { db } from "@/lib/db"
import { InteractiveChart } from "./chart"

export default async function Dashboard() {
  const data = await db.analytics.findMany()

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Pass server data to client component */}
      <InteractiveChart data={data} />
    </div>
  )
}
```

```typescript
// app/dashboard/chart.tsx (Client Component)
"use client"

import { useState } from "react"

export function InteractiveChart({ data }: { data: DataPoint[] }) {
  const [selectedRange, setSelectedRange] = useState("week")

  return (
    <div>
      <select
        value={selectedRange}
        onChange={(e) => setSelectedRange(e.target.value)}
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      {/* Render chart with data */}
    </div>
  )
}
```

### Pattern 2: Client Component Wrapping Server Children
```typescript
// app/page.tsx (Server Component)
import { Modal } from "@/components/modal"
import { ServerContent } from "./server-content"

export default function Page() {
  return (
    <Modal>
      {/* Server Component passed as children */}
      <ServerContent />
    </Modal>
  )
}
```

```typescript
// components/modal.tsx (Client Component)
"use client"

import { useState } from "react"

export function Modal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <div className="modal">
          {children}
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </>
  )
}
```

---

## Decision Guide

| Need | Component Type |
|------|---------------|
| Fetch data | Server |
| Access backend resources | Server |
| Keep sensitive info on server | Server |
| Large dependencies | Server |
| Add interactivity (onClick) | Client |
| Use state (useState) | Client |
| Use effects (useEffect) | Client |
| Use browser APIs | Client |
| Use custom hooks with state | Client |

---

## Common Patterns

### Passing Server Data to Client Components
```typescript
// Server Component
export default async function Page() {
  const user = await getUser()

  // Serialize and pass to client
  return <UserProfile user={user} />
}

// Client Component
"use client"

export function UserProfile({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false)
  // user data is already fetched, just handle UI state
}
```

### Moving Client Components Down
```typescript
// BAD: Entire page is client component
"use client"

export default function Page() {
  const [search, setSearch] = useState("")
  const posts = usePosts() // Client-side fetching

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <PostList posts={posts} />
    </div>
  )
}
```

```typescript
// GOOD: Only SearchBar is client component
// app/posts/page.tsx (Server Component)
export default async function Page() {
  const posts = await getPosts() // Server-side fetching

  return (
    <div>
      <SearchBar /> {/* Client component */}
      <PostList posts={posts} /> {/* Server component */}
    </div>
  )
}

// app/posts/search-bar.tsx
"use client"

export function SearchBar() {
  const [search, setSearch] = useState("")
  // Handle search with URL params or server action
}
```

### Context Providers
```typescript
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx (Server Component)
import { Providers } from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## Third-Party Libraries

Many third-party components need `"use client"` because they use hooks.

### Wrapping Client-Only Libraries
```typescript
// components/carousel.tsx
"use client"

import { Carousel as LibCarousel } from "some-carousel-lib"

export function Carousel(props: CarouselProps) {
  return <LibCarousel {...props} />
}
```

### Using in Server Components
```typescript
// app/page.tsx (Server Component)
import { Carousel } from "@/components/carousel"

export default async function Page() {
  const images = await getImages()

  return (
    <div>
      <h1>Gallery</h1>
      <Carousel images={images} />
    </div>
  )
}
```

---

## Serialization Rules

When passing props from Server to Client Components, data must be serializable:

### Supported Types
- Primitives (string, number, boolean, null, undefined)
- Arrays and objects containing serializable values
- Date (serialized to string)
- Map, Set (serialized)
- TypedArrays, ArrayBuffer

### Not Supported
- Functions
- Classes (instances)
- Symbols
- React elements (except as children)

```typescript
// This works
<ClientComponent
  data={{ name: "John", count: 42 }}
  items={["a", "b", "c"]}
  date={new Date()}
/>

// This does NOT work
<ClientComponent
  onClick={() => console.log("clicked")} // Function
  user={new User("John")} // Class instance
/>
```

---

**Last Updated**: January 2026
