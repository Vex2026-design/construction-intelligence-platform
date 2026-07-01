import { supabase } from "./supabase";
import { fallbackWbs } from "../data/fallbackWbs";

export async function getWbsActivities(projectCode = "TEMPLATE") {
  if (!supabase) return fallbackWbs.map(r => ({ ...r, project_code: projectCode }));
  const { data, error } = await supabase
    .from("wbs_activities")
    .select("*")
    .eq("project_code", projectCode)
    .eq("active", true)
    .order("level1", { ascending: true })
    .order("level2", { ascending: true })
    .order("activity", { ascending: true });

  if (error) return fallbackWbs.map(r => ({ ...r, project_code: projectCode }));
  return (data && data.length) ? data : fallbackWbs.map(r => ({ ...r, project_code: projectCode }));
}

export async function getWeeklyUpdates(projectCode, weekStart) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("weekly_quantity_updates")
    .select("*")
    .eq("project_code", projectCode)
    .eq("week_start", weekStart);

  if (error) return fallbackWbs.map(r => ({ ...r, project_code: projectCode }));
  return (data && data.length) ? data : fallbackWbs.map(r => ({ ...r, project_code: projectCode }));
}


export async function updateWbsQuantities(rows) {
  if (!supabase) return;

  const updates = rows
    .filter((r) => r.id && !String(r.id).startsWith("fb-"))
    .map((r) => ({
      id: r.id,
      quantity_total: Number(r.quantity_total || 0)
    }));

  for (const row of updates) {
    const { error } = await supabase
      .from("wbs_activities")
      .update({ quantity_total: row.quantity_total })
      .eq("id", row.id);

    if (error) throw error;
  }
}


export async function saveWeeklyUpdates(projectCode, weekStart, rows) {
  if (!supabase) throw new Error("Supabase non configurato.");

  await updateWbsQuantities(rows);

  const payload = rows.map((r) => {
    const qtyTotal = Number(r.quantity_total || 0);
    const qtyPrevious = Number(r.qty_previous || 0);
    const qtyWeek = Number(r.qty_week || 0);
    const qtyCumulative = Math.min(qtyTotal || 0, qtyPrevious + qtyWeek);
    const progressPct = qtyTotal > 0 ? qtyCumulative / qtyTotal : 0;

    return {
      project_code: projectCode,
      wbs_activity_id: r.id,
      week_start: weekStart,
      qty_previous: qtyPrevious,
      qty_week: qtyWeek,
      qty_cumulative: qtyCumulative,
      progress_pct: progressPct,
      notes: r.notes || "",
      status: "Submitted",
      submitted_by: "EPC",
      submitted_at: new Date().toISOString()
    };
  });

  const { error } = await supabase
    .from("weekly_quantity_updates")
    .upsert(payload, { onConflict: "project_code,wbs_activity_id,week_start" });

  if (error) throw error;
}

export function calculateProgressFromWbs(rows) {
  const active = rows.filter((r) => Number(r.quantity_total || 0) > 0 && Number(r.activity_weight || 0) > 0);
  const weighted = active.reduce((sum, r) => {
    const qtyTotal = Number(r.quantity_total || 0);
    const qtyPrevious = Number(r.qty_previous || 0);
    const qtyWeek = Number(r.qty_week || 0);
    const qtyCumulative = Math.min(qtyTotal, qtyPrevious + qtyWeek);
    const progress = qtyTotal > 0 ? qtyCumulative / qtyTotal : 0;
    const w1 = Number(r.level1_weight || 0) / 100;
    const w2 = r.level2_weight === null || r.level2_weight === undefined ? 1 : Number(r.level2_weight || 0) / 100;
    const w3 = Number(r.activity_weight || 0) / 100;
    return sum + progress * w1 * w2 * w3;
  }, 0);
  return weighted;
}


export async function createWbsActivity(activity) {
  if (!supabase) throw new Error("Supabase non configurato.");

  const { data, error } = await supabase
    .from("wbs_activities")
    .insert({
      project_code: activity.project_code,
      level1: activity.level1,
      level1_weight: Number(activity.level1_weight || 0),
      level2: activity.level2 || null,
      level2_weight: activity.level2 ? Number(activity.level2_weight || 0) : null,
      activity: activity.activity,
      activity_weight: Number(activity.activity_weight || 0),
      unit: activity.unit,
      quantity_total: Number(activity.quantity_total || 0),
      planned_start: activity.planned_start || null,
      planned_finish: activity.planned_finish || null,
      active: true
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateWbsActivity(activity) {
  if (!supabase) throw new Error("Supabase non configurato.");

  const { data, error } = await supabase
    .from("wbs_activities")
    .update({
      level1: activity.level1,
      level1_weight: Number(activity.level1_weight || 0),
      level2: activity.level2 || null,
      level2_weight: activity.level2 ? Number(activity.level2_weight || 0) : null,
      activity: activity.activity,
      activity_weight: Number(activity.activity_weight || 0),
      unit: activity.unit,
      quantity_total: Number(activity.quantity_total || 0),
      planned_start: activity.planned_start || null,
      planned_finish: activity.planned_finish || null
    })
    .eq("id", activity.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deactivateWbsActivity(id) {
  if (!supabase) throw new Error("Supabase non configurato.");

  const { error } = await supabase
    .from("wbs_activities")
    .update({ active: false })
    .eq("id", id);

  if (error) throw error;
}
