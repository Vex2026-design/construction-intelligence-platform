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


-- Helios CM 1.0 Patch A: Admin override and governance

alter table weekly_quantity_updates
add column if not exists admin_override_reason text;

alter table weekly_quantity_updates
add column if not exists admin_override_at timestamp with time zone;

alter table weekly_quantity_updates
add column if not exists admin_override_by text;


-- Calculation Engine tables

create table if not exists project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  week_start date not null,
  planned numeric,
  forecast numeric,
  actual numeric,
  delta_planned numeric,
  delta_forecast numeric,
  spi numeric,
  health integer,
  status text,
  cod_forecast date,
  disciplines jsonb,
  created_at timestamp with time zone default now(),
  unique(project_code, week_start)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  project_code text,
  severity text,
  title text not null,
  message text,
  status text default 'Open',
  created_at timestamp with time zone default now(),
  closed_at timestamp with time zone
);

-- WBS template seed for all standard projects if missing
insert into wbs_activities(project_code,level1,level1_weight,level2,level2_weight,activity,activity_weight,unit,quantity_total,planned_start,planned_finish,active)
select p.project_code, x.level1, x.level1_weight, x.level2, x.level2_weight, x.activity, x.activity_weight, x.unit, x.quantity_total, x.planned_start::date, x.planned_finish::date, true
from (values ('V0015'),('V0021'),('V0012'),('V0057')) as p(project_code)
cross join (values
('Ingegneria',10,null,null,'Prima Emissione PE',20,'n°',1,'2025-11-01','2025-12-01'),
('Ingegneria',10,null,null,'Emissione Finale PE',10,'n°',1,'2025-12-01','2025-12-31'),
('Ingegneria',10,null,null,'As built e fascicolo finale',5,'n°',1,'2026-07-30','2026-07-30'),
('Procurement',15,null,null,'Ordine Moduli',5,'n°',1,'2025-12-15','2025-12-15'),
('Procurement',15,null,null,'Ordine Inverter',5,'n°',1,'2026-01-31','2026-01-31'),
('Procurement',15,null,null,'Ordine Strutture',15,'n°',1,'2025-11-30','2025-11-30'),
('Construction',75,'Opere Civili',10,'Recinzione',15,'ml',1310,'2026-02-09','2026-03-03'),
('Construction',75,'Opere Civili',10,'Fondazioni cabine',10,'n°',4,'2026-03-30','2026-04-24'),
('Construction',75,'Opere Civili',10,'Scavi per cavi MT/BT',10,'ml',823,'2026-03-23','2026-04-10'),
('Construction',75,'Opere Civili',10,'Viabilità interna',5,'mq',511,'2026-04-10','2026-05-18'),
('Construction',75,'Opere Meccaniche',30,'Battitura Pali',40,'n°',858,'2026-02-18','2026-03-31'),
('Construction',75,'Opere Meccaniche',30,'Sovrastrutture tipo 1',30,'n°',286,'2026-03-16','2026-05-01'),
('Construction',75,'Opere Meccaniche',30,'Montaggio Moduli',25,'n°',7436,'2026-04-02','2026-06-10'),
('Construction',75,'Opere Elettriche',38,'Stringatura moduli',10,'n°',286,'2026-05-07','2026-07-01'),
('Construction',75,'Opere Elettriche',38,'Montaggio e cablaggio Inverter',10,'n°',17,'2026-05-18','2026-06-16'),
('Construction',75,'Opere Elettriche',38,'Stesura Cavi BT Inverter',10,'ml',6488,'2026-03-30','2026-04-27'),
('Construction',75,'Opere Elettriche',38,'Stesura Cavi MT',10,'ml',402,'2026-04-06','2026-04-13'),
('Construction',75,'Collaudi e Commissioning',6,'Collaudo Tracker',20,'nr',286,'2026-07-20','2026-07-31'),
('Construction',75,'Collaudi e Commissioning',6,'Configurazione Inverter e monitoraggio',10,'nr',1,'2026-09-01','2026-09-09'),
('Construction',75,'Opere di Rete',16,'Scavi e reinterri',20,'ml',2350,'2026-04-13','2026-05-15'),
('Construction',75,'Opere di Rete',16,'TOC',20,'ml',380,'2026-04-30','2026-05-17'),
('Construction',75,'Opere di Rete',16,'Stesura Cavo',15,'ml',2500,'2026-05-15','2026-06-11')
) as x(level1,level1_weight,level2,level2_weight,activity,activity_weight,unit,quantity_total,planned_start,planned_finish)
where not exists (
  select 1 from wbs_activities w where w.project_code = p.project_code and w.activity = x.activity and coalesce(w.level2,'') = coalesce(x.level2,'')
);
