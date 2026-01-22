# Next.js App Router Patterns

## File Conventions

The App Router uses a file-system based router where folders define routes and special files define UI.

### Special Files

| File | Purpose |
|------|---------|
| `layout.tsx` | Shared UI for segment and children |
| `page.tsx` | Unique UI for a route (makes route accessible) |
| `loading.tsx` | Loading UI (wraps page in Suspense) |
| `error.tsx` | Error UI (wraps page in Error Boundary) |
| `not-found.tsx` | Not found UI |
| `template.tsx` | Re-rendered layout (no state preservation) |
| `default.tsx` | Fallback for parallel routes |
| `route.tsx` | API endpoint |

---

## Layout Patterns

### Root Layout (Required)
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Nested Layout
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <nav>
        <a href="/dashboard">Overview</a>
        <a href="/dashboard/settings">Settings</a>
      </nav>
      <main>{children}</main>
    </div>
  )
}
```

### Layout with Metadata
```typescript
// app/blog/layout.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Blog",
    default: "Blog",
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
```

---

## Loading States

### Basic Loading UI
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="skeleton">Loading...</div>
}
```

### Loading with Suspense Boundaries
```typescript
// app/dashboard/page.tsx
import { Suspense } from "react"

async function SlowComponent() {
  const data = await fetch("/api/slow")
  return <div>{data}</div>
}

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading stats...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

---

## Error Handling

### Error Boundary
```typescript
// app/dashboard/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Global Error Handler
```typescript
// app/global-error.tsx
"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

### Not Found Page
```typescript
// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

---

## Route Groups

Route groups allow organizing routes without affecting the URL structure.

### Organizing by Feature
```
app/
├── (marketing)/
│   ├── about/page.tsx      # /about
│   └── blog/page.tsx       # /blog
├── (shop)/
│   ├── products/page.tsx   # /products
│   └── cart/page.tsx       # /cart
└── layout.tsx
```

### Multiple Root Layouts
```
app/
├── (marketing)/
│   ├── layout.tsx          # Marketing layout
│   └── page.tsx
├── (app)/
│   ├── layout.tsx          # App layout
│   └── dashboard/page.tsx
```

---

## Parallel Routes

Parallel routes allow rendering multiple pages in the same layout simultaneously.

### Basic Parallel Routes
```
app/
├── @analytics/
│   └── page.tsx
├── @team/
│   └── page.tsx
├── layout.tsx
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <div>
      {children}
      <div className="sidebar">
        {analytics}
        {team}
      </div>
    </div>
  )
}
```

### Conditional Rendering with Parallel Routes
```typescript
// app/layout.tsx
import { getUser } from "@/lib/auth"

export default async function Layout({
  children,
  admin,
  user,
}: {
  children: React.ReactNode
  admin: React.ReactNode
  user: React.ReactNode
}) {
  const currentUser = await getUser()

  return (
    <div>
      {currentUser.role === "admin" ? admin : user}
      {children}
    </div>
  )
}
```

---

## Intercepting Routes

Intercepting routes allow loading a route within the current layout.

### Convention
- `(.)` - Match same level
- `(..)` - Match one level above
- `(..)(..)` - Match two levels above
- `(...)` - Match from root

### Modal Pattern
```
app/
├── @modal/
│   └── (.)photo/[id]/page.tsx  # Intercepted route (modal)
├── photo/
│   └── [id]/page.tsx           # Direct access (full page)
├── layout.tsx
└── page.tsx
```

```typescript
// app/@modal/(.)photo/[id]/page.tsx
import { Modal } from "@/components/modal"

export default function PhotoModal({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Modal>
      <img src={`/photos/${params.id}`} alt="" />
    </Modal>
  )
}
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
```

---

## Template Pattern

Templates create a new instance on navigation (unlike layouts).

```typescript
// app/template.tsx
export default function Template({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="fade-in">{children}</div>
}
```

**Use Cases**:
- Enter/exit animations
- Features relying on useEffect (logging page views)
- Features relying on useState (per-page feedback form)

---

## Metadata Patterns

### Static Metadata
```typescript
// app/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to our website",
  openGraph: {
    title: "Home",
    description: "Welcome to our website",
    images: ["/og-image.jpg"],
  },
}
```

### Dynamic Metadata
```typescript
// app/posts/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from "next"

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPost(params.id)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.image, ...(await parent).openGraph?.images || []],
    },
  }
}
```

---

**Last Updated**: January 2026
