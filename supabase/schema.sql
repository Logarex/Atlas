create extension if not exists pgcrypto;

create type public.store_status as enum (
  'open',
  'closed',
  'relocated',
  'announced',
  'temporary'
);

create type public.submission_status as enum (
  'pending',
  'approved',
  'rejected',
  'needs_changes'
);

create type public.review_decision as enum (
  'approved',
  'rejected',
  'needs_changes'
);

create type public.friendship_status as enum (
  'pending',
  'accepted',
  'blocked'
);

create type public.visibility as enum (
  'private',
  'friends',
  'public'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'fr')),
  public_profile boolean not null default false,
  is_reviewer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id text primary key,
  status public.store_status not null,
  name jsonb not null,
  country_code char(2) not null,
  city text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  opened_on date,
  closed_on date,
  official_url text,
  architecture jsonb not null default '{}'::jsonb,
  hours jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_sources (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  field_path text not null,
  label text not null,
  url text not null,
  license text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id text not null references public.stores(id) on delete cascade,
  visited_on date,
  note text,
  visibility public.visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, store_id, visited_on)
);

create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  store_id text references public.stores(id) on delete set null,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  status public.submission_status not null default 'pending',
  payload jsonb not null,
  source_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photo_submissions (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  status public.submission_status not null default 'pending',
  storage_path text not null,
  license text not null check (license in ('CC-BY-4.0', 'CC0-1.0')),
  caption text,
  taken_on date,
  people_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  uploader_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  license text not null,
  credit text,
  caption text,
  taken_on date,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_table text not null check (request_table in ('change_requests', 'photo_submissions')),
  request_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision public.review_decision not null,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.is_reviewer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_reviewer from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_sources enable row level security;
alter table public.visits enable row level security;
alter table public.friendships enable row level security;
alter table public.change_requests enable row level security;
alter table public.photo_submissions enable row level security;
alter table public.photos enable row level security;
alter table public.reviews enable row level security;

create policy "Public can read stores" on public.stores
for select using (true);

create policy "Public can read store sources" on public.store_sources
for select using (true);

create policy "Public can read approved photos" on public.photos
for select using (true);

create policy "Users can read public profiles" on public.profiles
for select using (public_profile or id = auth.uid() or public.is_reviewer());

create policy "Users can update own profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert own profile" on public.profiles
for insert with check (id = auth.uid());

create policy "Users can read own visits and public visits" on public.visits
for select using (
  user_id = auth.uid()
  or visibility = 'public'
  or public.is_reviewer()
);

create policy "Users can manage own visits" on public.visits
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can read own friendships" on public.friendships
for select using (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
  or public.is_reviewer()
);

create policy "Users can create friend requests" on public.friendships
for insert with check (requester_id = auth.uid());

create policy "Users can update friendships involving them" on public.friendships
for update using (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
) with check (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
);

create policy "Users can create change requests" on public.change_requests
for insert with check (submitted_by = auth.uid());

create policy "Users and reviewers can read change requests" on public.change_requests
for select using (submitted_by = auth.uid() or public.is_reviewer());

create policy "Reviewers can update change requests" on public.change_requests
for update using (public.is_reviewer()) with check (public.is_reviewer());

create policy "Users can create photo submissions" on public.photo_submissions
for insert with check (submitted_by = auth.uid());

create policy "Users and reviewers can read photo submissions" on public.photo_submissions
for select using (submitted_by = auth.uid() or public.is_reviewer());

create policy "Reviewers can update photo submissions" on public.photo_submissions
for update using (public.is_reviewer()) with check (public.is_reviewer());

create policy "Reviewers can create reviews" on public.reviews
for insert with check (public.is_reviewer());

create policy "Reviewers can read reviews" on public.reviews
for select using (public.is_reviewer());
