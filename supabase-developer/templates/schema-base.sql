-- schema-base.sql
-- Base schema with profiles, common patterns, and RLS
-- This template provides a foundation for Supabase applications

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enable timestamp modification tracking
create extension if not exists "moddatetime";

-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Example: User role enum
create type user_role as enum ('user', 'admin', 'moderator');

-- Example: Post status enum
create type post_status as enum ('draft', 'published', 'archived');

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================

-- Extends auth.users with additional profile information
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  role user_role default 'user' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 50),
  constraint username_format check (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Enable RLS
alter table public.profiles enable row level security;

-- =============================================================================
-- POSTS TABLE (Example Content Table)
-- =============================================================================

create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,
  slug text unique not null,
  status post_status default 'draft' not null,
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint title_length check (char_length(title) >= 1 and char_length(title) <= 200),
  constraint slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- Enable RLS
alter table public.posts enable row level security;

-- Indexes for performance
create index posts_author_id_idx on public.posts(author_id);
create index posts_status_idx on public.posts(status);
create index posts_created_at_idx on public.posts(created_at desc);

-- =============================================================================
-- COMMENTS TABLE (Example Related Table)
-- =============================================================================

create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint content_length check (char_length(content) >= 1 and char_length(content) <= 1000)
);

-- Enable RLS
alter table public.comments enable row level security;

-- Indexes for performance
create index comments_post_id_idx on public.comments(post_id);
create index comments_author_id_idx on public.comments(author_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically create profile on user signup
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

-- Function to update published_at timestamp
create or replace function public.handle_post_published()
returns trigger as $$
begin
  if new.status = 'published' and old.status != 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp for profiles
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function moddatetime(updated_at);

-- Auto-update updated_at timestamp for posts
create trigger handle_posts_updated_at
  before update on public.posts
  for each row execute function moddatetime(updated_at);

-- Set published_at when post is published
create trigger handle_posts_published
  before update on public.posts
  for each row execute function public.handle_post_published();

-- Auto-update updated_at timestamp for comments
create trigger handle_comments_updated_at
  before update on public.comments
  for each row execute function moddatetime(updated_at);

-- =============================================================================
-- RLS POLICIES - PROFILES
-- =============================================================================

-- Anyone can view public profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================================================
-- RLS POLICIES - POSTS
-- =============================================================================

-- Anyone can view published posts
create policy "Published posts are viewable by everyone"
  on public.posts for select
  using (status = 'published');

-- Authors can view their own posts (any status)
create policy "Authors can view their own posts"
  on public.posts for select
  using (auth.uid() = author_id);

-- Authenticated users can insert posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

-- Authors can update their own posts
create policy "Authors can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

-- Authors can delete their own posts
create policy "Authors can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- =============================================================================
-- RLS POLICIES - COMMENTS
-- =============================================================================

-- Anyone can view comments on published posts
create policy "Comments on published posts are viewable"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = comments.post_id
      and posts.status = 'published'
    )
  );

-- Authors can view comments on their own posts
create policy "Authors can view comments on their posts"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = comments.post_id
      and posts.author_id = auth.uid()
    )
  );

-- Authenticated users can create comments
create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts
      where posts.id = comments.post_id
      and posts.status = 'published'
    )
  );

-- Comment authors can update their comments
create policy "Authors can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id);

-- Comment authors can delete their comments
create policy "Authors can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- =============================================================================
-- REALTIME PUBLICATION (Optional)
-- =============================================================================

-- Enable realtime for posts
-- alter publication supabase_realtime add table public.posts;

-- Enable realtime for comments
-- alter publication supabase_realtime add table public.comments;
