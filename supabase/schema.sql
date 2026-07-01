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


create table if not exists phase_progress (
  id uuid primary key default gen_random_uuid(),
  sal_import_id uuid references sal_imports(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  phase text,
  planned numeric,
  forecast numeric,
  actual numeric,
  delta_plan numeric,
  delta_forecast numeric
);

create table if not exists s_curve_points (
  id uuid primary key default gen_random_uuid(),
  sal_import_id uuid references sal_imports(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  point_date date,
  planned numeric,
  forecast numeric,
  actual numeric
);
