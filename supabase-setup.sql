-- ============================================================================
-- Saud AlAbdan CMS — Supabase setup
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query.
-- It creates the whole-document store, the media bucket, and RLS policies.
-- ============================================================================

-- 1) Content table: ONE row holds the entire window.SITE document (whole-doc).
create table if not exists public.site_content (
  id         text primary key default 'singleton',
  doc        jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Ensure the single row exists (seed it from config/site.config.js afterwards,
-- via the CMS "Save", or by pasting the JSON here).
insert into public.site_content (id, doc)
values ('singleton', '{}'::jsonb)
on conflict (id) do nothing;

-- 2) Row Level Security: anyone may READ; only authenticated users may WRITE.
alter table public.site_content enable row level security;

drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read
  on public.site_content for select
  using (true);

drop policy if exists site_content_auth_insert on public.site_content;
create policy site_content_auth_insert
  on public.site_content for insert to authenticated
  with check (true);

drop policy if exists site_content_auth_update on public.site_content;
create policy site_content_auth_update
  on public.site_content for update to authenticated
  using (true) with check (true);

-- 3) Storage bucket for media (images + files). Public read.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies: public read of the media bucket; authenticated write.
drop policy if exists media_public_read on storage.objects;
create policy media_public_read
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists media_auth_insert on storage.objects;
create policy media_auth_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists media_auth_update on storage.objects;
create policy media_auth_update
  on storage.objects for update to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

-- 4) Admin user
-- Create the admin login in Dashboard → Authentication → Users → "Add user"
-- (set email + password, mark email confirmed). That account is what the CMS
-- login screen uses. No SQL needed for this step.
