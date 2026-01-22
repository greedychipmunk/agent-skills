# Performance Optimization Guide

## Database Query Optimization

### Indexing Strategies

#### When to Add Indexes
- Columns frequently used in WHERE clauses
- Foreign key columns
- Columns used in JOINs
- Columns used in ORDER BY
- Columns used for uniqueness constraints

#### Creating Indexes
```sql
-- Simple index
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Composite index (order matters!)
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);

-- Partial index (filtered)
CREATE INDEX idx_posts_published ON posts(published_at)
  WHERE status = 'published';

-- Unique index
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Index on expression
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- GIN index for JSONB
CREATE INDEX idx_metadata ON posts USING GIN (metadata);

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING GIN (to_tsvector('english', title || ' ' || content));
```

#### Index Best Practices
```sql
-- Use CONCURRENTLY to avoid blocking writes
CREATE INDEX CONCURRENTLY idx_posts_author ON posts(author_id);

-- Drop unused indexes
DROP INDEX CONCURRENTLY idx_old_index;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

### Query Optimization

#### Use EXPLAIN ANALYZE
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT p.*, u.username
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC
LIMIT 10;

-- Look for:
-- - Seq Scan (bad on large tables)
-- - Index Scan (good)
-- - Nested Loop (can be expensive)
-- - Hash Join (better for large datasets)
```

#### Optimize Joins
```sql
-- BAD: N+1 queries
-- Client code making multiple requests

-- GOOD: Single query with JOIN
SELECT 
  p.*,
  u.username,
  u.avatar_url,
  COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON c.post_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, u.username, u.avatar_url
ORDER BY p.created_at DESC
LIMIT 20;
```

#### Limit Result Sets
```sql
-- Always use LIMIT for pagination
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Better: Use keyset pagination
SELECT * FROM posts
WHERE created_at < '2024-01-01'
ORDER BY created_at DESC
LIMIT 20;
```

#### Select Only Needed Columns
```typescript
// BAD: Select everything
const { data } = await supabase
  .from('posts')
  .select('*')

// GOOD: Select only what you need
const { data } = await supabase
  .from('posts')
  .select('id, title, created_at, author:users(username)')
```

### RLS Performance

#### Optimize RLS Policies
```sql
-- BAD: Multiple subqueries
CREATE POLICY "users_own_posts" ON posts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id IN (
        SELECT team_id FROM posts WHERE id = posts.id
      )
    )
  );

-- GOOD: Simplified with joins
CREATE POLICY "users_own_posts" ON posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
        AND t.id = posts.team_id
    )
  );

-- BETTER: Use indexes on policy columns
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_posts_team ON posts(team_id);
```

#### Use Security Definer Functions
```sql
-- For complex authorization logic
CREATE FUNCTION user_can_access_post(post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM posts p
    JOIN team_members tm ON p.team_id = tm.team_id
    WHERE p.id = post_id
      AND tm.user_id = auth.uid()
  );
END;
$$;

-- Use in policy
CREATE POLICY "team_posts_access" ON posts
  FOR SELECT USING (user_can_access_post(id));
```

## Supabase Client Optimization

### Connection Pooling

#### Server-Side (Node.js/Next.js)
```typescript
import { createClient } from '@supabase/supabase-js'

// Use connection pooling for server-side
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-connection-pooling': 'true',
      },
    },
  }
)
```

#### Use Supabase Pooler
```typescript
// For serverless environments
const poolerUrl = process.env.SUPABASE_POOLER_URL // Use pooler URL

const supabase = createClient(poolerUrl, serviceRoleKey, {
  db: {
    schema: 'public',
  },
})
```

### Batch Operations

#### Batch Inserts
```typescript
// BAD: Multiple individual inserts
for (const item of items) {
  await supabase.from('items').insert(item)
}

// GOOD: Single batch insert
await supabase.from('items').insert(items)
```

#### Batch Updates
```sql
-- Use UPDATE with FROM for batch updates
UPDATE posts
SET status = 'archived'
FROM (VALUES 
  ('uuid1'),
  ('uuid2'),
  ('uuid3')
) AS ids(id)
WHERE posts.id = ids.id;
```

### Caching Strategies

#### Client-Side Caching with React Query
```typescript
import { useQuery } from '@tanstack/react-query'

function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

#### Server-Side Caching (Next.js)
```typescript
// App Router - cached by default
export async function getPosts() {
  const { data } = await supabase
    .from('posts')
    .select('*')
  
  return data
}

// With revalidation
export const revalidate = 3600 // Revalidate every hour

// With tags for on-demand revalidation
export async function getPosts() {
  'use cache'
  cacheTag('posts')
  
  const { data } = await supabase.from('posts').select('*')
  return data
}
```

#### Edge Caching with CDN
```typescript
// Set cache headers in API routes
export async function GET(request: Request) {
  const data = await getPublicData()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
```

#### Database-Level Caching
```sql
-- Materialized views for expensive queries
CREATE MATERIALIZED VIEW post_stats AS
SELECT 
  p.id,
  p.title,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT l.id) as like_count,
  AVG(r.rating) as avg_rating
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
LEFT JOIN likes l ON l.post_id = p.id
LEFT JOIN ratings r ON r.post_id = p.id
GROUP BY p.id, p.title;

