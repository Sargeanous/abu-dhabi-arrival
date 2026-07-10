-- SettleSide storage schema.
-- Run this once in the Supabase SQL editor (or via supabase db push).
--
-- Document-style tables: each row holds one record as jsonb, validated by the
-- app's zod schemas on read. "position" preserves the app's list ordering
-- (newest first). Normalize into full relational columns later if querying
-- needs grow.

create table if not exists public.providers (
  id text primary key,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id text primary key,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id text primary key,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock everything down: RLS enabled with no policies means the anon and
-- authenticated roles can read nothing. The app connects with the service
-- role key (server-side only), which bypasses RLS.
alter table public.providers enable row level security;
alter table public.catalog_items enable row level security;
alter table public.inquiries enable row level security;
