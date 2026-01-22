# Supabase Developer Templates

This directory contains production-ready code templates for Supabase applications. These templates follow best practices and include comprehensive examples.

## Database Templates

### schema-base.sql
**Complete database schema foundation with profiles, posts, comments, and RLS policies.**

**Features:**
- Extensions setup (uuid-ossp, moddatetime, pgcrypto)
- Custom types (enums)
- Profiles table extending auth.users
- Example content tables (posts, comments)
- Automatic triggers for updated_at timestamps
- Auto-create profile on user signup
- Comprehensive RLS policies
- Performance indexes
- Constraints and validation

**Use this template for:**
- Starting a new Supabase project
- Understanding table relationships
- Learning RLS policy patterns
- Setting up user profiles

**Usage:**
```bash
# Create a new migration with this template
./scripts/create-migration.sh initial_schema

# Copy content from template
cat templates/schema-base.sql > supabase/migrations/[timestamp]_initial_schema.sql

# Apply migration
./scripts/run-migrations.sh --local
```

**Customize by:**
- Replacing example tables (posts, comments) with your domain models
- Adjusting RLS policies to match your security requirements
- Adding/removing custom types
- Modifying constraints

---

### rls-policies.sql
**Common Row Level Security (RLS) policy patterns and examples.**

**Patterns included:**
1. **Public Read, Authenticated Write** - Public content that only authenticated users can create
2. **User-Owned Resources** - Users can only access their own data
3. **Role-Based Access Control** - Different access based on user roles
4. **Organization/Team-Based** - Multi-tenant access patterns
5. **Shared/Collaborative** - Resources shared between users
6. **Conditional Relationships** - Access based on table relationships
7. **Time-Based Access** - Content available during specific periods
8. **Hierarchical/Parent-Child** - Access to child records based on parent access
9. **Custom Function-Based** - Complex logic in reusable functions
10. **Anonymous vs Authenticated** - Different levels for logged-in vs guest users

**Use this template for:**
- Understanding RLS policy patterns
- Implementing secure data access
- Multi-tenant applications
- Complex authorization logic

**Usage:**
```sql
-- Copy relevant patterns to your migration files
-- Adjust table names and conditions to match your schema

-- Example: User-owned resources
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);
```

**Performance tips:**
- Add indexes on columns used in policies
- Use security definer functions for complex checks
- Test policies with EXPLAIN ANALYZE
- Use the test-rls.sh script for testing

---

## Client Templates

### supabase-client.ts
**Type-safe Supabase client initialization with utilities.**

**Features:**
- Typed Supabase client with Database types
- Client-side browser client
- Server-side client factory
- Admin client with service role (server-only)
- Type-safe helpers (Row, Insert, Update types)
- Authentication utilities
- Error handling helper
- Next.js specific helpers (commented)

**Use this template for:**
- Initializing Supabase in your application
- Type-safe database operations
- Server-side and client-side operations
- Admin operations (server-only)

**Usage:**
```bash
# Copy to your project
cp templates/supabase-client.ts src/lib/supabase-client.ts

# Update imports based on your project structure
# Generate types first: ./scripts/generate-types.sh
```

**Client types:**
- `supabase` - Browser client (default)
- `createServerClient()` - Server-side with user context
- `createAdminClient()` - Server-side admin (bypasses RLS)

**Example:**
```typescript
import { supabase } from '@/lib/supabase-client'

const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
```

---

### auth-helpers.ts
**Complete authentication utilities and React hooks.**

**Features:**
- Email/password authentication
- Magic link (passwordless)
- OAuth providers (Google, GitHub, etc.)
- Phone authentication with OTP
- Multi-Factor Authentication (MFA/TOTP)
- Password reset and update
- Session management
- React hooks: `useUser`, `useSession`, `useAuth`, `useRequireAuth`
- Error formatting utilities

**Use this template for:**
- Adding authentication to your app
- React components that need user state
- Protected routes and pages
- User profile management

**Usage:**
```bash
cp templates/auth-helpers.ts src/lib/auth-helpers.ts
```

**Common operations:**
```typescript
// Sign up
await signUpWithEmail('user@example.com', 'password', {
  full_name: 'John Doe'
})

// Sign in
await signInWithEmail('user@example.com', 'password')

// Use in component
function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome {user.email}</div>
}
```

---

### storage-helpers.ts
**File upload/download utilities for Supabase Storage.**

**Features:**
- File upload with options
- Multi-file upload
- Upload with progress tracking
- Image compression and upload
- File download
- Public and signed URLs
- File management (list, delete, move, copy)
- Bucket management
- Image transformation URLs
- Validation utilities
- React hooks: `useFileUpload`

**Use this template for:**
- File uploads (avatars, documents, images)
- Image galleries
- Document management
- User-generated content

**Usage:**
```bash
cp templates/storage-helpers.ts src/lib/storage-helpers.ts
```

**Common operations:**
```typescript
// Upload file
const path = generateFilePath(userId, file.name, 'avatars')
await uploadFile('avatars', path, file)

// Get public URL
const url = getPublicUrl('avatars', path)

// Use in React component
function UploadForm() {
  const { upload, uploading, progress } = useFileUpload()
  
  const handleUpload = async (file: File) => {
    const path = `uploads/${Date.now()}_${file.name}`
    await upload('public', path, file)
  }
  
  return (
    <>
      {uploading && <progress value={progress} max={100} />}
      <input type="file" onChange={e => handleUpload(e.target.files[0])} />
    </>
  )
}
```

---

## Edge Function Templates

