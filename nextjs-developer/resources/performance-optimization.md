# Next.js Performance Optimization

## Overview

Next.js provides built-in performance optimizations. This guide covers best practices for maximizing application performance.

---

## Image Optimization

### Using next/image
```typescript
import Image from "next/image"

export function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Load immediately for LCP
    />
  )
}
```

### Responsive Images
```typescript
<Image
  src="/photo.jpg"
  alt="Photo"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

### Remote Images
```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/images/**",
      },
    ],
  },
}
```

### Image Props Reference
| Prop | Purpose |
|------|---------|
| `priority` | Preload image (use for LCP) |
| `loading="lazy"` | Lazy load (default for non-priority) |
| `placeholder="blur"` | Show blur while loading |
| `quality={75}` | Image quality (1-100) |
| `fill` | Fill parent container |
| `sizes` | Responsive size hints |

---

## Font Optimization

### Using next/font
```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Local Fonts
```typescript
import localFont from "next/font/local"

const myFont = localFont({
  src: "./my-font.woff2",
  display: "swap",
})

export default function Layout({ children }) {
  return (
    <html className={myFont.className}>
      <body>{children}</body>
    </html>
  )
}
```

---

## Script Optimization

### Using next/script
```typescript
import Script from "next/script"

export default function Page() {
  return (
    <>
      {/* Load after page is interactive */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="afterInteractive"
      />

      {/* Load during browser idle time */}
      <Script
        src="https://widget.example.com/script.js"
        strategy="lazyOnload"
      />

      {/* Block page load (rarely needed) */}
      <Script
        src="https://critical.example.com/script.js"
        strategy="beforeInteractive"
      />
    </>
  )
}
```

### Script Strategies
| Strategy | When to Use |
|----------|-------------|
| `beforeInteractive` | Critical scripts that must load before hydration |
| `afterInteractive` | Analytics, tracking (default) |
| `lazyOnload` | Low-priority scripts |
| `worker` | Load in web worker (experimental) |

---

## Caching Strategies

### Static Data (Default)
```typescript
// Cached indefinitely
async function getData() {
  const res = await fetch("https://api.example.com/data")
  return res.json()
}
```

### Time-Based Revalidation
```typescript
// Revalidate every hour
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 },
  })
  return res.json()
}
```

### On-Demand Revalidation
```typescript
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from "next/cache"

export async function POST(request: Request) {
  const { tag, path } = await request.json()

  if (tag) {
    revalidateTag(tag)
  } else if (path) {
    revalidatePath(path)
  }

  return Response.json({ revalidated: true })
}
```

### Route Segment Config
```typescript
// Force dynamic rendering
export const dynamic = "force-dynamic"

// Force static rendering
export const dynamic = "force-static"

// Set revalidation time
export const revalidate = 3600
```

---

## Bundle Optimization

### Dynamic Imports
```typescript
import dynamic from "next/dynamic"

// Load component only when needed
const HeavyChart = dynamic(() => import("./heavy-chart"), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Disable SSR for client-only components
})

export default function Dashboard() {
  return <HeavyChart />
}
```

### Named Exports
```typescript
const Chart = dynamic(
  () => import("./charts").then((mod) => mod.LineChart),
  { loading: () => <p>Loading...</p> }
)
```

### Code Splitting by Route
Routes are automatically code-split. Each page only loads its dependencies.

---

## Streaming and Suspense

### Loading UI
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}
```

### Granular Suspense
```typescript
import { Suspense } from "react"

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Chart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  )
}
```

---

## Server Components

### Benefits
- Zero JavaScript sent to client
- Direct backend access
- Improved initial load time
- Better SEO

### Best Practices
```typescript
// GOOD: Server Component (default)
export default async function PostList() {
  const posts = await db.post.findMany()
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

// Only use "use client" when needed
"use client"
export function InteractiveButton() {
  const [clicked, setClicked] = useState(false)
  return <button onClick={() => setClicked(true)}>Click</button>
}
```

---

## Prefetching

### Automatic Prefetching
Links in viewport are automatically prefetched:
```typescript
import Link from "next/link"

// Prefetched automatically when visible
<Link href="/about">About</Link>

// Disable prefetching
<Link href="/heavy-page" prefetch={false}>Heavy Page</Link>
```

### Manual Prefetching
```typescript
"use client"

import { useRouter } from "next/navigation"

export function PrefetchButton() {
  const router = useRouter()

  return (
    <button
      onMouseEnter={() => router.prefetch("/dashboard")}
      onClick={() => router.push("/dashboard")}
    >
      Go to Dashboard
    </button>
  )
}
```

---

## Metadata Optimization

### Static Metadata
```typescript
export const metadata = {
  title: "My Site",
  description: "Welcome to my site",
  openGraph: {
    title: "My Site",
    description: "Welcome to my site",
    images: ["/og-image.jpg"],
  },
}
```

### Dynamic Metadata
```typescript
export async function generateMetadata({ params }) {
  const post = await getPost(params.id)

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

---

## Build Optimization

### Analyze Bundle
```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

module.exports = withBundleAnalyzer({})

# Run analysis
ANALYZE=true npm run build
```

### Optimize Dependencies
```typescript
// next.config.js
module.exports = {
  // Reduce moment.js bundle size
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "moment/locale": false,
    }
    return config
  },
}
```

---

## Performance Checklist

### Images
- [ ] Use `next/image` for all images
- [ ] Add `priority` to LCP image
- [ ] Provide `sizes` for responsive images
- [ ] Use appropriate quality settings

### Fonts
- [ ] Use `next/font` for all fonts
- [ ] Specify `display: swap`
- [ ] Subset fonts to needed characters

### JavaScript
- [ ] Use Server Components by default
- [ ] Dynamic import heavy components
- [ ] Analyze bundle size regularly

### Data Fetching
- [ ] Implement appropriate caching
- [ ] Use parallel data fetching
- [ ] Stream content with Suspense

### Core Web Vitals
- [ ] Optimize LCP (largest contentful paint)
- [ ] Minimize CLS (cumulative layout shift)
- [ ] Reduce FID/INP (interaction delay)

---

**Last Updated**: January 2026
