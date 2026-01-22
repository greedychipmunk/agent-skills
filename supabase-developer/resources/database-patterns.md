# Database Patterns

## Schema Design

### Naming Conventions
- Use `snake_case` for table and column names
- Prefix junction tables with both table names: `user_roles`
- Use singular nouns for table names: `user`, `post`, `comment`
- Suffix timestamp columns: `created_at`, `updated_at`, `deleted_at`

### Common Table Patterns

#### User Profile Extension
```sql
-- Extend auth.users with public profile data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

#### Posts with Author
```sql
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  content text,
  excerpt text,
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for common queries
create index posts_author_id_idx on public.posts(author_id);
create index posts_published_idx on public.posts(published) where published = true;
create index posts_slug_idx on public.posts(slug);
```

#### Categories and Tags (Many-to-Many)
```sql
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  description text
);

create table public.post_categories (
  post_id uuid references public.posts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (post_id, category_id)
);

-- Tags with usage count
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null
);

create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
```

#### Multi-Tenant Organizations
```sql
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz default now() not null
);

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  primary key (organization_id, user_id)
);

create index org_members_user_idx on public.organization_members(user_id);
```

## Query Patterns

### Basic CRUD
```typescript
// Create
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'New Post', author_id: user.id })
  .select()
  .single()

// Read with filter
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })

// Update
const { error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title' })
  .eq('id', postId)

// Delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

### Relational Queries
```typescript
// One-to-many: Post with comments
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    comments (
      id,
      content,
      author:profiles(username)
    )
  `)
  .eq('id', postId)
  .single()

// Many-to-many: Posts with tags
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    post_tags (
      tags (id, name)
    )
  `)

// Flatten many-to-many result
const postsWithTags = data?.map(post => ({
  ...post,
  tags: post.post_tags.map(pt => pt.tags)
}))
```

### Filtering
```typescript
// Multiple conditions
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false })

// OR conditions
const { data } = await supabase
  .from('posts')
  .select('*')
  .or('title.ilike.%news%,content.ilike.%news%')

// IN clause
const { data } = await supabase
  .from('posts')
  .select('*')
  .in('category_id', [cat1, cat2, cat3])

// Full-text search
const { data } = await supabase
  .from('posts')
  .select('*')
  .textSearch('title', 'supabase database', {
    type: 'websearch',
    config: 'english'
  })
```

### Pagination
```typescript
// Offset pagination
const pageSize = 10
const page = 1
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)

// Cursor pagination (more efficient)
const { data } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', lastPostCreatedAt)
  .limit(10)
```

### Aggregations with RPC
```sql
-- Create function for stats
create or replace function get_post_stats(post_uuid uuid)
returns json as $$
  select json_build_object(
    'view_count', count(*) filter (where event_type = 'view'),
    'like_count', count(*) filter (where event_type = 'like'),
    'comment_count', (select count(*) from comments where post_id = post_uuid)
  )
  from post_events
  where post_id = post_uuid;
$$ language sql stable;
```

```typescript
const { data } = await supabase.rpc('get_post_stats', { post_uuid: postId })
```

## Migrations

### Creating Migrations
```bash
# Create new migration
supabase migration new add_posts_table

# This creates: supabase/migrations/20240115120000_add_posts_table.sql
```

### Migration Best Practices
```sql
-- Always use IF NOT EXISTS / IF EXISTS for safety
create table if not exists public.posts (...);
drop table if exists public.posts;

-- Add columns with defaults for existing rows
alter table public.posts
add column view_count integer default 0 not null;

-- Create indexes concurrently in production
create index concurrently posts_title_idx on public.posts(title);

-- Use transactions for related changes
begin;
  alter table public.posts add column category_id uuid;
  alter table public.posts
    add constraint posts_category_fk
    foreign key (category_id) references public.categories(id);
commit;
```

### Seed Data
```sql
-- supabase/seed.sql
insert into public.categories (name, slug) values
  ('Technology', 'technology'),
  ('Design', 'design'),
  ('Business', 'business')
on conflict (slug) do nothing;

-- Development-only seed data
do $$
begin
  if current_setting('app.environment', true) = 'development' then
    insert into public.profiles (id, username, full_name)
    values
      ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User')
    on conflict do nothing;
  end if;
end $$;
```

## PostgreSQL Extensions

### Enable Extensions
```sql
-- UUID generation
create extension if not exists "uuid-ossp";

-- Updated timestamps
create extension if not exists moddatetime;

-- Full-text search (built-in, just needs config)
create extension if not exists pg_trgm;

-- Geographic data
create extension if not exists postgis;

-- Vector embeddings (AI)
create extension if not exists vector;

-- Cryptographic functions
create extension if not exists pgcrypto;
```

### Using moddatetime
```sql
create trigger handle_updated_at
  before update on public.posts
  for each row execute function moddatetime(updated_at);
```

### Full-Text Search Setup
```sql
-- Add search column
alter table public.posts add column search_vector tsvector;

-- Create index
create index posts_search_idx on public.posts using gin(search_vector);

-- Update trigger
create or replace function posts_search_update() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger posts_search_trigger
  before insert or update on public.posts
  for each row execute function posts_search_update();
```

### Vector Embeddings
```sql
-- Enable extension
create extension if not exists vector;

-- Create table with vector column
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at timestamptz default now()
);

-- Create index for similarity search
create index documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (id uuid, content text, similarity float)
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$ language sql stable;
```

## Database Functions

### Stored Procedures
```sql
-- Increment view count atomically
create or replace function increment_view_count(post_uuid uuid)
returns void as $$
  update public.posts
  set view_count = view_count + 1
  where id = post_uuid;
$$ language sql;

-- Call from client
const { error } = await supabase.rpc('increment_view_count', { post_uuid: postId })
```

### Functions with Auth Context
```sql
create or replace function get_my_posts()
returns setof public.posts as $$
  select * from public.posts
  where author_id = auth.uid()
  order by created_at desc;
$$ language sql stable security definer;
```

### Triggers for Side Effects
```sql
-- Send notification on new comment
create or replace function notify_new_comment()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, data)
  select
    p.author_id,
    'new_comment',
    jsonb_build_object(
      'post_id', new.post_id,
      'comment_id', new.id,
      'commenter_id', new.author_id
    )
  from public.posts p
  where p.id = new.post_id
    and p.author_id != new.author_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_comment_created
  after insert on public.comments
  for each row execute function notify_new_comment();
```
