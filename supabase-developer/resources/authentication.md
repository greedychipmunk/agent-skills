# Authentication

## Overview

Supabase Auth provides a complete authentication system with:
- Email/password authentication
- Magic link (passwordless) authentication
- OAuth providers (Google, GitHub, Discord, etc.)
- Phone/SMS authentication
- Multi-factor authentication (MFA)
- Session management with JWTs

## Client Setup

### Browser Client
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server-Side Client (Next.js)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}
```

## Email Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-123',
  options: {
    data: {
      full_name: 'John Doe',
      username: 'johndoe'
    },
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})

if (error) {
  console.error('Sign up error:', error.message)
} else if (data.user && !data.session) {
  // Email confirmation required
  console.log('Please check your email for confirmation')
}
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password-123'
})

if (error) {
  if (error.message === 'Invalid login credentials') {
    // Handle invalid credentials
  } else if (error.message === 'Email not confirmed') {
    // Handle unconfirmed email
  }
}
```

### Password Reset
```typescript
// Request reset
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: `${window.location.origin}/auth/reset-password`
  }
)

// Update password (after redirect)
const { error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

## Magic Link (Passwordless)

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})
```

## OAuth Providers

### Available Providers
- Google
- GitHub
- GitLab
- Discord
- Twitter/X
- Facebook
- Apple
- Azure
- Bitbucket
- LinkedIn
- Slack
- Spotify
- Twitch
- And more...

### Sign In with OAuth
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})

// GitHub with specific scopes
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'read:user user:email'
  }
})
```

### OAuth Callback Handler
```typescript
// app/auth/callback/route.ts (Next.js)
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

## Phone Authentication

```typescript
// Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890'
})

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms'
})
```

## Multi-Factor Authentication (MFA)

### Enroll MFA
```typescript
// Start enrollment
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Authenticator App'
})

if (data) {
  // Show QR code to user
  console.log('QR Code URL:', data.totp.qr_code)
  console.log('Secret:', data.totp.secret)
}

// Verify and complete enrollment
const { data: challengeData } = await supabase.auth.mfa.challenge({
  factorId: data.id
})

const { error: verifyError } = await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challengeData.id,
  code: '123456' // From authenticator app
})
```

### Sign In with MFA
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Check if MFA is required
const { data: { totp } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

if (totp.currentLevel !== totp.nextLevel) {
  // MFA verification needed
  const factors = await supabase.auth.mfa.listFactors()
  const totpFactor = factors.data.totp[0]

  const { data: challenge } = await supabase.auth.mfa.challenge({
    factorId: totpFactor.id
  })

  const { error } = await supabase.auth.mfa.verify({
    factorId: totpFactor.id,
    challengeId: challenge.id,
    code: '123456'
  })
}
```

## Session Management

### Get Current User
```typescript
// Get user from session (fast, uses cached data)
const { data: { user } } = await supabase.auth.getUser()

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Access token for API calls
const accessToken = session?.access_token
```

### Listen to Auth Changes
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    switch (event) {
      case 'INITIAL_SESSION':
        // Handle initial session load
        break
      case 'SIGNED_IN':
        // Handle sign in
        break
      case 'SIGNED_OUT':
        // Handle sign out
        break
      case 'TOKEN_REFRESHED':
        // Handle token refresh
        break
      case 'USER_UPDATED':
        // Handle user update
        break
      case 'PASSWORD_RECOVERY':
        // Handle password recovery
        break
    }
  }
)

// Cleanup
subscription.unsubscribe()
```

### Sign Out
```typescript
// Sign out current session
const { error } = await supabase.auth.signOut()

// Sign out all sessions (all devices)
const { error } = await supabase.auth.signOut({ scope: 'global' })
```

## User Management

### Update User
```typescript
// Update email
const { data, error } = await supabase.auth.updateUser({
  email: 'new-email@example.com'
})

// Update password
const { data, error } = await supabase.auth.updateUser({
  password: 'new-password'
})

// Update user metadata
const { data, error } = await supabase.auth.updateUser({
  data: {
    full_name: 'New Name',
    avatar_url: 'https://...'
  }
})
```

### Delete User
```typescript
// Users can delete themselves
const { error } = await supabase.auth.admin.deleteUser(userId)

// Or use an Edge Function with service role
```

## Protected Routes

### Client-Side Protection
```typescript
// React hook for auth state
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Protected component
function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) return <Loading />
  if (!user) return null

  return <div>Protected content</div>
}
```

### Server-Side Protection (Next.js)
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Welcome, {user.email}</div>
}
```

### Middleware Protection
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup']
}
```

## Email Templates

Configure in Supabase Dashboard under Authentication > Email Templates:

- **Confirm signup**: Sent when a user signs up
- **Invite user**: Sent when inviting a user
- **Magic Link**: Sent for passwordless login
- **Change Email Address**: Sent when changing email
- **Reset Password**: Sent for password reset

### Template Variables
- `{{ .SiteURL }}` - Your site URL
- `{{ .Token }}` - The auth token
- `{{ .TokenHash }}` - Hashed token for URL
- `{{ .RedirectTo }}` - Redirect URL
- `{{ .Email }}` - User's email
- `{{ .NewEmail }}` - New email (for changes)

## Security Best Practices

1. **Always use HTTPS** in production
2. **Validate email domains** if restricting signups
3. **Enable email confirmation** for production
4. **Use strong password requirements**
5. **Implement rate limiting** for auth endpoints
6. **Enable MFA** for sensitive applications
7. **Use short session expiry** with refresh tokens
8. **Never expose service role key** to clients
9. **Validate redirect URLs** to prevent open redirects
10. **Log auth events** for security monitoring
