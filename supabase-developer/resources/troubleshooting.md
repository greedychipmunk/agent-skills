# Troubleshooting Guide

## Common Issues and Solutions

## Authentication Issues

### Email Confirmation Not Received

**Problem:** User doesn't receive confirmation email after signup.

**Solutions:**
```typescript
// 1. Check email settings in Dashboard
// Auth > Email Templates > Confirm signup

// 2. Verify SMTP configuration (if custom)
// Settings > Auth > SMTP Settings

// 3. Test with local Inbucket
// http://localhost:54324 (local dev)

// 4. Resend confirmation
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
})

// 5. Check spam folder

// 6. Disable email confirmation for development
// Dashboard > Auth > Settings > Enable email confirmations (OFF)
```

### Session Expired Errors

**Problem:** Users frequently logged out or see "session expired" errors.

**Solutions:**
```typescript
// 1. Check JWT expiry settings
// Dashboard > Auth > Settings > JWT Expiry (default: 3600s)

// 2. Enable refresh token rotation
// Dashboard > Auth > Settings > Refresh Token Rotation

// 3. Handle session refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Update local session
  }
})

// 4. Use getSession() instead of getUser() for checking auth
const { data: { session } } = await supabase.auth.getSession()

// 5. Persist session properly
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
  }
})
```

### OAuth Provider Issues

**Problem:** OAuth login fails or redirects incorrectly.

**Solutions:**
```typescript
// 1. Verify redirect URLs in provider settings
// Google Console, GitHub Apps, etc.

// 2. Add redirect URLs in Supabase Dashboard
// Auth > URL Configuration > Redirect URLs
// Add: https://yourapp.com/auth/callback

// 3. Check OAuth configuration
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})

// 4. Handle callback correctly
// pages/auth/callback.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    })
  }, [router])
  
  return <div>Loading...</div>
}
```

## Database Issues

### RLS Blocking Legitimate Queries

**Problem:** Queries return no results even though data exists.

**Solutions:**
```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'your_table';

-- 2. List policies for table
SELECT *
FROM pg_policies
WHERE tablename = 'your_table';

-- 3. Test query with different roles
BEGIN;
SET LOCAL role TO anon;
SET LOCAL request.jwt.claim.sub TO '';
SELECT * FROM your_table;
ROLLBACK;

BEGIN;
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid';
SELECT * FROM your_table;
ROLLBACK;

-- 4. Temporarily disable RLS for testing (DEV ONLY!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- 5. Fix or add missing policy
CREATE POLICY "Users can view their own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Use service role key for admin operations (server-side only)
```

### Migration Conflicts

**Problem:** Migration fails with "relation already exists" or similar errors.

**Solutions:**
```bash
# 1. Check migration status
supabase migration list

# 2. Check what's actually in database
psql -h localhost -p 54322 -U postgres -d postgres -c "\dt"

# 3. Generate diff to see what's different
supabase db diff -f fix_migration

# 4. Repair migration history
supabase migration repair 20240101000000 --status applied

# 5. Reset local database (destructive!)
supabase db reset

# 6. Use IF NOT EXISTS clauses
CREATE TABLE IF NOT EXISTS posts (...);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

# 7. Create rollback migration
CREATE TABLE posts_backup AS SELECT * FROM posts;
DROP TABLE posts;
-- Run reverse changes
```

### Slow Queries

**Problem:** Queries take too long to execute.

**Solutions:**
```sql
-- 1. Analyze query with EXPLAIN
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE author_id = 'uuid'
ORDER BY created_at DESC;

-- Look for:
-- - Seq Scan (bad for large tables)
-- - Index Scan (good)
-- - High execution time

-- 2. Add missing indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- 3. Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- 4. Optimize RLS policies
-- Add indexes on columns used in policies
CREATE INDEX idx_posts_team ON posts(team_id);

-- 5. Use LIMIT
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20;

-- 6. Select only needed columns
SELECT id, title, created_at FROM posts;

-- 7. Run ANALYZE to update statistics
ANALYZE posts;

-- 8. Consider materialized views
CREATE MATERIALIZED VIEW post_stats AS
SELECT post_id, COUNT(*) as view_count
FROM post_views
GROUP BY post_id;
```

### Connection Pool Exhausted

**Problem:** "too many connections" or "connection pool exhausted" errors.

**Solutions:**
```typescript
// 1. Use connection pooling
const poolerUrl = process.env.SUPABASE_POOLER_URL
const supabase = createClient(poolerUrl, key)

// 2. Close connections properly
// In serverless, don't persist client
export async function handler(event) {
  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  })
  // Use supabase
  // Connection auto-closed after function
}

// 3. Check connection count
// SQL:
SELECT count(*) FROM pg_stat_activity;

// 4. Find idle connections
SELECT * FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '5 minutes';

// 5. Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '10 minutes';

// 6. Increase connection limit (paid plans)
// Dashboard > Settings > Database > Connection limit

// 7. Configure timeout
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: (...args) => {
      const [url, options] = args
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(5000), // 5s timeout
      })
    },
  },
})
```

