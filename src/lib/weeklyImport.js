import * as XLSX from "xlsx";
import { supabase } from "./supabase";

function n(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace("%", "").replace(",", ".").trim();
  const num = Number(s);
  if (Number.isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

function excelDateToIso(v) {
  if (!v) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);

  if (typeof v === "number") {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (!parsed) return null;
    const yyyy = parsed.y;
    const mm = String(parsed.m).padStart(2, "0");
    const dd = String(parsed.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const text = String(v).trim();
  const parts = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (parts) {
    const dd = parts[1].padStart(2, "0");
    const mm = parts[2].padStart(2, "0");
    const yyyy = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function inferProjectCode(fileName) {
  const m = fileName.match(/V\d{4}/i);
  if (m) return m[0].toUpperCase();

  const low = fileName.toLowerCase();
  if (low.includes("loffreda")) return "V0012";
  if (low.includes("atzori")) return "V0015";
  if (low.includes("friargiu")) return "V0021";
  if (low.includes("bertolin")) return "V0057";
  if (low.includes("sortino2")) return "V0168";
  if (low.includes("sortino")) return "V0020";
  if (low.includes("acqua")) return "V0045";
  if (low.includes("satriano")) return "V0046";
  if (low.includes("antohi")) return "V0093";
  return "";
}

function chooseReportSheet(workbook) {
  const preferred = ["Foglio1", "Recap per data", "Report per data"];
  for (const s of preferred) {
    if (workbook.SheetNames.includes(s)) return s;
  }
  return workbook.SheetNames.find(s => /report|recap/i.test(s)) || workbook.SheetNames[0];
}

function getRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
}

function computeStatus(overall) {
  if (overall.deltaForecast >= -0.03 && overall.deltaPlan >= -0.08) return "ON TRACK";
  if (overall.deltaForecast >= -0.10) return "ATTENTION";
  return "CRITICAL";
}

function computeHealth(overall) {
  const score = (
    overall.actual * 35 +
    Math.max(0, 1 + Math.min(0, overall.deltaPlan)) * 35 +
    Math.max(0, 1 + Math.min(0, overall.deltaForecast)) * 20 +
    0.10
  ) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export async function parseWeeklyReport(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const projectCode = inferProjectCode(file.name);
  const reportSheetName = chooseReportSheet(workbook);
  const reportRows = getRows(workbook.Sheets[reportSheetName]);

  const controlDate = excelDateToIso(reportRows?.[1]?.[2]) || new Date().toISOString().slice(0, 10);

  const phases = [];
  for (const row of reportRows) {
    const phase = String(row?.[1] || "").trim();
    if (!phase) continue;

    const planned = n(row?.[4]);
    const forecast = n(row?.[7]);
    const actual = n(row?.[10]);

    if (phase.toLowerCase() === "overall" || planned || forecast || actual) {
      phases.push({
        phase,
        planned,
        forecast,
        actual,
        deltaPlan: actual - planned,
        deltaForecast: actual - forecast
      });
    }
  }

  let overall = phases.find(p => p.phase.toLowerCase() === "overall");
  if (!overall) {
    const valid = phases.filter(p => p.phase.toLowerCase() !== "overall");
    const avg = (key) => valid.reduce((a, p) => a + p[key], 0) / Math.max(1, valid.length);
    overall = {
      phase: "Overall",
      planned: avg("planned"),
      forecast: avg("forecast"),
      actual: avg("actual")
    };
    overall.deltaPlan = overall.actual - overall.planned;
    overall.deltaForecast = overall.actual - overall.forecast;
  }

  const curve = [];
  if (workbook.SheetNames.includes("Curve S")) {
    const curveRows = getRows(workbook.Sheets["Curve S"]);
    const dateRow = curveRows[6] || [];
    const plannedRow = curveRows[8] || [];
    const forecastRow = curveRows[10] || [];
    const actualRow = curveRows[12] || [];

    for (let c = 3; c < dateRow.length; c++) {
      const pointDate = excelDateToIso(dateRow[c]);
      if (!pointDate) continue;
      curve.push({
        pointDate,
        planned: n(plannedRow[c]),
        forecast: n(forecastRow[c]),
        actual: n(actualRow[c])
      });
    }
  }

  // trim empty curve tail
  let last = 0;
  curve.forEach((p, i) => {
    if (p.planned || p.forecast || p.actual) last = i;
  });

  const trimmedCurve = curve.length ? curve.slice(0, last + 1) : [];

  return {
    fileName: file.name,
    projectCode,
    reportSheetName,
    controlDate,
    overall,
    phases: phases.filter(p => p.phase.toLowerCase() !== "overall"),
    curve: trimmedCurve,
    status: computeStatus(overall),
    health: computeHealth(overall)
  };
}

export async function saveWeeklyReport(parsed) {
  if (!supabase) throw new Error("Supabase non configurato.");

  if (!parsed.projectCode) {
    throw new Error("Non riesco a riconoscere il codice progetto dal nome file. Usa un nome con V0015, V0021, ecc. oppure Atzori/Friargiu/Bertolin/Loffreda.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, code, name")
    .eq("code", parsed.projectCode)
    .single();

  if (projectError || !project) {
    throw new Error(`Progetto ${parsed.projectCode} non trovato in Supabase.`);
  }

  const { data: sal, error: salError } = await supabase
    .from("sal_imports")
    .insert({
      project_id: project.id,
      file_name: parsed.fileName,
      storage_path: null,
      sheet_name: parsed.reportSheetName,
      control_date: parsed.controlDate,
      planned: parsed.overall.planned,
      forecast: parsed.overall.forecast,
      actual: parsed.overall.actual,
      delta_plan: parsed.overall.deltaPlan,
      delta_forecast: parsed.overall.deltaForecast,
      status: parsed.status,
      health: parsed.health
    })
    .select("id")
    .single();

  if (salError) throw salError;

  if (parsed.phases.length) {
    const rows = parsed.phases.map(p => ({
      sal_import_id: sal.id,
      project_id: project.id,
      phase: p.phase,
      planned: p.planned,
      forecast: p.forecast,
      actual: p.actual,
      delta_plan: p.deltaPlan,
      delta_forecast: p.deltaForecast
    }));

    const { error } = await supabase.from("phase_progress").insert(rows);
    if (error) throw error;
  }

  if (parsed.curve.length) {
    const rows = parsed.curve.map(p => ({
      sal_import_id: sal.id,
      project_id: project.id,
      point_date: p.pointDate,
      planned: p.planned,
      forecast: p.forecast,
      actual: p.actual
    }));

    const { error } = await supabase.from("s_curve_points").insert(rows);
    if (error) throw error;
  }

  return { salImportId: sal.id, project };
}
