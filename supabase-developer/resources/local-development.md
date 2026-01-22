# Local Development Guide

## Overview

Developing locally with Supabase provides a complete development environment that mirrors production, enabling fast iteration and testing without affecting your production database.

## Prerequisites

### Required Software
- **Docker Desktop** (or Docker Engine)
  - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)
- **Node.js** (v16 or later)
- **Git**

### Install Supabase CLI
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

## Initial Setup

### 1. Initialize Project
```bash
# In your project root
supabase init
```

This creates:
```
supabase/
├── config.toml      # Supabase configuration
├── seed.sql         # Seed data for development
└── migrations/      # Database migrations
```

### 2. Configure Project
Edit `supabase/config.toml`:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]

[db]
port = 54322
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.external.google]
enabled = false
client_id = ""
secret = ""
redirect_uri = ""
```

### 3. Start Local Services
```bash
supabase start
```

Services started:
- **API Gateway**: http://localhost:54321
- **Studio (Admin UI)**: http://localhost:54323
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Inbucket (Email testing)**: http://localhost:54324

### 4. Get Connection Details
```bash
supabase status
```

Save the output, especially:
- API URL
- anon key (for client)
- service_role key (for admin operations)

## Development Workflow

### Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-status
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-status
```

Add to `.gitignore`:
```gitignore
.env.local
.env*.local
```

### Database Migrations

#### Create Migration
```bash
# Create new migration
supabase migration new create_posts_table
```

Edit `supabase/migrations/YYYYMMDDHHMMSS_create_posts_table.sql`:
```sql
-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  author_id uuid references auth.users(id) not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.posts enable row level security;

-- Create policies
create policy "Users can view all posts"
  on public.posts for select
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);
```

#### Apply Migration
```bash
# Apply to local database
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/database.types.ts
```

### Seed Data

Edit `supabase/seed.sql`:
```sql
-- Insert test users (note: auth.users is managed by Supabase Auth)
-- Create test posts
insert into public.posts (title, content, author_id)
values
  ('First Post', 'This is my first post', 'uuid-here'),
  ('Second Post', 'This is my second post', 'uuid-here');
```

Apply seed:
```bash
supabase db reset  # Resets DB and applies migrations + seed
```

### Edge Functions

#### Create Function
```bash
supabase functions new hello
```

Edit `supabase/functions/hello/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()
  
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

#### Test Locally
```bash
# Terminal 1: Serve functions
supabase functions serve

# Terminal 2: Test with curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/hello' \
  --header 'Authorization: ******' \
  --header 'Content-Type: application/json' \
  --data '{"name":"World"}'
```

### Storage Testing

```typescript
// Upload file to local storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

// Files stored in Docker volume
// Access via Studio: http://localhost:54323
```

### Email Testing

Access Inbucket at http://localhost:54324 to view emails sent by Supabase Auth (signup confirmations, password resets, etc.)

## Testing Strategies

### Unit Tests
```typescript
// tests/database.test.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY!
)

describe('Posts', () => {
  it('should create a post', async () => {
    const { data, error } = await supabase
      .from('posts')
      .insert({ title: 'Test', author_id: 'uuid' })
      .select()
      .single()
    
    expect(error).toBeNull()
    expect(data.title).toBe('Test')
  })
})
```

### Integration Tests
```bash
# Run tests against local Supabase
npm test

# Reset database before tests
supabase db reset && npm test
```

### RLS Policy Testing
```typescript
// Test RLS policies
import { createClient } from '@supabase/supabase-js'

// Test as anonymous user
const anonClient = createClient(url, anonKey)

// Test as authenticated user
const authClient = createClient(url, anonKey)
await authClient.auth.signInWithPassword({ email, password })

// Test different scenarios
const { data: publicData } = await anonClient.from('posts').select()
const { data: privateData } = await authClient.from('posts').select()
```

## Database Management

### Reset Database
```bash
# Reset to clean state (reapplies migrations + seed)
supabase db reset

