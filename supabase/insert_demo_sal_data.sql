-- Demo data SAL per vedere subito la dashboard collegata a Supabase
-- Esegui in SQL Editor dopo schema.sql

with p as (
  select id, code from projects
)
insert into sal_imports (
  project_id, file_name, sheet_name, control_date, planned, forecast, actual,
  delta_plan, delta_forecast, status, health
)
select id, 'Demo SAL', 'Report per data', '2026-06-27',
case code
  when 'V0012' then 0.360
  when 'V0015' then 0.797
  when 'V0021' then 0.724
  when 'V0057' then 0.673
end,
case code
  when 'V0012' then 0.360
  when 'V0015' then 0.380
  when 'V0021' then 0.383
  when 'V0057' then 0.069
end,
case code
  when 'V0012' then 0.265
  when 'V0015' then 0.291
  when 'V0021' then 0.354
  when 'V0057' then 0.446
end,
case code
  when 'V0012' then -0.095
  when 'V0015' then -0.506
  when 'V0021' then -0.370
  when 'V0057' then -0.227
end,
case code
  when 'V0012' then -0.095
  when 'V0015' then -0.090
  when 'V0021' then -0.029
  when 'V0057' then 0.377
end,
'ATTENTION',
case code
  when 'V0012' then 66
  when 'V0015' then 52
  when 'V0021' then 61
  when 'V0057' then 72
end
from p
where code in ('V0012','V0015','V0021','V0057');

insert into issues (project_id, title, category, impact_cod, priority, owner, status, mitigation)
select id,
case code
  when 'V0015' then 'Ritardo rispetto alla baseline Planned'
  when 'V0021' then 'Delta Planned rilevante, forecast quasi allineato'
  when 'V0057' then 'Actual sopra forecast ma sotto baseline'
  else 'Monitoraggio avanzamento progetto'
end,
'Schedule',
case code
  when 'V0015' then 'High'
  else 'Medium'
end,
'Medium',
'IPP/EPC',
'Open',
'Verificare recovery plan, forecast e attività sul critical path.'
from projects
where code in ('V0012','V0015','V0021','V0057');
