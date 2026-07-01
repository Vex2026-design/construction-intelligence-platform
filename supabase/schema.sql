create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  technology text,
  mw_dc numeric,
  mw_ac numeric,
  cod_target date,
  region text,
  ipp_pm text,
  epc_pm text,
  created_at timestamp with time zone default now()
);

create table if not exists sal_imports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  file_name text,
  storage_path text,
  sheet_name text,
  control_date date,
  imported_at timestamp with time zone default now(),
  planned numeric,
  forecast numeric,
  actual numeric,
  delta_plan numeric,
  delta_forecast numeric,
  status text,
  health integer
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  category text,
  impact_cod text,
  priority text,
  owner text,
  due_date date,
  status text default 'Open',
  mitigation text,
  created_at timestamp with time zone default now(),
  closed_at timestamp with time zone
);


-- WBS + EPC Weekly Input

create table if not exists wbs_activities (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  level1 text not null,
  level1_weight numeric,
  level2 text,
  level2_weight numeric,
  activity text not null,
  activity_weight numeric,
  unit text,
  quantity_total numeric,
  planned_start date,
  planned_finish date,
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists weekly_quantity_updates (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  wbs_activity_id uuid references wbs_activities(id) on delete cascade,
  week_start date not null,
  qty_previous numeric default 0,
  qty_week numeric default 0,
  qty_cumulative numeric default 0,
  progress_pct numeric default 0,
  notes text,
  status text default 'Draft',
  submitted_by text,
  submitted_at timestamp with time zone,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);


-- V3.4 Approval Workflow

alter table weekly_quantity_updates
add column if not exists week_end date;

alter table weekly_quantity_updates
add column if not exists rejection_reason text;

create table if not exists weekly_review_log (
  id uuid primary key default gen_random_uuid(),
  update_id uuid references weekly_quantity_updates(id) on delete cascade,
  project_code text not null,
  action text not null,
  reviewer text,
  reason text,
  created_at timestamp with time zone default now()
);
