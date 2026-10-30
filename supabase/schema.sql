-- =========================================================
--  Rutinas App - Esquema Supabase
--  Ejecuta este archivo en: Supabase Dashboard > SQL Editor
--  IMPORTANTE: habilita "Anonymous sign-ins" en
--  Authentication > Sign In / Providers > Anonymous
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- Rutinas ----------
create table if not exists public.routines (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  emoji        text not null default '☀️',
  color        text not null default '#8B7CFF',
  -- días de la semana: 0 = domingo ... 6 = sábado
  days         smallint[] not null default '{1,2,3,4,5}',
  start_time   time not null default '07:00',
  reminder     boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- Pasos / hábitos de cada rutina ----------
create table if not exists public.steps (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routines(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  emoji        text not null default '✅',
  duration_sec integer not null default 300 check (duration_sec > 0),
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists steps_routine_idx on public.steps(routine_id, position);
create index if not exists routines_user_idx on public.routines(user_id);

-- ---------- Row Level Security ----------
alter table public.routines enable row level security;
alter table public.steps    enable row level security;

drop policy if exists "routines_owner" on public.routines;
create policy "routines_owner" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "steps_owner" on public.steps;
create policy "steps_owner" on public.steps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
