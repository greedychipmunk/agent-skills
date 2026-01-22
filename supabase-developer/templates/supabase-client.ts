// supabase-client.ts
// Client initialization with type safety for Supabase
// Place in: src/lib/supabase-client.ts or lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage (default for browser)
    persistSession: true,
    // Auto-refresh session before it expires
    autoRefreshToken: true,
    // Detect session from URL hash fragment
    detectSessionInUrl: true,
    // Storage key prefix
    storageKey: 'supabase.auth.token',
  },
  // Global headers for all requests
  global: {
    headers: {
      'x-application-name': 'my-app',
    },
  },
  // Database settings
  db: {
    schema: 'public',
  },
  // Realtime settings
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// =============================================================================
// SERVER-SIDE CLIENT (for SSR, API routes, Server Components)
// =============================================================================

/**
 * Create a Supabase client for server-side operations
 * This should be used in API routes, Server Components, or server-side functions
 */
export function createServerClient(accessToken?: string) {
  return createClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      },
    }
  )
}

// =============================================================================
// ADMIN CLIENT (for server-side admin operations)
// =============================================================================

/**
 * Create a Supabase client with service role key for admin operations
 * ⚠️ WARNING: Only use server-side! Never expose service_role key to client
 * This client bypasses Row Level Security policies
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// =============================================================================
// TYPE-SAFE HELPERS
// =============================================================================

/**
 * Type-safe table name helper
 */
export type TableName = keyof Database['public']['Tables']

/**
 * Type-safe row type helper
 */
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row']

/**
 * Type-safe insert type helper
 */
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/**
 * Type-safe update type helper
 */
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update']

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user or null
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get current user ID or throw error
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Sign out and clear session
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// =============================================================================
// ERROR HANDLING HELPER
// =============================================================================

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error)
  
  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    '23505': 'This record already exists',
    '23503': 'Referenced record does not exist',
    '42501': 'Permission denied',
    'PGRST301': 'Row not found',
  }

  const code = error?.code || error?.error_code
  const message = errorMessages[code] || error?.message || 'An error occurred'

  throw new Error(message)
}

// =============================================================================
// NEXT.JS SPECIFIC HELPERS
// =============================================================================

/**
 * Create Supabase client for Next.js Server Components
 * Requires @supabase/ssr package
 */
/*
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerComponentClient() {
  const cookieStore = cookies()

  return createSSRClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
*/

/**
 * Create Supabase client for Next.js API Routes
 * Requires @supabase/ssr package
 */
/*
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  return createSSRClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.delete(name)
        },
      },
    }
  )
}
*/

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Client-side usage (in components, pages)
import { supabase } from '@/lib/supabase-client'

const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')

// Server-side usage (API routes, Server Actions)
import { createServerClient } from '@/lib/supabase-client'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { data } = await supabase.from('posts').select('*')
  return Response.json(data)
}

// Admin operations (server-side only)
import { createAdminClient } from '@/lib/supabase-client'

const supabase = createAdminClient()
await supabase.from('users').update({ role: 'admin' }).eq('id', userId)

// Type-safe operations
import { supabase, type Row, type Insert } from '@/lib/supabase-client'

const newPost: Insert<'posts'> = {
  title: 'Hello World',
  author_id: userId,
}

const { data } = await supabase.from('posts').insert(newPost).select().single()
const post: Row<'posts'> = data
*/
