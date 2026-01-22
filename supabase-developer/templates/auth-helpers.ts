// auth-helpers.ts
// Authentication utility functions and React hooks
// Place in: src/lib/auth-helpers.ts or hooks/use-auth.ts

import { useEffect, useState } from 'react'
import { supabase } from './supabase-client'
import type { User, Session, AuthError, Provider } from '@supabase/supabase-js'

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get redirect URL for current environment
 * Falls back to provided URL or throws error if not available
 */
function getRedirectUrl(path: string = '/auth/callback'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  throw new Error('Redirect URL must be provided in server-side environments')
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    full_name?: string
    username?: string
    avatar_url?: string
    [key: string]: any
  },
  redirectTo?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: redirectTo || getRedirectUrl(),
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || getRedirectUrl(),
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: Provider, redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || getRedirectUrl(),
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with phone and password
 */
export async function signInWithPhone(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign in with phone OTP
 */
export async function sendPhoneOTP(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  })

  if (error) throw error
  return data
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) throw error
  return data
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || getRedirectUrl('/auth/reset-password'),
  })

  if (error) throw error
  return data
}

/**
 * Update password (must be authenticated)
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: {
  full_name?: string
  avatar_url?: string
  [key: string]: any
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })

  if (error) throw error
  return data
}

/**
 * Update email (requires confirmation)
 */
export async function updateEmail(newEmail: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) throw error
  return data
}

/**
 * Resend confirmation email
 */
export async function resendConfirmation(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) throw error
  return data
}

// =============================================================================
// MULTI-FACTOR AUTHENTICATION (MFA)
// =============================================================================

/**
 * Enroll for MFA/TOTP
 */
export async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  })

  if (error) throw error
  return data
}

/**
 * Verify MFA enrollment with TOTP code
 */
export async function verifyMFAEnrollment(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  if (error) throw error

  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: data.id,
    code,
  })

  if (verifyError) throw verifyError
  return verifyData
}

/**
 * Unenroll from MFA
 */
export async function unenrollMFA(factorId: string) {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
  return data
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data
}

/**
 * Set session from tokens (useful for SSR)
 */
export async function setSession(accessToken: string, refreshToken: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) throw error
  return data
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook to get current user and loading state
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getUser().then((user) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

/**
 * Hook to get current session and loading state
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getSession().then((session) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

/**
 * Hook for authentication state with detailed events
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Get initial session
    getSession()
      .then((session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle specific events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in')
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed')
            break
          case 'USER_UPDATED':
            console.log('User updated')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
  }
}

/**
 * Hook to require authentication (redirects if not authenticated)
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if email is confirmed
 */
export function isEmailConfirmed(user: User | null): boolean {
  return !!user?.email_confirmed_at
}

/**
 * Check if phone is confirmed
 */
export function isPhoneConfirmed(user: User | null): boolean {
  return !!user?.phone_confirmed_at
}

/**
 * Get user's email
 */
export function getUserEmail(user: User | null): string | undefined {
  return user?.email
}

/**
 * Get user's metadata
 */
export function getUserMetadata<T = any>(user: User | null): T | undefined {
  return user?.user_metadata as T
}

/**
 * Format auth error for display
 */
export function formatAuthError(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please confirm your email address',
    'user_already_exists': 'An account with this email already exists',
    'weak_password': 'Password is too weak. Use at least 8 characters.',
    'invalid_email': 'Invalid email address',
  }

  return errorMessages[error.message] || error.message || 'An error occurred'
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Sign up
import { signUpWithEmail } from '@/lib/auth-helpers'

try {
  await signUpWithEmail('user@example.com', 'password123', {
    full_name: 'John Doe',
    username: 'johndoe',
  })
  console.log('Check your email for confirmation')
} catch (error) {
  console.error('Sign up error:', error)
}

// Sign in
import { signInWithEmail } from '@/lib/auth-helpers'

try {
  const { user, session } = await signInWithEmail('user@example.com', 'password123')
  console.log('Signed in:', user)
} catch (error) {
  console.error('Sign in error:', error)
}

// Use in React component
import { useAuth } from '@/lib/auth-helpers'

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return <div>Welcome, {user.email}!</div>
}

// Require authentication
import { useRequireAuth } from '@/lib/auth-helpers'

function ProtectedPage() {
  const { user, loading } = useRequireAuth('/login')

  if (loading) return <div>Loading...</div>

  return <div>Protected content for {user.email}</div>
}
*/
