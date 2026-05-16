create extension if not exists pgcrypto;

do $$ begin
    if not exists (select 1 from pg_type where typname = 'store_status') then
        create type public.store_status as enum (
          'open',
          'closed',
          'relocated',
          'announced',
          'temporary'
        );
    end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'fr')),
  public_profile boolean not null default false,
  trust_level integer not null default 0 check (trust_level between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, public_profile)
  values (
    new.id,
    'atlas_' || left(replace(new.id::text, '-', ''), 10),
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- New function to allow users to delete themselves
create or replace function public.delete_own_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

alter table public.profiles enable row level security;

create policy "Users can read public profiles" on public.profiles
for select using (public_profile or id = auth.uid());

create policy "Users can update own profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert own profile" on public.profiles
for insert with check (id = auth.uid());
