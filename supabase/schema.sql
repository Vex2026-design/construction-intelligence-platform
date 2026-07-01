create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'IPP',
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  technology text,
  mw_dc numeric,
  mw_ac numeric,
  planned numeric default 0,
  forecast numeric default 0,
  actual numeric default 0,
  health integer default 0,
  status text default 'NO DATA',
  cod_target date,
  created_at timestamp with time zone default now()
);

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
  unique(user_id, project_code)
);

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
  week_end date,
  qty_previous numeric default 0,
  qty_week numeric default 0,
  qty_cumulative numeric default 0,
  progress_pct numeric default 0,
  notes text,
  forecast_finish date,
  status text default 'Draft',
  submitted_by text,
  submitted_at timestamp with time zone,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  constraint weekly_quantity_updates_unique_week_activity unique(project_code, wbs_activity_id, week_start)
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_code text,
  title text not null,
  owner text,
  impact text,
  status text default 'Open',
  created_at timestamp with time zone default now()
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

insert into projects(code,name,technology,mw_dc,mw_ac,planned,forecast,actual,health,status,cod_target) values
('V0015','Atzori','Tracker 2P',5.51,4.9,.797,.380,.291,64,'ATTENTION','2026-09-14'),
('V0021','Friargiu','Tracker 2P',5.59,4.5,.724,.383,.354,72,'ATTENTION','2026-09-20'),
('V0012','Loffreda','Tracker 1P',5.999,5.5,.360,.360,.265,66,'ATTENTION','2026-10-02'),
('V0057','Bertolin','Tracker 1P',11.818,10.8,.673,.069,.446,76,'ON TRACK','2026-09-30')
on conflict(code) do nothing;

insert into issues(project_code,title,owner,impact,status) values
('V0015','Opere elettriche sotto baseline','IPP/EPC','High','Open'),
('V0021','Forecast EPC da verificare','IPP','Medium','Open'),
('V0012','Necessario recovery plan','EPC','High','Open')
on conflict do nothing;
