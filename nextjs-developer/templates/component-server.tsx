/**
 * Server Component Template
 *
 * This template demonstrates a Server Component with:
 * - Async data fetching
 * - Composition with other components
 * - Type-safe props
 * - Streaming with Suspense
 * - Error handling patterns
 *
 * Server Components are the default in Next.js App Router.
 * Use them when you:
 * - Need to fetch data
 * - Access backend resources
 * - Keep sensitive information on the server
 * - Have large dependencies
 *
 * Usage:
 * 1. Copy to components/[name].tsx
 * 2. Replace COMPONENT_NAME with your component name
 * 3. Implement your data fetching and rendering logic
 *
 * Location: components/[component-name].tsx
 */

import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: "admin" | "user" | "guest"
  createdAt: string
}

interface Post {
  id: string
  title: string
  excerpt: string
  publishedAt: string
  author: User
}

interface COMPONENT_NAMEProps {
  userId: string
  showPosts?: boolean
  className?: string
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch user data
 * This runs on the server only
 */
async function getUser(userId: string): Promise<User | null> {
  try {
    const res = await fetch(`https://api.example.com/users/${userId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

/**
 * Fetch user's posts
 */
async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const res = await fetch(`https://api.example.com/users/${userId}/posts`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!res.ok) return []
    return res.json()
  } catch (error) {
    console.error("Error fetching posts:", error)
    return []
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * User avatar component
 */
function UserAvatar({
  src,
  name,
  size = "md",
}: {
  src: string
  name: string
  size?: "sm" | "md" | "lg"
}) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size === "lg" ? 64 : size === "md" ? 48 : 32}
      height={size === "lg" ? 64 : size === "md" ? 48 : 32}
      className={`${sizes[size]} rounded-full object-cover`}
    />
  )
}

/**
 * Role badge component
 */
function RoleBadge({ role }: { role: User["role"] }) {
  const colors = {
    admin: "bg-red-100 text-red-800",
    user: "bg-blue-100 text-blue-800",
    guest: "bg-gray-100 text-gray-800",
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role]}`}
    >
      {role}
    </span>
  )
}

/**
 * User posts list (async component for streaming)
 */
async function UserPostsList({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId)

  if (posts.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No posts yet</p>
    )
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li key={post.id} className="border-b pb-3 last:border-0">
          <Link
            href={`/posts/${post.id}`}
            className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
          >
            <h4 className="font-medium text-sm">{post.title}</h4>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
              {post.excerpt}
            </p>
            <time
              dateTime={post.publishedAt}
              className="text-gray-400 text-xs mt-1 block"
            >
              {new Date(post.publishedAt).toLocaleDateString()}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Loading skeleton for posts
 */
function PostsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * User info section
 */
function UserInfo({ user }: { user: User }) {
  return (
    <div className="flex items-start gap-4">
      <UserAvatar src={user.avatar} name={user.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg truncate">{user.name}</h3>
          <RoleBadge role={user.role} />
        </div>
        <p className="text-gray-600 text-sm truncate">{user.email}</p>
        <p className="text-gray-400 text-xs mt-1">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

/**
 * User stats section
 */
async function UserStats({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId)

  return (
    <div className="flex gap-4 mt-4 pt-4 border-t">
      <div className="text-center">
        <p className="text-2xl font-bold">{posts.length}</p>
        <p className="text-xs text-gray-500">Posts</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">0</p>
        <p className="text-xs text-gray-500">Followers</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">0</p>
        <p className="text-xs text-gray-500">Following</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * User profile card component (Server Component)
 *
 * Benefits:
 * - Zero JavaScript sent to client for this component
 * - Direct data fetching without client-side state
 * - Better SEO (full HTML rendered)
 * - Secrets and API keys stay on server
 */
export async function COMPONENT_NAME({
  userId,
  showPosts = true,
  className = "",
}: COMPONENT_NAMEProps) {
  // Fetch user data
  const user = await getUser(userId)

  // Handle not found
  if (!user) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* User Info */}
      <UserInfo user={user} />

      {/* User Stats (streamed) */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded mt-4" />}>
        <UserStats userId={userId} />
      </Suspense>

      {/* User Posts (optional, streamed) */}
      {showPosts && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Recent Posts</h4>
          <Suspense fallback={<PostsListSkeleton />}>
            <UserPostsList userId={userId} />
          </Suspense>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-4 border-t flex gap-2">
        <Link
          href={`/users/${userId}`}
          className="flex-1 text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
        >
          View Profile
        </Link>
        <Link
          href={`/messages/new?to=${userId}`}
          className="flex-1 text-center px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          Message
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In a page component:
import { COMPONENT_NAME } from "@/components/component-name"

export default async function UserPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <COMPONENT_NAME userId={params.id} showPosts={true} />
    </main>
  )
}

// With Suspense wrapper for full streaming:
import { Suspense } from "react"

export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<UserCardSkeleton />}>
        <COMPONENT_NAME userId={params.id} />
      </Suspense>
    </main>
  )
}
*/

// Export with default for convenience
export default COMPONENT_NAME
