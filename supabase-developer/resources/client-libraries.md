# Client Libraries

## JavaScript/TypeScript

### Installation
```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

### Basic Setup
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### With Custom Options
```typescript
const supabase = createClient<Database>(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-custom-header': 'value'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### Type Generation
```bash
# Install CLI
npm install -D supabase

# Generate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

# Or from local database
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Using Generated Types
```typescript
import type { Database } from './types/database.types'

type Post = Database['public']['Tables']['posts']['Row']
type InsertPost = Database['public']['Tables']['posts']['Insert']
type UpdatePost = Database['public']['Tables']['posts']['Update']

// Typed queries
const { data } = await supabase
  .from('posts')
  .select('*')
  .returns<Post[]>()

// Typed inserts
const newPost: InsertPost = {
  title: 'Hello',
  content: 'World'
}
await supabase.from('posts').insert(newPost)
```

## Server-Side Rendering (Next.js)

### Installation
```bash
npm install @supabase/ssr
```

### Client Component
```typescript
// lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Component
```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies in Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Handle cookies in Server Component
          }
        },
      },
    }
  )
}
```

### Middleware
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if needed
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## React Hooks

### Auth Hook
```typescript
import { useState, useEffect, createContext, useContext } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthContext = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Data Hook
```typescript
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']

export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  query?: {
    select?: string
    filter?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    limit?: number
  }
) {
  const supabase = createClient()
  const [data, setData] = useState<Tables[T]['Row'][]>([])
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      let q = supabase.from(table).select(query?.select || '*')

      if (query?.filter) {
        Object.entries(query.filter).forEach(([key, value]) => {
          q = q.eq(key, value)
        })
      }

      if (query?.order) {
        q = q.order(query.order.column, {
          ascending: query.order.ascending ?? true
        })
      }

      if (query?.limit) {
        q = q.limit(query.limit)
      }

      const { data, error } = await q

      if (error) {
        setError(error)
      } else {
        setData(data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [table, JSON.stringify(query)])

  return { data, error, loading }
}
```

## Python

### Installation
```bash
pip install supabase
```

### Basic Setup
```python
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
```

### Authentication
```python
# Sign up
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "password123"
})

# Sign in
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "password123"
})

# Sign out
supabase.auth.sign_out()

# Get user
user = supabase.auth.get_user()
```

### Database Queries
```python
# Select
response = supabase.table('posts').select('*').execute()
data = response.data

# Select with filter
response = supabase.table('posts')\
    .select('*')\
    .eq('published', True)\
    .order('created_at', desc=True)\
    .execute()

# Insert
response = supabase.table('posts').insert({
    "title": "New Post",
    "content": "Content here"
}).execute()

# Update
response = supabase.table('posts')\
    .update({"title": "Updated Title"})\
    .eq('id', post_id)\
    .execute()

# Delete
response = supabase.table('posts')\
    .delete()\
    .eq('id', post_id)\
    .execute()
```

### Storage
```python
# Upload
with open('file.pdf', 'rb') as f:
    response = supabase.storage.from_('documents').upload(
        'path/file.pdf',
        f,
        {'content-type': 'application/pdf'}
    )

# Download
response = supabase.storage.from_('documents').download('path/file.pdf')

# Get URL
url = supabase.storage.from_('documents').get_public_url('path/file.pdf')
```

## Flutter/Dart

### Installation
```yaml
# pubspec.yaml
dependencies:
  supabase_flutter: ^2.0.0
```

### Setup
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );

  runApp(MyApp());
}

final supabase = Supabase.instance.client;
```

### Authentication
```dart
// Sign up
final response = await supabase.auth.signUp(
  email: 'user@example.com',
  password: 'password123',
);

// Sign in
final response = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password123',
);

// OAuth
await supabase.auth.signInWithOAuth(
  OAuthProvider.google,
  redirectTo: 'io.supabase.myapp://login-callback/',
);

// Listen to auth changes
supabase.auth.onAuthStateChange.listen((data) {
  final AuthChangeEvent event = data.event;
  final Session? session = data.session;
});
```

### Database
```dart
// Select
final data = await supabase
    .from('posts')
    .select()
    .eq('published', true)
    .order('created_at');

// Insert
await supabase.from('posts').insert({
  'title': 'New Post',
  'content': 'Content here',
});

// Stream (realtime)
supabase.from('posts').stream(primaryKey: ['id']).listen((data) {
  print('Posts changed: $data');
});
```

## Swift (iOS)

### Installation
```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
]
```

### Setup
```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
    supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)
```

### Usage
```swift
// Select
let posts: [Post] = try await supabase
    .from("posts")
    .select()
    .eq("published", value: true)
    .execute()
    .value

// Insert
try await supabase
    .from("posts")
    .insert(Post(title: "New Post", content: "Content"))
    .execute()

// Auth
try await supabase.auth.signIn(
    email: "user@example.com",
    password: "password123"
)
```

## Kotlin (Android)

### Installation
```kotlin
// build.gradle.kts
dependencies {
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
    implementation("io.github.jan-tennert.supabase:auth-kt:2.0.0")
    implementation("io.ktor:ktor-client-android:2.3.0")
}
```

### Setup
```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = "YOUR_SUPABASE_URL",
    supabaseKey = "YOUR_SUPABASE_ANON_KEY"
) {
    install(Auth)
    install(Postgrest)
}
```

### Usage
```kotlin
// Select
val posts = supabase.from("posts")
    .select()
    .decodeList<Post>()

// Insert
supabase.from("posts").insert(Post(
    title = "New Post",
    content = "Content"
))

// Auth
supabase.auth.signInWith(Email) {
    email = "user@example.com"
    password = "password123"
}
```

## Edge Function Invocation

### JavaScript
```typescript
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'World' },
  headers: { 'x-custom-header': 'value' }
})
```

### Python
```python
response = supabase.functions.invoke(
    'hello-world',
    invoke_options={
        'body': {'name': 'World'}
    }
)
```

### Dart
```dart
final response = await supabase.functions.invoke(
  'hello-world',
  body: {'name': 'World'},
);
```
