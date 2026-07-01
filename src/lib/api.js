import { supabase } from "./supabase";
import { PROJECTS, WBS_TEMPLATE, ISSUES, TREND_EMPTY } from "../data/mockData";
import { readDemoState, writeDemoState } from "./demoStore";

function mapProject(row) {
  return {
    code: row.code,
    name: row.name,
    technology: row.technology,
    mwDc: Number(row.mw_dc || row.mwDc || 0),
    mwAc: Number(row.mw_ac || row.mwAc || 0),
    planned: Number(row.planned || 0),
    forecast: Number(row.forecast || 0),
    cod: row.cod_target || row.cod,
    status: row.status || "NO APPROVED DATA"
  };
}

export async function getProjects() {
  if (!supabase) return PROJECTS;
  const { data, error } = await supabase.from("projects").select("*").order("code");
  if (error || !data?.length) return PROJECTS;
  return data.map(mapProject);
}

function templateWbs(projectCode) {
  return WBS_TEMPLATE.map((row, index) => ({
    id: `demo-${projectCode}-${index}`,
    projectCode,
    level1: row[0],
    level1Weight: row[1],
    level2: row[2],
    level2Weight: row[3],
    activity: row[4],
    activityWeight: row[5],
    unit: row[6],
    quantityTotal: row[7],
    plannedStart: row[8],
    plannedFinish: row[9],
    active: true
  }));
}

export async function getWbs(projectCode) {
  if (!supabase) {
    const state = readDemoState();
    return state.wbsByProject[projectCode] || templateWbs(projectCode);
  }

  const { data, error } = await supabase
    .from("wbs_activities")
    .select("*")
    .eq("project_code", projectCode)
    .eq("active", true)
    .order("level1")
    .order("level2")
    .order("activity");

  if (error || !data?.length) return templateWbs(projectCode);

  return data.map((row) => ({
    id: row.id,
    projectCode: row.project_code,
    level1: row.level1,
    level1Weight: row.level1_weight,
    level2: row.level2,
    level2Weight: row.level2_weight,
    activity: row.activity,
    activityWeight: row.activity_weight,
    unit: row.unit,
    quantityTotal: row.quantity_total,
    plannedStart: row.planned_start,
    plannedFinish: row.planned_finish,
    active: row.active
  }));
}

