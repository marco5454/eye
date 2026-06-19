-- 002_rls_policies.sql
-- Enable RLS on all tables and grant full access to the anon role.
--
-- Context: this app is single-user with no auth (per brief). All requests
-- come from the browser using the anon key. Real protection comes from
-- where the app is deployed (private URL, Vercel password protection,
-- VPN, etc.) -- NOT from RLS itself.
--
-- If you later add Supabase Auth, replace these permissive policies with
-- per-user ones (e.g. `using (auth.uid() = owner_id)`).
--
-- This migration is NOT idempotent. To re-run after a failure:
--   drop policy if exists "anon full access" on outcomes;
--   drop policy if exists "anon full access" on tasks;
--   drop policy if exists "anon full access" on outputs;
--   drop policy if exists "anon full access" on milestones;
--   drop policy if exists "anon full access" on risks;
-- then run this file again.

-- Enable RLS (no-op if Supabase already enabled it via the dashboard prompt).
alter table outcomes   enable row level security;
alter table tasks      enable row level security;
alter table outputs    enable row level security;
alter table milestones enable row level security;
alter table risks      enable row level security;

-- Permissive policies: anon can SELECT/INSERT/UPDATE/DELETE everything.
create policy "anon full access" on outcomes
  for all to anon using (true) with check (true);

create policy "anon full access" on tasks
  for all to anon using (true) with check (true);

create policy "anon full access" on outputs
  for all to anon using (true) with check (true);

create policy "anon full access" on milestones
  for all to anon using (true) with check (true);

create policy "anon full access" on risks
  for all to anon using (true) with check (true);
