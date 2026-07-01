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


-- V1.0 Login, Roles & Permissions

create table if not exists user_profiles (
  id uuid primary key,
  email text unique not null,
  full_name text,
  role text not null default 'pm_ipp',
  company text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists project_user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  project_code text not null,
  access_level text default 'read',
  created_at timestamp with time zone default now(),
  unique(user_id, project_code)
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  action text not null,
  entity text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone default now()
);

alter table weekly_quantity_updates
add column if not exists submitted_by_user uuid;

alter table weekly_quantity_updates
add column if not exists reviewed_by_user uuid;


-- V1.1 Admin Users

create table if not exists roles_catalog (
  role text primary key,
  label text not null,
  portal text not null,
  description text
);

insert into roles_catalog (role, label, portal, description) values
('admin','Admin','ipp','Accesso completo e amministrazione utenti'),
('director','Direzione','ipp','Dashboard e report direzionali'),
('pm_ipp','PM IPP','ipp','Controllo progetti e approvazione weekly'),
('viewer','Viewer','ipp','Sola lettura'),
('epc_pm','EPC PM','epc','Compilazione weekly per progetti assegnati'),
('site_manager','Site Manager','epc','Compilazione limitata di cantiere')
on conflict (role) do nothing;


-- V1.2 IPP Analytics / robust weekly engine

alter table weekly_quantity_updates
add column if not exists week_end date;

alter table weekly_quantity_updates
add column if not exists rejection_reason text;

alter table weekly_quantity_updates
add column if not exists forecast_finish date;

alter table weekly_quantity_updates
add column if not exists ipp_comment text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'weekly_quantity_updates_unique_week_activity'
  ) then
    alter table weekly_quantity_updates
    add constraint weekly_quantity_updates_unique_week_activity
    unique (project_code, wbs_activity_id, week_start);
  end if;
end $$;