## Storage Issues

### File Upload Fails

**Problem:** File uploads fail or return errors.

**Solutions:**
```typescript
// 1. Check file size limit
// Dashboard > Storage > Bucket > Settings > Max file size

// 2. Verify bucket policies
// Check if user has insert permission on bucket

// 3. Check MIME type restrictions
// Dashboard > Storage > Bucket > Settings > Allowed MIME types

// 4. Handle errors properly
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true,
  })

if (error) {
  if (error.message.includes('Duplicate')) {
    // File already exists, use upsert: true
  } else if (error.message.includes('exceeds')) {
    // File too large
  } else {
    console.error('Upload error:', error)
  }
}

// 5. Check bucket RLS policies
-- SQL:
SELECT * FROM storage.buckets WHERE id = 'avatars';

SELECT * FROM storage.objects
WHERE bucket_id = 'avatars'
LIMIT 1;

-- Ensure policies allow access
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### File Not Found / 404 Errors

**Problem:** Can't access uploaded files, getting 404 errors.

**Solutions:**
```typescript
// 1. Check if bucket is public
// Dashboard > Storage > Bucket > Public bucket (toggle)

// 2. For public buckets, use getPublicUrl
const { data } = supabase.storage
  .from('public-images')
  .getPublicUrl('file.jpg')

// 3. For private buckets, use signed URLs
const { data, error } = await supabase.storage
  .from('private')
  .createSignedUrl('file.pdf', 3600) // 1 hour

// 4. Check file path
// Correct: 'folder/file.jpg'
// Wrong: '/folder/file.jpg' or 'folder//file.jpg'

// 5. Verify file exists
const { data: files } = await supabase.storage
  .from('bucket')
  .list('folder', { limit: 100 })

// 6. Check bucket RLS for SELECT
CREATE POLICY "Anyone can view public files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-images');
```

## Edge Functions Issues

### Function Timeout

**Problem:** Edge Function times out or takes too long.

**Solutions:**
```typescript
// 1. Reduce function complexity
// Split into smaller functions

// 2. Use Promise.all for parallel operations
const [users, posts] = await Promise.all([
  supabase.from('users').select('*'),
  supabase.from('posts').select('*'),
])

// 3. Avoid heavy dependencies
// Use Deno standard library instead of npm packages

// 4. Set appropriate timeout (max 150s)
// Configure in Dashboard > Edge Functions > Settings

// 5. Use background processing for long tasks
// Queue job instead of processing synchronously

// 6. Optimize database queries
// Add indexes, use LIMIT, select only needed columns

// 7. Cache results
const cache = new Map()

serve(async (req) => {
  const cacheKey = 'data'
  
  if (cache.has(cacheKey)) {
    return new Response(cache.get(cacheKey))
  }
  
  const data = await fetchData()
  cache.set(cacheKey, JSON.stringify(data))
  
  return new Response(JSON.stringify(data))
})
```

### Function Deployment Fails

**Problem:** Function deployment fails or doesn't update.

**Solutions:**
```bash
# 1. Check for syntax errors
deno check supabase/functions/my-function/index.ts

# 2. Verify import map
# supabase/functions/import_map.json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}

# 3. Check function name
# Must match directory name

# 4. Deploy with --debug flag
supabase functions deploy my-function --debug

# 5. Check logs for errors
supabase functions logs my-function

# 6. Verify project link
supabase projects list

# 7. Re-deploy with --no-verify-jwt (development only)
supabase functions deploy my-function --no-verify-jwt

# 8. Clear function cache
supabase functions delete my-function
supabase functions deploy my-function
```

## Realtime Issues

### Not Receiving Updates

**Problem:** Realtime subscriptions don't receive updates.

**Solutions:**
```typescript
// 1. Enable realtime for table
-- SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Check enabled tables:
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

