-- rls-policies.sql
-- Common RLS policy patterns for Supabase applications
-- Copy and adapt these patterns for your specific tables and requirements

-- =============================================================================
-- PATTERN 1: Public Read, Authenticated Write
-- Use case: Public content that anyone can view, but only authenticated users can create
-- =============================================================================

-- Example: Public posts table
-- create policy "Anyone can view posts"
--   on public.posts for select
--   using (true);

-- create policy "Authenticated users can create posts"
--   on public.posts for insert
--   with check (auth.role() = 'authenticated');

-- =============================================================================
-- PATTERN 2: User-Owned Resources
-- Use case: Each user can only see and modify their own data
-- =============================================================================

-- Example: User settings
-- create policy "Users can view own settings"
--   on public.user_settings for select
--   using (auth.uid() = user_id);

-- create policy "Users can update own settings"
--   on public.user_settings for update
--   using (auth.uid() = user_id);

-- create policy "Users can delete own settings"
--   on public.user_settings for delete
--   using (auth.uid() = user_id);

-- =============================================================================
-- PATTERN 3: Role-Based Access Control
-- Use case: Different access levels based on user roles
-- =============================================================================

-- Example: Admin-only table
-- create policy "Admins can do anything"
--   on public.admin_logs for all
--   using (
--     exists (
--       select 1 from public.profiles
--       where profiles.id = auth.uid()
--       and profiles.role = 'admin'
--     )
--   );

-- Example: Role-based read access
-- create policy "Users can view content based on role"
--   on public.content for select
--   using (
--     case 
--       when visibility = 'public' then true
--       when visibility = 'members' then auth.role() = 'authenticated'
--       when visibility = 'premium' then exists (
--         select 1 from public.profiles
--         where profiles.id = auth.uid()
--         and profiles.subscription = 'premium'
--       )
--       else false
--     end
--   );

-- =============================================================================
-- PATTERN 4: Organization/Team-Based Access
-- Use case: Multi-tenant applications where users belong to organizations
-- =============================================================================

-- Example: Organization members can view organization data
-- create policy "Organization members can view data"
--   on public.organization_data for select
--   using (
--     exists (
--       select 1 from public.organization_members
--       where organization_members.organization_id = organization_data.organization_id
--       and organization_members.user_id = auth.uid()
--     )
--   );

-- Example: Organization admins can modify data
-- create policy "Organization admins can modify data"
--   on public.organization_data for all
--   using (
--     exists (
--       select 1 from public.organization_members
--       where organization_members.organization_id = organization_data.organization_id
--       and organization_members.user_id = auth.uid()
--       and organization_members.role = 'admin'
--     )
--   );

-- =============================================================================
-- PATTERN 5: Shared/Collaborative Resources
-- Use case: Resources that can be shared between multiple users
-- =============================================================================

-- Example: Documents with explicit sharing
-- create policy "Users can view shared documents"
--   on public.documents for select
--   using (
--     owner_id = auth.uid()
--     or exists (
--       select 1 from public.document_shares
--       where document_shares.document_id = documents.id
--       and document_shares.user_id = auth.uid()
--     )
--   );

-- Example: Shared resources with permission levels
-- create policy "Users can modify documents based on permissions"
--   on public.documents for update
--   using (
--     owner_id = auth.uid()
--     or exists (
--       select 1 from public.document_shares
--       where document_shares.document_id = documents.id
--       and document_shares.user_id = auth.uid()
--       and document_shares.permission in ('write', 'admin')
--     )
--   );

-- =============================================================================
-- PATTERN 6: Conditional Access Based on Relationships
-- Use case: Access based on relationships between tables
-- =============================================================================

-- Example: View comments on posts you can access
-- create policy "Users can view comments on accessible posts"
--   on public.comments for select
--   using (
--     exists (
--       select 1 from public.posts
--       where posts.id = comments.post_id
--       and (
--         posts.is_public = true
--         or posts.author_id = auth.uid()
--       )
--     )
--   );