-- Refresh periodically
REFRESH MATERIALIZED VIEW post_stats;

-- Or refresh concurrently (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY post_stats;
```

## Realtime Optimization

### Channel Management
```typescript
// BAD: Multiple subscriptions for same data
const channel1 = supabase.channel('posts-1').subscribe()
const channel2 = supabase.channel('posts-2').subscribe()
const channel3 = supabase.channel('posts-3').subscribe()

// GOOD: Single channel with filters
const channel = supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    handleChange
  )
  .subscribe()
```

### Throttle Updates
```typescript
import { throttle } from 'lodash'

const handleChange = throttle((payload) => {
  // Update UI
}, 1000) // Maximum once per second

supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    handleChange
  )
  .subscribe()
```

### Filter at Database Level
```typescript
// Use filters to reduce data transfer
supabase
  .channel('my-posts')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `author_id=eq.${userId}`, // Only my posts
    },
    handleChange
  )
  .subscribe()
```

## Storage Optimization

### Image Optimization
```typescript
// Use transformation parameters
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user1/avatar.jpg', {
    transform: {
      width: 200,
      height: 200,
      quality: 80,
      format: 'webp',
    },
  })

// Serve responsive images
const sizes = [400, 800, 1200]
const srcset = sizes
  .map(width => {
    const url = supabase.storage
      .from('images')
      .getPublicUrl(`photo.jpg`, {
        transform: { width, quality: 85 },
      })
    return `${url.data.publicUrl} ${width}w`
  })
  .join(', ')
```

### Lazy Loading
```typescript
// Upload with metadata
await supabase.storage
  .from('images')
  .upload('photo.jpg', file, {
    cacheControl: '3600',
    upsert: false,
    metadata: {
      width: '1920',
      height: '1080',
    },
  })

// Generate thumbnails asynchronously
async function generateThumbnail(path: string) {
  const { data } = await supabase.storage.from('images').download(path)
  const thumbnail = await resizeImage(data, 200, 200)
  await supabase.storage.from('thumbnails').upload(path, thumbnail)
}
```

### CDN Configuration
```typescript
// Use CDN for public buckets
const publicUrl = supabase.storage
  .from('public-images')
  .getPublicUrl('banner.jpg')

// publicUrl includes CDN caching
// Set appropriate Cache-Control headers when uploading
await supabase.storage
  .from('public-images')
  .upload('banner.jpg', file, {
    cacheControl: '31536000', // 1 year
  })
```

## Edge Functions Optimization

### Cold Start Reduction
```typescript
// Keep functions warm with periodic requests
// Or use Deno Deploy's Always On feature

// Minimize dependencies
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Avoid heavy npm packages
```

### Connection Reuse
```typescript
// Reuse Supabase client
const supabaseClient = createClient(url, key)

serve(async (req) => {
  // Reuse connection across invocations
  const { data } = await supabaseClient.from('posts').select('*')
  return new Response(JSON.stringify(data))
})
```

### Parallel Processing
```typescript
// Process multiple operations in parallel
serve(async (req) => {
  const [posts, users, comments] = await Promise.all([
    supabase.from('posts').select('*'),
    supabase.from('users').select('*'),
    supabase.from('comments').select('*'),
  ])
  
  return new Response(JSON.stringify({ posts, users, comments }))
})
```

## Monitoring & Profiling

### Database Performance
```sql
-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Table statistics
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables;

-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Lock monitoring
SELECT * FROM pg_locks
WHERE NOT granted;
```

### Supabase Dashboard
- Monitor database size and connections
- Check API request rates
- Review Edge Function invocations
- Track bandwidth usage

### Custom Logging
```typescript
// Log slow queries
const startTime = Date.now()
const { data } = await supabase.from('posts').select('*')
const duration = Date.now() - startTime

if (duration > 1000) {
  console.warn(`Slow query: ${duration}ms`)
}
```

## Best Practices Summary

1. **Always use indexes** on foreign keys and frequently queried columns
2. **Limit result sets** with pagination
3. **Select only needed columns** to reduce data transfer
4. **Use RLS efficiently** with proper indexes
5. **Batch operations** instead of loops
6. **Cache aggressively** at all layers
7. **Optimize images** with transformations
8. **Monitor performance** regularly
9. **Use connection pooling** in serverless environments
10. **Profile before optimizing** - measure first!

## Performance Checklist

- [ ] Indexes created for all foreign keys
- [ ] Indexes on columns used in WHERE clauses
- [ ] RLS policies optimized and indexed
- [ ] Queries use LIMIT for pagination
- [ ] Only necessary columns selected
- [ ] Batch operations used instead of loops
- [ ] Client-side caching implemented
- [ ] Image transformations configured
- [ ] Connection pooling enabled
- [ ] Slow query logging enabled
- [ ] Regular VACUUM and ANALYZE scheduled
- [ ] Database statistics up to date