export async function saveWbsActivity(activity) {
  if (!supabase) {
    const state = readDemoState();
    const rows = state.wbsByProject[activity.projectCode] || templateWbs(activity.projectCode);

    if (activity.id && rows.some((r) => r.id === activity.id)) {
      state.wbsByProject[activity.projectCode] = rows.map((r) =>
        r.id === activity.id ? activity : r
      );
    } else {
      state.wbsByProject[activity.projectCode] = [
        ...rows,
        { ...activity, id: crypto.randomUUID(), active: true }
      ];
    }

    writeDemoState(state);
    return activity;
  }

  const payload = {
    project_code: activity.projectCode,
    level1: activity.level1,
    level1_weight: Number(activity.level1Weight || 0),
    level2: activity.level2 || null,
    level2_weight: activity.level2 ? Number(activity.level2Weight || 0) : null,
    activity: activity.activity,
    activity_weight: Number(activity.activityWeight || 0),
    unit: activity.unit,
    quantity_total: Number(activity.quantityTotal || 0),
    planned_start: activity.plannedStart || null,
    planned_finish: activity.plannedFinish || null,
    active: true
  };

  if (activity.id && !String(activity.id).startsWith("demo-")) {
    const { data, error } = await supabase
      .from("wbs_activities")
      .update(payload)
      .eq("id", activity.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("wbs_activities")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function submitWeekly(projectCode, weekStart, rows) {
  if (!supabase) {
    const state = readDemoState();
    const payload = rows.map((row) => {
      const quantityTotal = Number(row.quantityTotal || 0);
      const quantityPrevious = Number(row.quantityPrevious || 0);
      const quantityWeek = Number(row.quantityWeek || 0);
      const quantityCumulative = Math.min(quantityTotal, quantityPrevious + quantityWeek);

      return {
        id: crypto.randomUUID(),
        projectCode,
        weekStart,
        activityId: row.id,
        activity: row.activity,
        level1: row.level1,
        level1Weight: row.level1Weight,
        level2: row.level2,
        level2Weight: row.level2Weight,
        activityWeight: row.activityWeight,
        unit: row.unit,
        quantityTotal,
        quantityPrevious,
        quantityWeek,
        quantityCumulative,
        progressPct: quantityTotal > 0 ? quantityCumulative / quantityTotal : 0,
        notes: row.notes || "",
        status: "Submitted",
        submittedAt: new Date().toISOString()
      };
    });

    state.weeklyUpdates = [
      ...state.weeklyUpdates.filter(
        (u) => !(u.projectCode === projectCode && u.weekStart === weekStart)
      ),
      ...payload
    ];
    writeDemoState(state);
    return payload;
  }

  const payload = rows.map((row) => {
    const quantityTotal = Number(row.quantityTotal || 0);
    const quantityPrevious = Number(row.quantityPrevious || 0);
    const quantityWeek = Number(row.quantityWeek || 0);
    const quantityCumulative = Math.min(quantityTotal, quantityPrevious + quantityWeek);

    return {
      project_code: projectCode,
      week_start: weekStart,
      wbs_activity_id: row.id,
      qty_previous: quantityPrevious,
      qty_week: quantityWeek,
      qty_cumulative: quantityCumulative,
      progress_pct: quantityTotal > 0 ? quantityCumulative / quantityTotal : 0,
      notes: row.notes || "",
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

export async function getWeeklyUpdates(projectCode, statuses = null) {
  if (!supabase) {
    const state = readDemoState();
    return state.weeklyUpdates.filter(
      (u) =>
        (!projectCode || u.projectCode === projectCode) &&
        (!statuses || statuses.includes(u.status))
    );
  }

  let query = supabase
    .from("weekly_quantity_updates")
    .select("*, wbs_activities:wbs_activity_id(*)")
    .order("week_start", { ascending: false })
    .order("created_at", { ascending: false });

  if (projectCode) query = query.eq("project_code", projectCode);
  if (statuses) query = query.in("status", statuses);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    projectCode: row.project_code,
    weekStart: row.week_start,
    activityId: row.wbs_activity_id,
    activity: row.wbs_activities?.activity,
    level1: row.wbs_activities?.level1,
    level1Weight: row.wbs_activities?.level1_weight,
    level2: row.wbs_activities?.level2,
    level2Weight: row.wbs_activities?.level2_weight,
    activityWeight: row.wbs_activities?.activity_weight,
    unit: row.wbs_activities?.unit,
    quantityTotal: row.wbs_activities?.quantity_total,
    quantityPrevious: row.qty_previous,
    quantityWeek: row.qty_week,
    quantityCumulative: row.qty_cumulative,
    progressPct: row.progress_pct,
    notes: row.notes,
    status: row.status
  }));
}

export async function reviewWeekly(updateIds, action, reason = "") {
  const nextStatus = action === "approve" ? "Approved" : "Rejected";

  if (!supabase) {
    const state = readDemoState();
    state.weeklyUpdates = state.weeklyUpdates.map((update) =>
      updateIds.includes(update.id)
        ? { ...update, status: nextStatus, rejectionReason: reason, reviewedAt: new Date().toISOString() }
        : update
    );
    writeDemoState(state);
    return;
  }

  const { error } = await supabase
    .from("weekly_quantity_updates")
    .update({
      status: nextStatus,
      rejection_reason: action === "reject" ? reason : null,
      reviewed_by: "IPP PM",
      reviewed_at: new Date().toISOString()
    })
    .in("id", updateIds);

  if (error) throw error;
}

export async function adminOverride(updateId, patch, reason) {
  if (!reason) throw new Error("Motivazione obbligatoria per override admin.");

  if (!supabase) {
    const state = readDemoState();
    const oldValue = state.weeklyUpdates.find((u) => u.id === updateId);
    state.weeklyUpdates = state.weeklyUpdates.map((u) =>
      u.id === updateId ? { ...u, ...patch, adminOverrideReason: reason } : u
    );
    state.auditLog.push({
      id: crypto.randomUUID(),
      action: "ADMIN_OVERRIDE",
      entity: "weekly_update",
      entityId: updateId,
      oldValue,
      newValue: patch,
      reason,
      createdAt: new Date().toISOString()
    });
    writeDemoState(state);
    return;
  }

  const { data: oldRows } = await supabase
    .from("weekly_quantity_updates")
    .select("*")
    .eq("id", updateId)
    .limit(1);

  const oldValue = oldRows?.[0] || null;

  const { error } = await supabase
    .from("weekly_quantity_updates")
    .update({
      qty_previous: patch.quantityPrevious,
      qty_week: patch.quantityWeek,
      qty_cumulative: patch.quantityCumulative,
      progress_pct: patch.progressPct,
      notes: patch.notes,
      status: patch.status,
      admin_override_reason: reason,
      admin_override_at: new Date().toISOString(),
      admin_override_by: "Admin"
    })
    .eq("id", updateId);

  if (error) throw error;

  await supabase.from("audit_log").insert({
    email: "admin",
    action: "ADMIN_OVERRIDE",
    entity: "weekly_quantity_updates",
    entity_id: String(updateId),
    old_value: oldValue,
    new_value: { ...patch, reason }
  });
}

export async function getIssues() {
  if (!supabase) return ISSUES;
  const { data, error } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return ISSUES;
  return data.map((row) => ({
    id: row.id,
    projectCode: row.project_code,
    title: row.title,
    impact: row.impact,
    owner: row.owner,
    status: row.status
  }));
}

export async function getUsers() {
  if (!supabase) return readDemoState().users;
  const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTrend() {
  return TREND_EMPTY;
}