-- =============================================================================
-- PATTERN 7: Time-Based Access
-- Use case: Content available during specific time periods
-- =============================================================================

-- Example: Published content within date range
-- create policy "Users can view published content"
--   on public.content for select
--   using (
--     status = 'published'
--     and published_at <= now()
--     and (expires_at is null or expires_at > now())
--   );

-- =============================================================================
-- PATTERN 8: Hierarchical/Parent-Child Access
-- Use case: Access to child records based on parent record access
-- =============================================================================

-- Example: View tasks in projects you have access to
-- create policy "Users can view tasks in their projects"
--   on public.tasks for select
--   using (
--     exists (
--       select 1 from public.projects
--       join public.project_members on projects.id = project_members.project_id
--       where projects.id = tasks.project_id
--       and project_members.user_id = auth.uid()
--     )
--   );

-- =============================================================================
-- PATTERN 9: Custom Function-Based Policies
-- Use case: Complex logic encapsulated in a function
-- =============================================================================

-- Example: Custom permission check function
-- create or replace function public.user_has_permission(
--   resource_id uuid,
--   permission_name text
-- )
-- returns boolean as $$
-- begin
--   -- Complex permission logic here
--   return exists (
--     select 1 from public.permissions
--     where permissions.user_id = auth.uid()
--     and permissions.resource_id = resource_id
--     and permissions.permission = permission_name
--   );
-- end;
-- $$ language plpgsql security definer;

-- create policy "Users with permission can access resource"
--   on public.resources for select
--   using (public.user_has_permission(id, 'read'));

-- =============================================================================
-- PATTERN 10: Anonymous vs Authenticated Access
-- Use case: Different access levels for anonymous and logged-in users
-- =============================================================================

-- Example: Limited anonymous access
-- create policy "Everyone can view public items"
--   on public.items for select
--   using (
--     is_public = true
--     and (
--       auth.role() = 'anon'
--       or auth.role() = 'authenticated'
--     )
--   );

-- create policy "Authenticated users can view premium items"
--   on public.items for select
--   using (
--     auth.role() = 'authenticated'
--     and is_premium = true
--   );

-- =============================================================================
-- PERFORMANCE OPTIMIZATION TIPS
-- =============================================================================

-- 1. Add indexes on columns used in RLS policies
-- create index users_organization_id_idx on public.users(organization_id);
-- create index posts_author_id_idx on public.posts(author_id);
-- create index posts_status_idx on public.posts(status);

-- 2. Use security definer functions for complex checks
-- This evaluates the logic once rather than for each row

-- 3. Avoid complex subqueries if possible
-- Use joins and indexes instead

-- 4. Test policy performance with EXPLAIN ANALYZE
-- explain analyze select * from public.posts;

-- 5. Consider denormalizing data for better RLS performance
-- Store user_id directly instead of joining through multiple tables

-- =============================================================================
-- TESTING RLS POLICIES
-- =============================================================================

-- Test as anonymous user
-- begin;
-- set local role to anon;
-- set local request.jwt.claim.sub to '';
-- select * from public.posts; -- Should only see public posts
-- rollback;

-- Test as authenticated user
-- begin;
-- set local role to authenticated;
-- set local request.jwt.claim.sub to 'USER_UUID_HERE';
-- select * from public.posts; -- Should see own posts + public posts
-- rollback;

-- =============================================================================
-- COMMON PITFALLS TO AVOID
-- =============================================================================

-- 1. Don't forget to enable RLS!
-- alter table public.my_table enable row level security;

-- 2. Always have at least one policy or table will be inaccessible
-- Even to the owner!

-- 3. Use WITH CHECK for INSERT and UPDATE policies
-- USING clause only applies to SELECT, UPDATE, DELETE

-- 4. Be careful with cascading deletes and RLS
-- Deleted data must be accessible by the RLS policy

-- 5. Service role bypasses RLS
-- Be careful when using service_role key

-- 6. Test policies thoroughly before deploying
-- Use the test-rls.sh script

-- 7. Consider security definer functions for admin operations
-- Allows bypassing RLS for specific operations
