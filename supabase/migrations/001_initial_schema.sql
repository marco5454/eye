-- 001_initial_schema.sql
-- Marcos Power Eye — initial schema
--
-- IMPORTANT: This migration is NOT idempotent. It will fail on re-run because
-- the tables already exist. This is intentional — the app stores real grant
-- tracking data over a multi-year period, and a silent re-run could wipe it.
-- If you genuinely need to reset the database during development, manually
-- run `DROP TABLE IF EXISTS risks, milestones, outputs, tasks, outcomes CASCADE;`
-- in the Supabase SQL editor first, then re-run this file.

-- OUTCOMES TABLE (top-level grant goals)
create table outcomes (
  id uuid primary key default gen_random_uuid(),
  outcome_number integer not null unique,
  title text not null,
  description text,
  color text,
  created_at timestamptz default now()
);

-- TASKS TABLE (major activities per outcome)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid references outcomes(id) on delete cascade,
  title text not null,
  description text,
  owner text,
  year_range text,
  target_kpi text,
  start_date date,
  end_date date,
  percent_complete integer default 0 check (percent_complete >= 0 and percent_complete <= 100),
  status text default 'Not Started'
    check (status in ('Not Started','In Progress','On Hold','Completed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- OUTPUTS TABLE
create table outputs (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid references outcomes(id) on delete cascade,
  output_number text not null,
  description text not null,
  numeric_target integer,
  target_label text not null,
  y1_actual integer default 0,
  y2_actual integer default 0,
  y3_actual integer default 0,
  is_ongoing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MILESTONES TABLE
create table milestones (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  type text check (type in ('Donor Report','Internal','Deliverable')),
  due_description text,
  due_date date,
  owner text,
  status text default 'Not Started'
    check (status in ('Not Started','In Progress','Submitted','Completed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RISKS TABLE
create table risks (
  id uuid primary key default gen_random_uuid(),
  risk_number integer not null,
  description text not null,
  category text not null,
  likelihood text check (likelihood in ('H','M','L')),
  impact text check (impact in ('H','M','L')),
  risk_level text check (risk_level in ('High','Medium','Low')),
  mitigation_strategy text,
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- auto updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks for each row execute function update_updated_at();
create trigger outputs_updated_at
  before update on outputs for each row execute function update_updated_at();
create trigger milestones_updated_at
  before update on milestones for each row execute function update_updated_at();
create trigger risks_updated_at
  before update on risks for each row execute function update_updated_at();
