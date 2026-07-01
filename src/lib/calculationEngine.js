import { supabase } from "./supabase";
import { getProjects } from "./api";

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(v || 0)));
}

function weightedProgress(row) {
  const activity = row.wbs_activities || row.activity_ref || {};
  const qtyTotal = Number(activity.quantity_total || row.quantity_total || 0);
  const qtyCumulative = Number(row.qty_cumulative || 0);
  const progress = qtyTotal > 0 ? qtyCumulative / qtyTotal : Number(row.progress_pct || 0);

  const w1 = Number(activity.level1_weight || row.level1_weight || 0) / 100;
  const w2 = activity.level2_weight === null || activity.level2_weight === undefined
    ? 1
    : Number(activity.level2_weight || row.level2_weight || 0) / 100;
  const w3 = Number(activity.activity_weight || row.activity_weight || 0) / 100;

  return {
    progress: clamp(progress),
    weighted: clamp(progress) * w1 * w2 * w3,
    discipline: activity.level2 || activity.level1 || row.level2 || row.level1 || "Unassigned"
  };
}

export function calculateProjectSnapshot(project, approvedRows, weekStart) {
  const rows = approvedRows.filter(r => r.project_code === project.code);

  if (!rows.length) {
    return {
      project_code: project.code,
      week_start: weekStart,
      has_data: false,
      planned: null,
      forecast: null,
      actual: null,
      delta_planned: null,
      delta_forecast: null,
      spi: null,
      health: null,
      cod_forecast: null,
      status: "NO APPROVED DATA",
      disciplines: {}
    };
  }

  const latestByActivity = {};
  rows.forEach(r => { latestByActivity[r.wbs_activity_id || r.id] = r; });

  let actual = 0;
  const disciplinesRaw = {};

  Object.values(latestByActivity).forEach(row => {
    const wp = weightedProgress(row);
    actual += wp.weighted;
    disciplinesRaw[wp.discipline] = disciplinesRaw[wp.discipline] || { weighted: 0, weight: 0 };

    const a = row.wbs_activities || {};
    const w1 = Number(a.level1_weight || row.level1_weight || 0) / 100;
    const w2 = a.level2_weight === null || a.level2_weight === undefined ? 1 : Number(a.level2_weight || row.level2_weight || 0) / 100;
    const w3 = Number(a.activity_weight || row.activity_weight || 0) / 100;

    disciplinesRaw[wp.discipline].weighted += wp.weighted;
    disciplinesRaw[wp.discipline].weight += w1 * w2 * w3;
  });

  actual = clamp(actual);
  const planned = Number(project.planned || 0);
  const forecast = Number(project.forecast || 0);
  const deltaPlanned = actual - planned;
  const deltaForecast = actual - forecast;
  const spi = planned > 0 ? actual / planned : null;

  let health = 100;
  if (deltaPlanned < -0.15) health -= 35;
  else if (deltaPlanned < -0.08) health -= 22;
  else if (deltaPlanned < -0.03) health -= 10;

  if (deltaForecast < -0.10) health -= 20;
  else if (deltaForecast < -0.04) health -= 10;

  const status = deltaPlanned < -0.12 ? "CRITICAL" : deltaPlanned < -0.05 ? "ATTENTION" : "ON TRACK";

  const disciplines = {};
  Object.entries(disciplinesRaw).forEach(([name, d]) => {
    disciplines[name] = d.weight > 0 ? clamp(d.weighted / d.weight) : 0;
  });

  return {
    project_code: project.code,
    week_start: weekStart,
    has_data: true,
    planned,
    forecast,
    actual,
    delta_planned: deltaPlanned,
    delta_forecast: deltaForecast,
    spi,
    health: Math.max(0, Math.min(100, Math.round(health))),
    cod_forecast: project.cod || project.cod_target || null,
    status,
    disciplines
  };
}

export async function runCalculationEngine(projectCode = null, weekStart = null) {
  const projects = await getProjects();

  if (!supabase) {
    return {
      snapshots: projects.map(p => calculateProjectSnapshot(p, [], weekStart || new Date().toISOString().slice(0, 10))),
      alerts: []
    };
  }

  let q = supabase
    .from("weekly_quantity_updates")
    .select("*, wbs_activities:wbs_activity_id(*)")
    .eq("status", "Approved");

  if (projectCode) q = q.eq("project_code", projectCode);
  if (weekStart) q = q.lte("week_start", weekStart);

  const { data, error } = await q;
  if (error) throw error;

  const selectedProjects = projectCode ? projects.filter(p => p.code === projectCode) : projects;
  const effectiveWeek = weekStart || new Date().toISOString().slice(0, 10);
  const snapshots = selectedProjects.map(p => calculateProjectSnapshot(p, data || [], effectiveWeek));

  const alerts = [];
  snapshots.forEach(s => {
    if (!s.has_data) {
      alerts.push({
        project_code: s.project_code,
        severity: "INFO",
        title: "No approved weekly data",
        message: "Dashboard in attesa del primo Weekly approvato."
      });
      return;
    }
    if (s.delta_planned < -0.12) {
      alerts.push({
        project_code: s.project_code,
        severity: "CRITICAL",
        title: "Project behind baseline",
        message: `Actual sotto planned di ${(Math.abs(s.delta_planned) * 100).toFixed(1)} punti percentuali.`
      });
    } else if (s.delta_planned < -0.05) {
      alerts.push({
        project_code: s.project_code,
        severity: "WARNING",
        title: "Project requires attention",
        message: `Delta planned ${(s.delta_planned * 100).toFixed(1)}%.`
      });
    }
  });

  await persistSnapshots(snapshots, alerts);
  return { snapshots, alerts };
}

async function persistSnapshots(snapshots, alerts) {
  if (!supabase) return;

  for (const s of snapshots.filter(x => x.has_data)) {
    await supabase.from("project_snapshots").upsert({
      project_code: s.project_code,
      week_start: s.week_start,
      planned: s.planned,
      forecast: s.forecast,
      actual: s.actual,
      delta_planned: s.delta_planned,
      delta_forecast: s.delta_forecast,
      spi: s.spi,
      health: s.health,
      status: s.status,
      cod_forecast: s.cod_forecast,
      disciplines: s.disciplines
    }, { onConflict: "project_code,week_start" });
  }

  for (const a of alerts) {
    await supabase.from("alerts").insert({
      project_code: a.project_code,
      severity: a.severity,
      title: a.title,
      message: a.message,
      status: "Open"
    });
  }
}

export async function getLatestSnapshots() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("project_snapshots")
    .select("*")
    .order("week_start", { ascending: false });

  if (error) return [];

  const latest = {};
  (data || []).forEach(s => {
    if (!latest[s.project_code]) latest[s.project_code] = s;
  });
  return Object.values(latest);
}

export async function getAlerts(status = "Open") {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}
