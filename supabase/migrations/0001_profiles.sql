-- Phase 2 — profiles table + owner RLS + on-signup trigger.
-- Apply to a real Supabase project (via the SQL editor or `supabase db push`)
-- once NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are set.
-- Until then the app runs in demo-session mode and this file is dormant.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- On every new auth user, upsert a matching profile row. SECURITY DEFINER so
-- the trigger can write past RLS; search_path pinned to public to avoid
-- function-hijacking via a mutable search_path.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, plan)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
