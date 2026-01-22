# Row Level Security (RLS)

## Overview

Row Level Security (RLS) is PostgreSQL's built-in mechanism for controlling access to rows in database tables. In Supabase, RLS is essential for securing your data when using the client library with the anon key.

## Enabling RLS

```sql
-- Enable RLS on a table
alter table public.posts enable row level security;

-- Force RLS for table owner too (recommended for security)
alter table public.posts force row level security;

-- Disable RLS (not recommended for public tables)
alter table public.posts disable row level security;
```

## Policy Basics

### Policy Structure
```sql
create policy "policy_name"
  on table_name
  for [ALL | SELECT | INSERT | UPDATE | DELETE]
  to [role_name | PUBLIC]
  using (expression)        -- For SELECT, UPDATE, DELETE
  with check (expression);  -- For INSERT, UPDATE
```

### Policy Evaluation
- `USING`: Filters which existing rows can be seen/modified
- `WITH CHECK`: Validates new/modified row data
- Multiple policies: OR'd together (any matching policy allows access)
- No matching policy: Access denied

## Common Patterns

### Public Read Access
```sql
-- Anyone can read published posts
create policy "Public posts are viewable by everyone"
  on public.posts
  for select
  using (published = true);
```

### Authenticated Read Access
```sql
-- Only logged-in users can read
create policy "Authenticated users can read posts"
  on public.posts
  for select
  to authenticated
  using (true);
```

### Owner-Based Access
```sql
-- Users can only see their own data
create policy "Users can view own data"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can only update their own data
create policy "Users can update own data"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can only delete their own data
create policy "Users can delete own data"
  on public.profiles
  for delete
  using (auth.uid() = id);
```

### Insert Policies
```sql
-- Users can create posts for themselves
create policy "Users can create own posts"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Prevent users from setting certain fields
create policy "Users cannot set admin-only fields"
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and featured is null  -- Can't set featured
    and approved = false  -- Default to not approved
  );
```

### Combined Read/Write
```sql
-- Users can CRUD their own posts
create policy "Users can manage own posts"
  on public.posts
  for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
```

## Multi-Tenant Patterns

### Organization-Based Access
```sql
-- Helper function to check membership
create or replace function is_org_member(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Organization members can read org data
create policy "Org members can read org data"
  on public.projects
  for select
  using (is_org_member(organization_id));

-- Only org admins can modify
create or replace function is_org_admin(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and user_id = auth.uid()
    and role in ('owner', 'admin')
  );
$$ language sql security definer stable;

create policy "Org admins can update"
  on public.projects
  for update
  using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));
```

### Team-Based Access
```sql
-- Projects belong to teams
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  primary key (team_id, user_id)
);

-- Function to get user's teams
create or replace function get_user_teams()
returns setof uuid as $$
  select team_id from public.team_members
  where user_id = auth.uid();
$$ language sql security definer stable;

-- Team members can access team projects
create policy "Team members can read projects"
  on public.projects
  for select
  using (team_id in (select get_user_teams()));
```

## Role-Based Access Control (RBAC)

### Custom Roles Table
```sql
create table public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin'))
);

-- Function to check role
create or replace function has_role(required_role text)
returns boolean as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = required_role
  );
$$ language sql security definer stable;

-- Admin-only access
create policy "Admins can do everything"
  on public.posts
  for all
  using (has_role('admin'))
  with check (has_role('admin'));

-- Moderators can update
create policy "Moderators can update"
  on public.posts
  for update
  using (has_role('moderator') or has_role('admin'));
```

### JWT-Based Roles
```sql
-- Using custom claims in JWT
create policy "Admin access via JWT"
  on public.admin_settings
  for all
  using (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

## Hierarchical Data Access

### Parent-Child Relationships
```sql
-- Comments belong to posts, inherit post access
create policy "Users can read comments on accessible posts"
  on public.comments
  for select
  using (
    exists (
      select 1 from public.posts
      where id = comments.post_id
      and (published = true or author_id = auth.uid())
    )
  );
```

### Recursive Access (Folders/Files)
```sql
-- Check access up the folder tree
create or replace function can_access_folder(folder_uuid uuid)
returns boolean as $$
  with recursive folder_tree as (
    select id, parent_id, owner_id
    from public.folders
    where id = folder_uuid

    union all

    select f.id, f.parent_id, f.owner_id
    from public.folders f
    join folder_tree ft on f.id = ft.parent_id
  )
  select exists (
    select 1 from folder_tree
    where owner_id = auth.uid()
  );
