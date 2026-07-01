import { supabase } from "./supabase";

export async function getWbsActivities(projectCode = "TEMPLATE") {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("wbs_activities")
    .select("*")
    .eq("project_code", projectCode)
    .eq("active", true)
    .order("level1", { ascending: true })
    .order("level2", { ascending: true })
    .order("activity", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getWeeklyUpdates(projectCode, weekStart) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("weekly_quantity_updates")
    .select("*")
    .eq("project_code", projectCode)
    .eq("week_start", weekStart);

  if (error) throw error;
  return data || [];
}

export async function saveWeeklyUpdates(projectCode, weekStart, rows) {
  if (!supabase) throw new Error("Supabase non configurato.");

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
