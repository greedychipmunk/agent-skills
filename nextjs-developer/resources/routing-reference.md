# Next.js Routing Reference

## File-Based Routing

Next.js App Router uses a file-system based router where:
- **Folders** define routes
- **Files** define UI

---

## Basic Routes

### Static Routes
```
app/
├── page.tsx          # /
├── about/
│   └── page.tsx      # /about
└── blog/
    └── page.tsx      # /blog
```

### Nested Routes
```
app/
└── blog/
    ├── page.tsx           # /blog
    └── posts/
        └── page.tsx       # /blog/posts
```

---

## Dynamic Routes

### Single Parameter
```
app/
└── posts/
    └── [id]/
        └── page.tsx       # /posts/1, /posts/2, etc.
```

```typescript
// app/posts/[id]/page.tsx
export default function PostPage({
  params,
}: {
  params: { id: string }
}) {
  return <div>Post: {params.id}</div>
}
```

### Multiple Parameters
```
app/
└── shop/
    └── [category]/
        └── [product]/
            └── page.tsx   # /shop/electronics/phone
```

```typescript
// app/shop/[category]/[product]/page.tsx
export default function ProductPage({
  params,
}: {
  params: { category: string; product: string }
}) {
  return (
    <div>
      Category: {params.category}
      Product: {params.product}
    </div>
  )
}
```

### Catch-All Segments
```
app/
└── docs/
    └── [...slug]/
        └── page.tsx       # /docs/a, /docs/a/b, /docs/a/b/c
```

```typescript
// app/docs/[...slug]/page.tsx
export default function DocsPage({
  params,
}: {
  params: { slug: string[] }
}) {
  // /docs/a/b/c -> slug = ['a', 'b', 'c']
  return <div>Path: {params.slug.join("/")}</div>
}
```

### Optional Catch-All
```
app/
└── docs/
    └── [[...slug]]/
        └── page.tsx       # /docs, /docs/a, /docs/a/b
```

---

## Route Groups

Groups organize routes without affecting the URL.

### Syntax: `(folderName)`

```
app/
├── (marketing)/
│   ├── about/page.tsx     # /about
│   └── contact/page.tsx   # /contact
├── (shop)/
│   ├── products/page.tsx  # /products
│   └── cart/page.tsx      # /cart
└── page.tsx               # /
```

### Multiple Layouts
```
app/
├── (marketing)/
│   ├── layout.tsx         # Marketing layout
│   ├── about/page.tsx
│   └── blog/page.tsx
├── (app)/
│   ├── layout.tsx         # App layout (authenticated)
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
└── layout.tsx             # Root layout
```

---

## Parallel Routes

Render multiple pages simultaneously in the same layout.

### Syntax: `@folderName`

```
app/
├── @dashboard/
│   └── page.tsx
├── @analytics/
│   └── page.tsx
├── layout.tsx
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  dashboard,
  analytics,
}: {
  children: React.ReactNode
  dashboard: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <div>
      {children}
      <div className="panels">
        {dashboard}
        {analytics}
      </div>
    </div>
  )
}
```

### Default Files
```
app/
├── @team/
│   ├── page.tsx           # Shown at /
│   └── settings/page.tsx  # Shown at /settings
├── @analytics/
│   ├── page.tsx
│   └── default.tsx        # Fallback when no match
└── layout.tsx
```

---

## Intercepting Routes

Load a route within the current layout (modal patterns).

### Convention
| Pattern | Matches |
|---------|---------|
| `(.)` | Same level |
| `(..)` | One level up |
| `(..)(..)` | Two levels up |
| `(...)` | Root app directory |

### Modal Example
```
app/
├── @modal/
│   └── (.)photo/
│       └── [id]/
│           └── page.tsx   # Modal view
├── photo/
│   └── [id]/
│       └── page.tsx       # Full page view
├── layout.tsx
└── page.tsx
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

## Navigation

### Link Component
```typescript
import Link from "next/link"

export function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/posts/1">Post 1</Link>
      <Link href={{ pathname: "/posts", query: { sort: "asc" } }}>
        Posts (sorted)
      </Link>
    </nav>
  )
}
```

### Programmatic Navigation
```typescript
"use client"

import { useRouter } from "next/navigation"

export function LoginButton() {
  const router = useRouter()

  function handleLogin() {
    // ... authenticate
    router.push("/dashboard")
  }

  return <button onClick={handleLogin}>Login</button>
}
```

### Router Methods
```typescript
const router = useRouter()

router.push("/dashboard")        // Navigate to route
router.replace("/login")         // Replace current history entry
router.refresh()                 // Refresh current route
router.prefetch("/about")        // Prefetch route
router.back()                    // Go back
router.forward()                 // Go forward
```

---

## Route Handlers (API Routes)

### Basic Handler
```typescript
// app/api/posts/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const posts = await getPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}
```

### Dynamic Route Handler
```typescript
// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await getPost(params.id)

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}
```

---

## Hooks

### usePathname
```typescript
"use client"

import { usePathname } from "next/navigation"

export function NavLink({ href, children }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <a href={href} className={isActive ? "active" : ""}>
      {children}
    </a>
  )
}
```

### useSearchParams
```typescript
"use client"

import { useSearchParams } from "next/navigation"

export function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")

  return <div>Searching for: {query}</div>
}
```

### useParams
```typescript
"use client"

import { useParams } from "next/navigation"

export function PostInfo() {
  const params = useParams()
  // For /posts/[id] -> params.id
  return <div>Post ID: {params.id}</div>
}
```

### useSelectedLayoutSegment
```typescript
"use client"

import { useSelectedLayoutSegment } from "next/navigation"

export function NavTabs() {
  const segment = useSelectedLayoutSegment()
  // Returns the active child segment

  return (
    <nav>
      <a className={segment === "posts" ? "active" : ""}>Posts</a>
      <a className={segment === "users" ? "active" : ""}>Users</a>
    </nav>
  )
}
```

---

## Redirects

### In Server Components
```typescript
import { redirect } from "next/navigation"

export default async function Page() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <div>Welcome {user.name}</div>
}
```

### In Route Handlers
```typescript
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // ...
}
```

### Permanent Redirect
```typescript
import { permanentRedirect } from "next/navigation"

export default function Page() {
  permanentRedirect("/new-location")
}
```

---

## Middleware

```typescript
// middleware.ts (at project root)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check auth
  const token = request.cookies.get("token")

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}
```

---

**Last Updated**: January 2026