$$ language sql security definer stable;

create policy "Access folder tree"
  on public.folders
  for select
  using (can_access_folder(id));
```

## Time-Based Access

```sql
-- Access only during business hours
create policy "Business hours only"
  on public.time_sensitive_data
  for select
  using (
    extract(hour from now() at time zone 'UTC') between 9 and 17
    and extract(dow from now()) between 1 and 5
  );

-- Temporary access
create policy "Time-limited access"
  on public.temporary_data
  for select
  using (
    created_at > now() - interval '24 hours'
  );
```

## Audit Logging with RLS

```sql
-- Audit table (no RLS, only service role can access)
create table private.audit_log (
  id uuid default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz default now()
);

-- Don't enable RLS on audit table
-- Access only via service role or Edge Functions
```

## Performance Optimization

### Index for RLS Columns
```sql
-- Always index columns used in RLS policies
create index posts_author_id_idx on public.posts(author_id);
create index org_members_user_id_idx on public.organization_members(user_id);
create index org_members_org_id_idx on public.organization_members(organization_id);
```

### Avoid Complex Subqueries
```sql
-- Bad: Complex subquery in every row check
create policy "Slow policy"
  on public.posts
  for select
  using (
    author_id in (
      select user_id from public.follows
      where follower_id = auth.uid()
    )
  );

-- Better: Use a function with caching hint
create or replace function get_followed_users()
returns setof uuid as $$
  select user_id from public.follows
  where follower_id = auth.uid();
$$ language sql security definer stable;

create policy "Faster policy"
  on public.posts
  for select
  using (author_id in (select get_followed_users()));
```

### Use Security Definer Functions
```sql
-- Security definer runs with creator's permissions
-- Bypasses RLS for the inner query, improving performance
create or replace function is_team_member(team_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = team_uuid
    and user_id = auth.uid()
  );
$$ language sql security definer stable;
```

## Testing RLS Policies

### Test as Different Users
```sql
-- Set role to authenticated user
set role authenticated;
set request.jwt.claim.sub = 'user-uuid-here';

-- Run queries and verify results
select * from public.posts;

-- Reset
reset role;
```

### Using Supabase Dashboard
1. Go to SQL Editor
2. Use "Run as" dropdown to switch between roles
3. Test queries with different user contexts

### Automated Testing Script
```typescript
// Test RLS policies
async function testRLS() {
  const testUserId = 'test-user-uuid'
  const otherUserId = 'other-user-uuid'

  // Create test client with specific user context
  const userClient = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  })

  // Should see own posts
  const { data: ownPosts } = await userClient
    .from('posts')
    .select('*')
    .eq('author_id', testUserId)

  console.assert(ownPosts?.length > 0, 'Should see own posts')

  // Should not see private posts from others
  const { data: otherPosts } = await userClient
    .from('posts')
    .select('*')
    .eq('author_id', otherUserId)
    .eq('published', false)

  console.assert(otherPosts?.length === 0, 'Should not see private posts')
}
```

## Common Mistakes

### 1. Forgetting to Enable RLS
```sql
-- Always enable after creating public tables
create table public.sensitive_data (...);
alter table public.sensitive_data enable row level security;
```

### 2. Missing WITH CHECK
```sql
-- Wrong: User could insert data for other users
create policy "Bad insert policy"
  on public.posts
  for insert
  using (true);

-- Correct: Validate the inserted data
create policy "Good insert policy"
  on public.posts
  for insert
  with check (auth.uid() = author_id);
```

### 3. Not Handling NULL
```sql
-- auth.uid() returns NULL for anonymous users
-- This policy accidentally allows anonymous access
create policy "Broken policy"
  on public.posts
  for select
  using (author_id = auth.uid() or published = true);

-- Fixed: Explicitly handle the null case
create policy "Fixed policy"
  on public.posts
  for select
  using (
    (auth.uid() is not null and author_id = auth.uid())
    or published = true
  );
```

### 4. Service Role Bypass
```sql
-- Service role bypasses RLS by default
-- If you need RLS on service role:
alter table public.posts force row level security;
```

## Debugging RLS

```sql
-- Check existing policies
select * from pg_policies where tablename = 'posts';

-- See which policies apply
explain (analyze, verbose)
select * from public.posts;

-- Check auth context
select auth.uid(), auth.role(), auth.jwt();
```