// 2. Check subscription setup
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
    },
    (payload) => {
      console.log('Change:', payload)
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// 3. Check RLS policies
// User must have SELECT permission to receive updates

// 4. Verify connection state
channel.state // Should be 'joined'

// 5. Check for errors
supabase
  .channel('test')
  .subscribe((status, err) => {
    if (err) {
      console.error('Subscription error:', err)
    }
  })

// 6. Unsubscribe and resubscribe
supabase.removeChannel(channel)
// Create new subscription

// 7. Check Dashboard > Database > Replication
// Ensure replication is enabled
```

### Channel Connection Drops

**Problem:** Realtime connection frequently disconnects.

**Solutions:**
```typescript
// 1. Handle reconnection
supabase
  .channel('my-channel')
  .on('system', { event: 'reconnect' }, () => {
    console.log('Reconnected')
  })
  .subscribe()

// 2. Use heartbeat to keep alive
const channel = supabase.channel('heartbeat', {
  config: {
    broadcast: { self: true },
  },
})

// 3. Check network stability
// Realtime requires stable WebSocket connection

// 4. Reduce channel count
// Use fewer, broader channels instead of many specific ones

// 5. Implement exponential backoff
let retries = 0
function subscribe() {
  const channel = supabase.channel('my-channel').subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      setTimeout(() => {
        retries++
        subscribe()
      }, Math.min(1000 * Math.pow(2, retries), 30000))
    } else if (status === 'SUBSCRIBED') {
      retries = 0
    }
  })
}
```

## Local Development Issues

### Docker Issues

**Problem:** Local Supabase services won't start.

**Solutions:**
```bash
# 1. Check Docker is running
docker ps

# 2. Restart Docker Desktop
# (macOS/Windows: Quit and reopen)

# 3. Check Docker resources
# Docker Desktop > Settings > Resources
# Ensure sufficient RAM (4GB+) and CPUs (2+)

# 4. Clean up Docker
docker system prune -a
docker volume prune

# 5. Stop and restart Supabase
supabase stop --no-backup
supabase start

# 6. Check port conflicts
lsof -i :54321  # API
lsof -i :54322  # Database
lsof -i :54323  # Studio

# Kill conflicting processes or change ports in config.toml

# 7. Check Docker logs
docker logs supabase_db_<project>
docker logs supabase_kong_<project>

# 8. Remove Supabase containers and restart
docker ps -a | grep supabase | awk '{print $1}' | xargs docker rm
supabase start
```

### Type Generation Fails

**Problem:** TypeScript type generation doesn't work or types are wrong.

**Solutions:**
```bash
# 1. Ensure database is running
supabase status

# 2. Check database connection
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1"

# 3. Generate types with full schema
supabase gen types typescript --local --schema public > types/database.types.ts

# 4. Clear type cache
rm -rf types/
mkdir types
supabase gen types typescript --local > types/database.types.ts

# 5. Check for SQL syntax errors in migrations
# Invalid SQL can prevent type generation

# 6. Use linked project instead
supabase gen types typescript --linked > types/database.types.ts

# 7. Manual type definition if needed
export interface Database {
  public: {
    Tables: {
      posts: {
        Row: { id: string; title: string }
        Insert: { title: string }
        Update: { title?: string }
      }
    }
  }
}
```

## Production Issues

### High Latency

**Problem:** API responses are slow in production.

**Solutions:**
```typescript
// 1. Use connection pooling
const poolerUrl = process.env.SUPABASE_POOLER_URL

// 2. Enable caching
const { data } = await supabase
  .from('posts')
  .select('*')
// Add CDN/edge caching

// 3. Optimize queries
// Add indexes, use LIMIT, select fewer columns

// 4. Use regional deployment
// Deploy app in same region as database

// 5. Implement pagination
const { data } = await supabase
  .from('posts')
  .select('*')
  .range(0, 19) // First 20 items

// 6. Use materialized views for complex queries

// 7. Monitor with Dashboard
// Database > Performance

// 8. Consider read replicas (contact support)
```

### Rate Limit Exceeded

**Problem:** API requests returning 429 (Too Many Requests).

**Solutions:**
```typescript
// 1. Check rate limits in Dashboard
// Settings > API > Rate Limiting

// 2. Implement exponential backoff
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        )
      } else {
        throw error
      }
    }
  }
}

// 3. Batch requests
// Combine multiple queries into one

// 4. Use caching
// Reduce redundant API calls

// 5. Upgrade plan for higher limits
// Dashboard > Settings > Billing

// 6. Use service role key for admin operations (server-side)

// 7. Contact support for custom limits
```

## Getting Help

### Log Collection
```bash
# Collect logs for support
supabase status > status.txt
supabase inspect db > db_inspect.txt
docker logs supabase_db_$(supabase status | grep "Project" | awk '{print $3}') > db_logs.txt
```

### Support Channels
- Discord: https://discord.supabase.com/
- GitHub Discussions: https://github.com/supabase/supabase/discussions
- Support Portal: https://app.supabase.com/support
- Documentation: https://supabase.com/docs

### Information to Include
- Supabase CLI version: `supabase --version`
- Project ID (from Dashboard)
- Error messages (full text)
- Steps to reproduce
- Expected vs actual behavior
- Code snippets (remove sensitive data)