# Reset without seed
supabase db reset --no-seed
```

### Inspect Database
```bash
# Database size
supabase inspect db size

# Table sizes
supabase inspect db tables

# Index usage
supabase inspect db index-usage

# Cache hit rate
supabase inspect db cache-hit
```

### Direct Database Access
```bash
# Connect with psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or use connection string from status
supabase status | grep "DB URL"
```

## Syncing with Remote

### Pull Remote Schema
```bash
# Link to remote project first
supabase link --project-ref your-project-ref

# Pull remote schema as new migration
supabase db pull
```

### Push Local Changes
```bash
# Push local migrations to remote
supabase db push --linked
```

## Troubleshooting

### Services Won't Start

#### Check Docker
```bash
# Ensure Docker is running
docker ps

# Check Docker resources
# Docker Desktop > Settings > Resources
# Recommended: 4GB RAM, 2 CPUs minimum
```

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :54321  # API
lsof -i :54322  # Database
lsof -i :54323  # Studio
lsof -i :54324  # Inbucket

# Stop conflicting services or change ports in config.toml
```

#### Clean Start
```bash
# Stop and remove containers
supabase stop --no-backup

# Remove Docker volumes (CAUTION: deletes local data)
docker volume prune

# Start fresh
supabase start
```

### Migration Issues

#### Repair Migration History
```bash
# Check migration status
supabase migration list

# Mark migration as applied without running
supabase migration repair 20230101000000 --status applied

# Mark migration as not applied
supabase migration repair 20230101000000 --status reverted
```

#### Regenerate Schema
```bash
# Generate migration from current database state
supabase db diff -f new_migration_name
```

### Connection Issues

#### Database Connection
```bash
# Test connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1"

# Check logs
docker logs supabase_db_<project>
```

#### API Connection
```bash
# Test API
curl http://localhost:54321/rest/v1/

# Check logs
docker logs supabase_kong_<project>
```

### Performance Issues

#### Slow Queries
```bash
# Enable query logging
# In psql:
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = on;

# View logs
docker logs supabase_db_<project> | grep duration
```

#### Index Missing
```bash
# Check index usage
supabase inspect db index-usage

# Add indexes in migrations
CREATE INDEX idx_posts_author ON posts(author_id);
```

## Best Practices

### 1. Use Migrations for Everything
- Never modify database schema manually
- Always create migrations for schema changes
- Keep migrations small and focused

### 2. Test RLS Policies Locally
- Create test users with different roles
- Test each policy thoroughly
- Use automated tests

### 3. Seed Data Properly
- Create realistic test data
- Include edge cases
- Use consistent UUIDs for testing

### 4. Version Control
```gitignore
# .gitignore
.env.local
.env*.local
supabase/.branches
supabase/.temp
```

### 5. Keep Local and Remote in Sync
```bash
# Regular sync workflow
supabase db pull        # Get remote changes
supabase db reset       # Apply locally
supabase db push        # Push local changes
```

### 6. Use Different Environments
```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

# Staging
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co

# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
```

### 7. Monitor Resources
- Check Docker Desktop resource usage
- Stop services when not in use
- Clean up old containers and volumes

## Quick Reference

### Common Commands
```bash
# Start/Stop
supabase start
supabase stop
supabase status

# Database
supabase db reset
supabase db push
supabase db pull
supabase db diff -f migration_name

# Migrations
supabase migration new name
supabase migration list

# Functions
supabase functions new name
supabase functions serve
supabase functions deploy

# Types
supabase gen types typescript --local > types/database.types.ts
```

### URLs
- Studio: http://localhost:54323
- API: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres
- Inbucket: http://localhost:54324

### Keys
Get from `supabase status`:
- anon key (public, client-side)
- service_role key (private, server-side only)

## Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Docker Troubleshooting](https://docs.docker.com/desktop/troubleshoot/overview/)
