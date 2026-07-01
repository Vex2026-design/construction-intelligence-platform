import { supabase } from "./supabase";
import { mockProjects, mockWbs, mockTrend, mockIssues } from "../data/mockData";

const demoUpdatesKey = "helios_demo_updates";

function demoUpdates() {
  try { return JSON.parse(localStorage.getItem(demoUpdatesKey) || "[]"); } catch { return []; }
}
function setDemoUpdates(rows) { localStorage.setItem(demoUpdatesKey, JSON.stringify(rows)); }

export async function getProjects() {
  if (!supabase) return mockProjects;
  const { data, error } = await supabase.from("projects").select("*").order("code");
  if (error || !data?.length) return mockProjects;
  return data.map(p => ({
    code:p.code, name:p.name, technology:p.technology, mwDc:Number(p.mw_dc||0), mwAc:Number(p.mw_ac||0),
    planned:Number(p.planned||0), forecast:Number(p.forecast||0), actual:Number(p.actual||0),
    health:Number(p.health||0), status:p.status||"NO DATA", cod:p.cod_target
  }));
}

export async function getWbs(projectCode) {
  if (!supabase) return mockWbs.map(r=>({...r, project_code:projectCode}));
  const { data, error } = await supabase.from("wbs_activities").select("*").eq("project_code", projectCode).eq("active", true).order("level1").order("level2").order("activity");
  if (error || !data?.length) return mockWbs.map(r=>({...r, project_code:projectCode}));
  return data;
}

export async function saveWbsActivity(activity) {
  if (!supabase) return activity;
  if (activity.id && !String(activity.id).startsWith("demo-")) {
    const { data, error } = await supabase.from("wbs_activities").update(activity).eq("id", activity.id).select("*").single();
    if (error) throw error; return data;
  }
  const payload = {...activity}; delete payload.id;
  const { data, error } = await supabase.from("wbs_activities").insert(payload).select("*").single();
  if (error) throw error; return data;
}

export async function submitWeekly(projectCode, weekStart, rows) {
  if (!supabase) {
    const payload = rows.map(r => {
      const total = Number(r.quantity_total||0), prev = Number(r.qty_previous||0), week = Number(r.qty_week||0);
      const cum = Math.min(total, prev+week);
      return { id: crypto.randomUUID(), project_code:projectCode, week_start:weekStart, wbs_activity_id:r.id, qty_previous:prev, qty_week:week, qty_cumulative:cum, progress_pct: total?cum/total:0, notes:r.notes||"", status:"Submitted", activity:r.activity, level1:r.level1, level2:r.level2, unit:r.unit, quantity_total:total, created_at:new Date().toISOString() };
    });
    setDemoUpdates([...demoUpdates().filter(u=>!(u.project_code===projectCode && u.week_start===weekStart)), ...payload]);
    return payload;
  }
  const payload = rows.map(r => {
    const total = Number(r.quantity_total||0), prev = Number(r.qty_previous||0), week = Number(r.qty_week||0);
    const cum = Math.min(total, prev+week);
    return { project_code:projectCode, week_start:weekStart, wbs_activity_id:r.id, qty_previous:prev, qty_week:week, qty_cumulative:cum, progress_pct: total?cum/total:0, notes:r.notes||"", status:"Submitted", submitted_by:"EPC", submitted_at:new Date().toISOString() };
  });
  const { error } = await supabase.from("weekly_quantity_updates").upsert(payload, { onConflict:"project_code,wbs_activity_id,week_start" });
  if (error) throw error;
}

export async function getSubmitted(projectCode=null) {
  if (!supabase) return demoUpdates().filter(u => ["Submitted","Rejected"].includes(u.status) && (!projectCode || u.project_code===projectCode));
  let q = supabase.from("weekly_quantity_updates").select("*, wbs_activities:wbs_activity_id(*)").in("status",["Submitted","Rejected"]).order("week_start",{ascending:false});
  if (projectCode) q=q.eq("project_code",projectCode);
  const {data,error}=await q; if(error) throw error; return data||[];
}

export async function reviewUpdates(ids, action, reason="") {
  if (!supabase) {
    setDemoUpdates(demoUpdates().map(u => ids.includes(u.id) ? {...u, status: action==="approve"?"Approved":"Rejected", rejection_reason: reason, reviewed_at:new Date().toISOString()} : u));
    return;
  }
  const {error}=await supabase.from("weekly_quantity_updates").update({status:action==="approve"?"Approved":"Rejected", rejection_reason: action==="reject"?reason:null, reviewed_by:"IPP PM", reviewed_at:new Date().toISOString()}).in("id",ids);
  if(error) throw error;
}

