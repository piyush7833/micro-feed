-- Micro Feed Database Schema
-- Run this script in your Supabase SQL editor to set up the database

-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- Create posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000 AND char_length(content) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create likes table
create table if not exists likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Create indexes for better performance
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_likes_post_id on likes(post_id);
create index if not exists idx_likes_user_id on likes(user_id);
create index if not exists idx_profiles_username on profiles(username);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;

-- Drop existing policies if they exist (for re-running script)
drop policy if exists "read profiles" on profiles;
drop policy if exists "upsert self profile" on profiles;
drop policy if exists "read posts" on posts;
drop policy if exists "insert own posts" on posts;
drop policy if exists "update own posts" on posts;
drop policy if exists "delete own posts" on posts;
drop policy if exists "read likes" on likes;
drop policy if exists "like" on likes;
drop policy if exists "unlike" on likes;

-- Profiles policies: read all, write self
create policy "read profiles" on profiles for select using (true);
create policy "upsert self profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Posts policies: read all; insert/update/delete only own
create policy "read posts" on posts for select using (true);
create policy "insert own posts" on posts for insert with check (auth.uid() = author_id);
create policy "update own posts" on posts for update using (auth.uid() = author_id);
create policy "delete own posts" on posts for delete using (auth.uid() = author_id);

-- Likes policies: read all; like/unlike as self
create policy "read likes" on likes for select using (true);
create policy "like" on likes for insert with check (auth.uid() = user_id);
create policy "unlike" on likes for delete using (auth.uid() = user_id);

-- Create a trigger to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_posts_updated_at
  before update on posts
  for each row
  execute function update_updated_at_column();
