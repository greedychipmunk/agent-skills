/**
 * Server Component Page Template
 *
 * This template demonstrates a complete Server Component page with:
 * - Async data fetching
 * - Metadata generation
 * - Error handling
 * - Loading states via Suspense
 * - TypeScript types
 *
 * Usage:
 * 1. Copy to app/[route]/page.tsx
 * 2. Replace PAGE_NAME with your page name
 * 3. Implement your data fetching logic
 * 4. Update metadata and content
 *
 * Location: app/[route-name]/page.tsx
 */

import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

// ============================================================================
// TYPES
// ============================================================================

interface PageData {
  id: string
  title: string
  description: string
  content: string
  createdAt: string
  author: {
    name: string
    avatar: string
  }
}

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: "PAGE_NAME",
  description: "Description of this page for SEO",
  openGraph: {
    title: "PAGE_NAME",
    description: "Description of this page for social sharing",
    type: "website",
  },
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch page data from API or database
 * This runs on the server only
 */
async function getPageData(): Promise<PageData[]> {
  // Option 1: Fetch from external API
  const res = await fetch("https://api.example.com/data", {
    // Cache options:
    // cache: 'force-cache'     // Default: cache indefinitely
    // cache: 'no-store'        // Never cache (always fresh)
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  if (!res.ok) {
    throw new Error("Failed to fetch data")
  }

  return res.json()

  // Option 2: Direct database access
  // import { db } from "@/lib/db"
  // return db.items.findMany()
}

/**
 * Fetch a single item by ID
 */
async function getItemById(id: string): Promise<PageData | null> {
  const res = await fetch(`https://api.example.com/data/${id}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    return null
  }

  return res.json()
}

// ============================================================================
// SUB-COMPONENTS (Server Components)
// ============================================================================

/**
 * Data list component - fetches and displays items
 * Wrapped in Suspense for streaming
 */
async function DataList() {
  const items = await getPageData()

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No items found</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg">{item.title}</h3>
          <p className="text-gray-600 mt-1">{item.description}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>By {item.author.name}</span>
            <span className="mx-2">•</span>
            <time dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleDateString()}
            </time>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Loading skeleton for DataList
 */
function DataListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-4 border rounded-lg animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Main page component (Server Component by default)
 *
 * Benefits of Server Components:
 * - Zero JavaScript sent to client
 * - Direct database/API access
 * - Better SEO (full HTML rendered)
 * - Improved security (secrets stay on server)
 */
export default async function PAGE_NAMEPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">PAGE_NAME</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the PAGE_NAME page
        </p>
      </header>

      {/* Main Content with Streaming */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Items</h2>
        <Suspense fallback={<DataListSkeleton />}>
          <DataList />
        </Suspense>
      </section>
    </main>
  )
}

// ============================================================================
// ROUTE SEGMENT CONFIG (Optional)
// ============================================================================

// Force dynamic rendering (opt out of static generation)
// export const dynamic = 'force-dynamic'

// Set revalidation time for the entire route
// export const revalidate = 3600

// Generate static params for dynamic routes
// export async function generateStaticParams() {
//   const items = await getPageData()
//   return items.map((item) => ({ id: item.id }))
// }