export async function getApprovedStats(projects) {
  if (!supabase) {
    const approved = demoUpdates().filter(u=>u.status==="Approved");
    if (!approved.length) return projects.map(p => ({...p, approvedActual:null, hasApprovedData:false, deltaPlanned:null, deltaForecast:null}));
    return projects.map(p => {
      const rows = approved.filter(u=>u.project_code===p.code);
      if (!rows.length) return {...p, approvedActual:null, hasApprovedData:false, deltaPlanned:null, deltaForecast:null};
      const actual = rows.reduce((a,u)=>a+Number(u.progress_pct||0),0)/Math.max(1,rows.length);
      return {...p, approvedActual: Math.min(1,actual), hasApprovedData:true, deltaPlanned: Math.min(1,actual)-p.planned, deltaForecast:Math.min(1,actual)-p.forecast};
    });
  }
  const {data,error}=await supabase.from("weekly_quantity_updates").select("*, wbs_activities:wbs_activity_id(*)").eq("status","Approved");
  if(error || !data?.length) return projects.map(p=>({...p, approvedActual:null, hasApprovedData:false, deltaPlanned:null, deltaForecast:null}));
  const latest = {};
  data.forEach(r=>{latest[r.wbs_activity_id]=r});
  const byProject = {};
  Object.values(latest).forEach(r=>{
    const a=r.wbs_activities; if(!a) return;
    const code=r.project_code;
    byProject[code]=byProject[code]||0;
    const total=Number(a.quantity_total||0);
    const progress=total?Number(r.qty_cumulative||0)/total:0;
    byProject[code]+=progress*(Number(a.level1_weight||0)/100)*((a.level2_weight==null?100:Number(a.level2_weight))/100)*(Number(a.activity_weight||0)/100);
  });
  return projects.map(p=>{ 
    if (byProject[p.code] === undefined) return {...p, approvedActual:null, hasApprovedData:false, deltaPlanned:null, deltaForecast:null};
    const act=byProject[p.code]; 
    return {...p, approvedActual:act, hasApprovedData:true, deltaPlanned:act-p.planned, deltaForecast:act-p.forecast};
  });
}

export async function getTrend() { return mockTrend; }
export async function getIssues() { return mockIssues; }

export async function getUsers() {
  if(!supabase) return [{id:"1",full_name:"Ugo Ricciardi",email:"ugo@ipp.it",role:"admin",company:"IPP",active:true},{id:"2",full_name:"EPC Demo",email:"epc@demo.it",role:"epc_pm",company:"EPC",active:true}];
  const {data,error}=await supabase.from("user_profiles").select("*").order("created_at",{ascending:false});
  if(error) throw error; return data||[];
}


export async function getAllWeeklyUpdates(projectCode=null) {
  if (!supabase) return demoUpdates().filter(u => !projectCode || u.project_code===projectCode);
  let q = supabase.from("weekly_quantity_updates").select("*, wbs_activities:wbs_activity_id(*)").order("week_start",{ascending:false}).order("created_at",{ascending:false});
  if (projectCode) q = q.eq("project_code", projectCode);
  const {data,error}=await q; if(error) throw error; return data||[];
}

export async function adminOverrideWeekly(updateId, patch, reason, adminEmail="admin") {
  if (!reason) throw new Error("Motivazione obbligatoria per override admin.");
  if (!supabase) {
    const before = demoUpdates();
    const after = before.map(u => u.id===updateId ? {...u, ...patch, admin_override_reason: reason, admin_override_at:new Date().toISOString()} : u);
    setDemoUpdates(after);
    return;
  }

  const { data: oldRows } = await supabase.from("weekly_quantity_updates").select("*").eq("id", updateId).limit(1);
  const oldValue = oldRows?.[0] || null;

  const { error } = await supabase
    .from("weekly_quantity_updates")
    .update({ ...patch, admin_override_reason: reason, admin_override_at: new Date().toISOString() })
    .eq("id", updateId);

  if (error) throw error;

  await supabase.from("audit_log").insert({
    email: adminEmail,
    action: "ADMIN_OVERRIDE_WEEKLY",
    entity: "weekly_quantity_updates",
    entity_id: String(updateId),
    old_value: oldValue,
    new_value: { ...patch, reason }
  });
}
