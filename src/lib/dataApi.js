import { supabase } from "./supabase";
import { projects as mockProjects, issues as mockIssues, portfolioCurve as mockPortfolioCurve } from "../data/mockData";

export async function fetchProjects() {
  if (!supabase) return mockProjects;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("code", { ascending: true });

  if (error || !data || data.length === 0) {
    console.warn("Using mock projects:", error);
    return mockProjects;
  }

  return data.map((p) => ({
    code: p.code,
    name: p.name,
    technology: p.technology,
    mwDc: Number(p.mw_dc || 0),
    mwAc: Number(p.mw_ac || 0),
    planned: 0,
    forecast: 0,
    actual: 0,
    deltaPlanned: 0,
    deltaForecast: 0,
    health: 0,
    status: "NO DATA",
    lastSal: ""
  }));
}

export async function fetchLatestPortfolio() {
  if (!supabase) return mockProjects;

  const { data: imports, error } = await supabase
    .from("sal_imports")
    .select(`
      *,
      projects:project_id (
        code,
        name,
        technology,
        mw_dc,
        mw_ac
      )
    `)
    .order("imported_at", { ascending: false });

  if (error || !imports || imports.length === 0) {
    console.warn("Using mock latest portfolio:", error);
    return mockProjects;
  }

  const seen = new Set();
  const latest = [];
  imports.forEach((row) => {
    const code = row.projects?.code;
    if (!code || seen.has(code)) return;
    seen.add(code);
    latest.push({
      code,
      name: row.projects?.name || code,
      technology: row.projects?.technology || "",
      mwDc: Number(row.projects?.mw_dc || 0),
      mwAc: Number(row.projects?.mw_ac || 0),
      planned: Number(row.planned || 0),
      forecast: Number(row.forecast || 0),
      actual: Number(row.actual || 0),
      deltaPlanned: Number(row.delta_plan || 0),
      deltaForecast: Number(row.delta_forecast || 0),
      health: Number(row.health || 0),
      status: row.status || "NO DATA",
      lastSal: row.control_date || "",
      salImportId: row.id
    });
  });

  return latest.length ? latest : mockProjects;
}

export async function fetchIssues() {
  if (!supabase) return mockIssues;

  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      projects:project_id (
        code,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("Using mock issues:", error);
    return mockIssues;
  }

  return data.map((i) => ({
    id: i.id,
    project: i.projects?.name || i.project_id,
    title: i.title,
    owner: i.owner || "",
    impact: i.impact_cod || "Medium",
    status: i.status || "Open",
    action: i.mitigation || ""
  }));
}

export async function fetchPortfolioCurve() {
  return mockPortfolioCurve;
}