### edge-function-complete.ts
**Complete Edge Function template with common patterns.**

**Features:**
- CORS handling
- Authentication (required and optional)
- Request body validation
- Type-safe Supabase clients (user context and service role)
- Error handling
- Success/error response helpers
- RESTful route handlers (GET, POST, PUT, DELETE)
- Common patterns (webhooks, scheduled tasks, email, external APIs, rate limiting)

**Use this template for:**
- Creating new Edge Functions
- API endpoints
- Webhooks
- Background jobs
- Third-party integrations

**Usage:**
```bash
# Create function with boilerplate
./scripts/create-function.sh my-function

# Replace with complete template
cp templates/edge-function-complete.ts supabase/functions/my-function/index.ts

# Customize route handlers and logic
```

**Common patterns included:**
1. **Webhook Handler** - Verify signatures and process webhooks
2. **Scheduled Task** - Cron job operations
3. **Email Sending** - Integration with email services
4. **External API** - Call third-party APIs
5. **Rate Limiting** - Prevent abuse
6. **File Upload** - Upload to Storage
7. **Realtime Broadcast** - Send realtime messages

**Example:**
```typescript
// Add your logic in the route handlers
case 'POST': {
  const { action, data } = body
  
  switch (action) {
    case 'create':
      // Your creation logic
      break
    case 'update':
      // Your update logic
      break
  }
}
```

---

## Template Usage Guidelines

### Getting Started

1. **Copy templates to your project:**
   ```bash
   # Database templates go in migrations
   cp templates/schema-base.sql supabase/migrations/[timestamp]_initial.sql
   
   # Client templates go in your source code
   cp templates/supabase-client.ts src/lib/
   cp templates/auth-helpers.ts src/lib/
   cp templates/storage-helpers.ts src/lib/
   
   # Edge function templates
   cp templates/edge-function-complete.ts supabase/functions/[name]/index.ts
   ```

2. **Customize for your needs:**
   - Replace placeholder names with your domain models
   - Adjust types and interfaces
   - Remove unused code
   - Add your business logic

3. **Generate TypeScript types:**
   ```bash
   ./scripts/generate-types.sh
   ```

4. **Test thoroughly:**
   ```bash
   ./scripts/run-tests.sh
   ./scripts/test-rls.sh profiles
   ```

### Customization Tips

**Database Templates:**
- Start with schema-base.sql and modify tables
- Use rls-policies.sql as a reference for security
- Always test RLS policies before deployment
- Add indexes for frequently queried columns

**Client Templates:**
- Update import paths to match your project structure
- Adjust error messages for your UX
- Add custom utility functions as needed
- Configure client options based on your requirements

**Edge Function Templates:**
- Remove unused route handlers
- Add your business logic in the switch cases
- Configure CORS for your domains
- Add proper error handling for your use cases

### Best Practices

1. **Type Safety:**
   - Always use generated Database types
   - Define interfaces for request/response bodies
   - Use TypeScript strict mode

2. **Security:**
   - Never expose service role key to clients
   - Always validate user input
   - Test RLS policies thoroughly
   - Use parameterized queries

3. **Performance:**
   - Add database indexes
   - Optimize queries with select()
   - Use pagination for large datasets
   - Cache frequently accessed data

4. **Error Handling:**
   - Provide meaningful error messages
   - Log errors for debugging
   - Handle edge cases
   - Don't expose sensitive information in errors

5. **Testing:**
   - Write tests for critical paths
   - Test authentication flows
   - Test RLS policies
   - Test Edge Functions locally before deploying

### Common Customizations

**Adding a new table:**
```sql
-- 1. Copy table structure from schema-base.sql
create table public.my_table (
  id uuid default uuid_generate_v4() primary key,
  -- Add your columns
  created_at timestamptz default now() not null
);

-- 2. Enable RLS
alter table public.my_table enable row level security;

-- 3. Add policies from rls-policies.sql
-- 4. Add triggers if needed
-- 5. Add indexes
```

**Creating a client function:**
```typescript
// Add to supabase-client.ts or create a new file
export async function getMyData(userId: string) {
  const { data, error } = await supabase
    .from('my_table')
    .select('*')
    .eq('user_id', userId)
  
  if (error) handleSupabaseError(error)
  return data
}
```

**Adding an Edge Function route:**
```typescript
// In edge-function-complete.ts
case 'my-action': {
  // Validate input
  if (!requestData.field) {
    return errorResponse('Missing field')
  }
  
  // Process request
  const result = await processMyAction(requestData)
  
  return successResponse(result)
}
```

## Template Combinations

### Blog Application
1. schema-base.sql → Posts and comments tables
2. supabase-client.ts → Database access
3. auth-helpers.ts → User authentication
4. storage-helpers.ts → Image uploads
5. edge-function-complete.ts → Email notifications

### SaaS Application
1. schema-base.sql → Modified for organizations/teams
2. rls-policies.sql → Organization-based policies
3. supabase-client.ts → Type-safe client
4. auth-helpers.ts → User management
5. edge-function-complete.ts → Webhooks and billing

### Social Media App
1. schema-base.sql → Users, posts, comments, likes
2. rls-policies.sql → Privacy settings
3. supabase-client.ts → Realtime subscriptions
4. storage-helpers.ts → Media uploads
5. auth-helpers.ts → Social login

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/postgres)
- [RLS Policy Examples](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Contributing

When adding new templates:
1. Follow existing file structure
2. Include comprehensive comments
3. Add usage examples
4. Document all features
5. Test thoroughly before committing
