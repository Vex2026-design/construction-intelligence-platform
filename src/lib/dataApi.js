import { supabase } from "./supabase";
import { mockProjects, mockIssues, mockCurve } from "../data/mockData";

function normalizeStatus(status) {
  return status || "NO DATA";
}

export async function getLatestPortfolio() {
  if (!supabase) return { projects: mockProjects, source: "demo" };

  const { data, error } = await supabase
    .from("sal_imports")
    .select(`
      id,
      file_name,
      sheet_name,
      control_date,
      planned,
      forecast,
      actual,
      delta_plan,
      delta_forecast,
      status,
      health,
      imported_at,
      projects:project_id (
        code,
        name,
        technology,
        mw_dc,
        mw_ac
      )
    `)
    .order("imported_at", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("Supabase fallback demo:", error);
    return { projects: mockProjects, source: "demo" };
  }

  const seen = new Set();
  const projects = [];

  for (const row of data) {
    const code = row.projects?.code;
    if (!code || seen.has(code)) continue;
    seen.add(code);

    projects.push({
      code,
      name: row.projects?.name || code,
      technology: row.projects?.technology || "PV",
      mwDc: Number(row.projects?.mw_dc || 0),
      mwAc: Number(row.projects?.mw_ac || 0),
      planned: Number(row.planned || 0),
      forecast: Number(row.forecast || 0),
      actual: Number(row.actual || 0),
      deltaPlanned: Number(row.delta_plan || 0),
      deltaForecast: Number(row.delta_forecast || 0),
      health: Number(row.health || 0),
      status: normalizeStatus(row.status),
      lastSal: row.control_date || "",
      salImportId: row.id
    });
  }

  return { projects: projects.length ? projects : mockProjects, source: projects.length ? "supabase" : "demo" };
}

export async function getIssues() {
  if (!supabase) return mockIssues;

  const { data, error } = await supabase
    .from("issues")
    .select(`
      id,
      title,
      owner,
      impact_cod,
      status,
      mitigation,
      projects:project_id (
        code,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("Issues fallback demo:", error);
    return mockIssues;
  }

  return data.map((row) => ({
    id: row.id,
    project: row.projects?.name || "Project",
    title: row.title || "",
    owner: row.owner || "IPP/EPC",
    impact: row.impact_cod || "Medium",
    status: row.status || "Open",
    action: row.mitigation || ""
  }));
}

export async function getPortfolioCurve() {
  return mockCurve;
}
