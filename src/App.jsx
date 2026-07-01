import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Building2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Factory,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  UploadCloud,
  Zap
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
  RadialBarChart,
  RadialBar
} from "recharts";
import { getIssues, getLatestPortfolio, getPortfolioCurve } from "./lib/dataApi";
import { getSession, signIn, signOut, roleToPortal, canAccessIpp, canAccessEpc } from "./lib/authApi";
import { getUsers, getProjectAccess, inviteUserByEmail, deactivateUser } from "./lib/adminApi";
import { getWbsActivities, saveWeeklyUpdates, calculateProgressFromWbs, createWbsActivity, updateWbsActivity, deactivateWbsActivity, getSubmittedWeeklyUpdates, reviewWeeklyUpdates, getApprovedProgressByProject, getApprovedProjectStats, getApprovedWeeklyTrend } from "./lib/wbsApi";

const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`;
const signedPct = (v) => `${v >= 0 ? "+" : ""}${((v || 0) * 100).toFixed(1)}%`;
const statusClass = (s) => (s || "NO DATA").toLowerCase().replaceAll(" ", "-");

function useData() {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [curve, setCurve] = useState([]);
  const [source, setSource] = useState("loading");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [portfolio, issueRows, curveRows] = await Promise.all([
      getLatestPortfolio(),
      getIssues(),
      getPortfolioCurve()
    ]);
    setProjects(portfolio.projects);
    setSource(portfolio.source);
    setIssues(issueRows);
    setCurve(curveRows);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  return { projects, issues, curve, source, loading, reload: load };
}

function StatusBadge({ status }) {
  return <span className={`status status-${statusClass(status)}`}>{status}</span>;
}

function KpiCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className={`kpi-card ${tone || ""}`}>
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        {Icon && <Icon size={18} />}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}

function MiniBar({ label, value, type }) {
  return (
    <div className="mini-bar-row">
      <span>{label}</span>
      <div className="mini-track">
        <div className={`mini-fill ${type}`} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
      </div>
      <strong>{pct(value)}</strong>
    </div>
  );
}

function PortfolioHome({ projects, issues, source, onReload, onOpenProject }) {
  const stats = useMemo(() => {
    const totalMw = projects.reduce((a, p) => a + (p.mwDc || 0), 0);
    const avgActual = projects.reduce((a, p) => a + (p.actual || 0), 0) / Math.max(1, projects.length);
    const avgDelta = projects.reduce((a, p) => a + (p.deltaPlanned || 0), 0) / Math.max(1, projects.length);
    const avgHealth = projects.reduce((a, p) => a + (p.health || 0), 0) / Math.max(1, projects.length);
    const atRisk = projects.filter((p) => p.status !== "ON TRACK").length;
    return { totalMw, avgActual, avgDelta, avgHealth, atRisk };
  }, [projects]);

  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">Portfolio Command Center</span>
          <h1>Construction Intelligence Platform V2</h1>
          <p>Gestione project-first: ogni impianto ha WBS, weekly input EPC, progress, rischi e COD.</p>
          <div className="source-pill">
            <CheckCircle2 size={14} />
            Data source: {source === "supabase" ? "Supabase live" : "Demo fallback"}
          </div>
        </div>
        <button className="primary-btn" onClick={onReload}>
          <RefreshCw size={18} />
          Aggiorna dati
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={Factory} label="MW monitorati" value={stats.totalMw.toFixed(1)} note="portfolio construction" />
        <KpiCard icon={LayoutDashboard} label="Progetti" value={projects.length} note="con WBS / SAL" />
        <KpiCard icon={Activity} label="Actual medio" value={pct(stats.avgActual)} note="progress portfolio" />
        <KpiCard icon={ArrowDownRight} label="Δ Planned" value={signedPct(stats.avgDelta)} note="scostamento medio" tone={stats.avgDelta < 0 ? "danger" : "success"} />
        <KpiCard icon={AlertTriangle} label="A rischio" value={stats.atRisk} note="attention / critical" tone={stats.atRisk > 0 ? "warning" : "success"} />
        <KpiCard icon={Gauge} label="Health Index" value={`${stats.avgHealth.toFixed(0)}/100`} note="score medio" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Projects</h2>
            <p>Apri il progetto per vedere WBS, progress, weekly input EPC e COD.</p>
          </div>
        </div>
        <div className="project-grid large">
          {projects.map((p) => (
            <ProjectCard key={p.code} project={p} onOpen={() => onOpenProject(p)} />
          ))}
        </div>
      </section>

      <div className="grid two">
        <section className="panel">
          <h2>Portfolio Progress</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={projects} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
              <YAxis dataKey="name" type="category" stroke="#91a8c7" width={105} />
              <Tooltip formatter={(v) => pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill="#55d7ff" radius={[0, 8, 8, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#ffb020" radius={[0, 8, 8, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#2ecc71" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Management Attention</h2>
          <div className="issues-list">
            {issues.length ? issues.map((issue) => (
              <div className="issue" key={issue.id}>
                <div>
                  <strong>{issue.project}</strong>
                  <p>{issue.title}</p>
                  <span>{issue.owner} · {issue.status}</span>
                </div>
                <b className={`impact ${issue.impact?.toLowerCase() || "medium"}`}>{issue.impact}</b>
              </div>
            )) : <div className="empty-state">Nessuna issue aperta.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  return (
    <button className="project-card" onClick={onOpen}>
      <div className="project-card-head">
        <div>
          <h3>{project.name}</h3>
          <p>{project.code} · {project.technology || "PV"} · {project.mwDc.toFixed(1)} MW</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="project-progress">
        <MiniBar label="Planned" value={project.planned} type="planned" />
        <MiniBar label="Forecast" value={project.forecast} type="forecast" />
        <MiniBar label="Actual" value={project.actual} type="actual" />
      </div>
      <div className="project-footer">
        <div><span>Δ Planned</span><b className={project.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(project.deltaPlanned)}</b></div>
        <div><span>Δ Forecast</span><b className={project.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(project.deltaForecast)}</b></div>
        <div><span>Health</span><b>{project.health}/100</b></div>
      </div>
    </button>
  );
}

function ProjectPage({ project, setPage }) {
  const codValue = project ? Math.max(15, Math.min(92, project.actual * 100 + 25)) : 0;
  const codData = [{ name: "COD", value: codValue, fill: "#2ecc71" }];

  if (!project) return <div className="page"><div className="panel empty-state">Seleziona un progetto.</div></div>;

  return (
    <div className="page">
      <div className="project-hero">
        <div>
          <span className="eyebrow">{project.code} · {project.technology}</span>
          <h1>{project.name}</h1>
          <p>{project.mwDc.toFixed(1)} MW DC · ultimo SAL {project.lastSal || "-"}</p>
        </div>
        <div className="project-actions">
          <StatusBadge status={project.status} />
          <button className="primary-btn" onClick={() => setPage("epc")}>EPC Weekly Input</button>
        </div>
      </div>

      <div className="kpi-grid five">
        <KpiCard icon={Activity} label="Actual" value={pct(project.actual)} note="SAL / WBS" />
        <KpiCard icon={CalendarDays} label="Planned" value={pct(project.planned)} note="baseline" />
        <KpiCard icon={Zap} label="Forecast" value={pct(project.forecast)} note="forecast EPC" />
        <KpiCard icon={ArrowDownRight} label="Δ Planned" value={signedPct(project.deltaPlanned)} note="scostamento" tone={project.deltaPlanned < 0 ? "danger" : "success"} />
        <KpiCard icon={Gauge} label="Health" value={`${project.health}/100`} note="score" />
      </div>

      <div className="project-tabs">
        <button onClick={() => setPage("wbs")}>WBS Tree</button>
        <button onClick={() => setPage("epc")}>Weekly Input</button>
        <button onClick={() => setPage("curves")}>Curve S</button>
        <button onClick={() => setPage("cod")}>COD</button>
        <button onClick={() => setPage("issues")}>Issues</button>
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Construction Progress</h2>
          <div className="project-progress wide">
            <MiniBar label="Planned" value={project.planned} type="planned" />
            <MiniBar label="Forecast" value={project.forecast} type="forecast" />
            <MiniBar label="Actual" value={project.actual} type="actual" />
          </div>
          <div className="discipline-list">
            {[
              ["Engineering", Math.min(1, project.actual + .35)],
              ["Procurement", Math.min(1, project.actual + .25)],
              ["Civil", Math.min(1, project.actual + .15)],
              ["Mechanical", Math.max(0, project.actual - .02)],
              ["Electrical", Math.max(0, project.actual - .12)],
              ["Commissioning", Math.max(0, project.actual - .28)]
            ].map(([label, value]) => <MiniBar key={label} label={label} value={value} type="actual" />)}
          </div>
        </section>

        <section className="panel">
          <h2>COD Readiness</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={codData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="cod-number">{codValue.toFixed(0)}%</div>
          <p className="small">Readiness stimata da progress + input IPP.</p>
        </section>
      </div>

      <section className="panel">
        <h2>AI Construction Analyst</h2>
        <ul className="insight-list">
          <li>{project.name} è a {pct(project.actual)} di avanzamento actual.</li>
          <li>Delta vs planned: <b className={project.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(project.deltaPlanned)}</b>.</li>
          <li>Delta vs forecast: <b className={project.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(project.deltaForecast)}</b>.</li>
          <li>{project.deltaForecast > -0.03 ? "Il forecast è sostanzialmente coerente con l'actual." : "Il forecast richiede verifica con EPC."}</li>
        </ul>
      </section>
    </div>
  );
}


function buildTree(rows) {
  const tree = {};
  rows.forEach((r) => {
    const l1 = r.level1 || "Altro";
    const l2 = r.level2 || "_direct";
    tree[l1] = tree[l1] || { weight: r.level1_weight, children: {} };
    tree[l1].children[l2] = tree[l1].children[l2] || { weight: r.level2_weight, activities: [] };
    tree[l1].children[l2].activities.push(r);
  });
  return tree;
}

function WbsTreeView({ rows, onSelect }) {
  const [open, setOpen] = useState({});
  const tree = buildTree(rows);

  function toggle(key) {
    setOpen((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="wbs-tree">
      {Object.entries(tree).map(([l1, node]) => {
        const l1Key = `l1-${l1}`;
        const isOpen = open[l1Key] ?? true;
        return (
          <div className="tree-block" key={l1}>
            <button className="tree-l1" onClick={() => toggle(l1Key)}>
              {isOpen ? <ChevronDown size={17}/> : <ChevronRight size={17}/>}
              <span>{l1}</span>
              <b>{node.weight}%</b>
            </button>

            {isOpen && Object.entries(node.children).map(([l2, child]) => {
              const l2Label = l2 === "_direct" ? "Attività dirette" : l2;
              const l2Key = `${l1}-${l2}`;
              const isL2Open = open[l2Key] ?? true;
              return (
                <div className="tree-l2-wrap" key={l2}>
                  <button className="tree-l2" onClick={() => toggle(l2Key)}>
                    {isL2Open ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                    <span>{l2Label}</span>
                    {child.weight ? <b>{child.weight}%</b> : null}
                  </button>

                  {isL2Open && child.activities.map((a) => (
                    <button className="tree-activity" key={a.id} onClick={() => onSelect?.(a)}>
                      <span>{a.activity}</span>
                      <small>{a.unit || "-"} · {Number(a.quantity_total || 0).toLocaleString("it-IT")} · peso {a.activity_weight || 0}%</small>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ActivityDetail({ activity }) {
  if (!activity) {
    return (
      <div className="activity-detail empty-state">
        Seleziona un’attività dalla WBS Tree.
      </div>
    );
  }

  return (
    <div className="activity-detail">
      <div className="activity-head">
        <div>
          <span className="eyebrow">WBS Activity</span>
          <h2>{activity.activity}</h2>
          <p>{activity.level1}{activity.level2 ? " / " + activity.level2 : ""}</p>
        </div>
      </div>

      <div className="activity-kpis">
        <div><span>Quantità totale</span><b>{Number(activity.quantity_total || 0).toLocaleString("it-IT")} {activity.unit}</b></div>
        <div><span>Peso attività</span><b>{activity.activity_weight || 0}%</b></div>
        <div><span>Start planned</span><b>{activity.planned_start || "-"}</b></div>
        <div><span>Finish planned</span><b>{activity.planned_finish || "-"}</b></div>
      </div>

      <div className="activity-note">
        Qui nella V3 successiva vedremo storico settimanale, foto, note EPC, actual/forecast e impatto sul COD.
      </div>
    </div>
  );
}


function WbsSetup({ selectedProject }) {
  const [rows, setRows] = useState([]);
  const [projectCode, setProjectCode] = useState(selectedProject?.code || "V0015");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    project_code: projectCode,
    level1: "Construction",
    level1_weight: 75,
    level2: "Opere Civili",
    level2_weight: 10,
    activity: "",
    activity_weight: 0,
    unit: "n°",
    quantity_total: 0,
    planned_start: "",
    planned_finish: ""
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  useEffect(() => {
    setForm((f) => ({ ...f, project_code: projectCode }));
  }, [projectCode]);

  async function load() {
    setError("");
    try {
      const data = await getWbsActivities(projectCode);
      setRows(data);
      setSelectedActivity(data?.[0] || null);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => { load(); }, [projectCode]);

  function startAdd() {
    setForm({ ...emptyForm, project_code: projectCode });
    setShowForm(true);
    setSelectedActivity(null);
  }

  function startEdit(activity) {
    setForm({
      id: activity.id,
      project_code: projectCode,
      level1: activity.level1 || "",
      level1_weight: activity.level1_weight || 0,
      level2: activity.level2 || "",
      level2_weight: activity.level2_weight || 0,
      activity: activity.activity || "",
      activity_weight: activity.activity_weight || 0,
      unit: activity.unit || "",
      quantity_total: activity.quantity_total || 0,
      planned_start: activity.planned_start || "",
      planned_finish: activity.planned_finish || ""
    });
    setShowForm(true);
    setSelectedActivity(activity);
  }

  async function saveActivity() {
    setError("");
    setSuccess("");

    if (!form.activity.trim()) {
      setError("Inserisci il nome attività.");
      return;
    }

    try {
      if (form.id && !String(form.id).startsWith("fb-")) {
        await updateWbsActivity(form);
        setSuccess("Attività aggiornata.");
      } else {
        await createWbsActivity({ ...form, project_code: projectCode });
        setSuccess("Nuova attività aggiunta alla WBS.");
      }

      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  async function deactivateSelected() {
    if (!selectedActivity?.id || String(selectedActivity.id).startsWith("fb-")) {
      setError("Questa attività è fallback/demo e non può essere disattivata.");
      return;
    }

    try {
      await deactivateWbsActivity(selectedActivity.id);
      setSuccess("Attività disattivata.");
      setSelectedActivity(null);
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Project WBS Tree</span>
          <h1>WBS Setup</h1>
          <p>Ogni progetto ha la propria WBS. Da qui puoi aggiungere, modificare o disattivare attività.</p>
        </div>
        <div className="input-row">
          <ProjectSelect value={projectCode} onChange={setProjectCode} />
          <button className="primary-btn" onClick={startAdd}>+ Aggiungi attività</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <section className="panel wbs-editor-form">
          <div className="panel-head">
            <div>
              <h2>{form.id ? "Modifica attività" : "Nuova attività WBS"}</h2>
              <p>Questa attività sarà disponibile nell’EPC Weekly Input del progetto.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>Livello 1<input value={form.level1} onChange={(e) => updateForm("level1", e.target.value)} /></label>
            <label>Peso L1 %<input type="number" value={form.level1_weight} onChange={(e) => updateForm("level1_weight", e.target.value)} /></label>
            <label>Livello 2<input value={form.level2} onChange={(e) => updateForm("level2", e.target.value)} /></label>
            <label>Peso L2 %<input type="number" value={form.level2_weight} onChange={(e) => updateForm("level2_weight", e.target.value)} /></label>
            <label>Attività<input value={form.activity} onChange={(e) => updateForm("activity", e.target.value)} /></label>
            <label>Peso attività %<input type="number" value={form.activity_weight} onChange={(e) => updateForm("activity_weight", e.target.value)} /></label>
            <label>U.M.<input value={form.unit} onChange={(e) => updateForm("unit", e.target.value)} /></label>
            <label>Quantità totale<input type="number" value={form.quantity_total} onChange={(e) => updateForm("quantity_total", e.target.value)} /></label>
            <label>Data inizio planned<input type="date" value={form.planned_start || ""} onChange={(e) => updateForm("planned_start", e.target.value)} /></label>
            <label>Data fine planned<input type="date" value={form.planned_finish || ""} onChange={(e) => updateForm("planned_finish", e.target.value)} /></label>
          </div>

          <div className="form-actions">
            <button className="primary-btn" onClick={saveActivity}>Salva attività</button>
            <button className="secondary-btn" onClick={() => setShowForm(false)}>Annulla</button>
          </div>
        </section>
      )}

      <div className="grid two wbs-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>WBS Tree - {projectCode}</h2>
              <p>{rows.length} attività caricate</p>
            </div>
          </div>
          <WbsTreeView rows={rows} onSelect={(a) => { setSelectedActivity(a); setShowForm(false); }} />
        </section>

        <section className="panel">
          <ActivityDetail activity={selectedActivity} />
          {selectedActivity && (
            <div className="detail-actions">
              <button className="primary-btn" onClick={() => startEdit(selectedActivity)}>Modifica attività</button>
              <button className="secondary-btn danger-outline" onClick={deactivateSelected}>Disattiva attività</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EpcWeeklyInput({ selectedProject }) {
  const [projectCode, setProjectCode] = useState(selectedProject?.code || "V0015");
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { if (selectedProject?.code) setProjectCode(selectedProject.code); }, [selectedProject]);

  async function load() {
    setError("");
    setSuccess("");
    try {
      const data = await getWbsActivities(projectCode);
      setRows(data.map((r) => ({ ...r, qty_previous: 0, qty_week: 0, notes: "" })));
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => { load(); }, [projectCode]);

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  async function submit() {
    setError("");
    setSuccess("");
    try {
      await saveWeeklyUpdates(projectCode, weekStart, rows);
      const progress = calculateProgressFromWbs(rows);
      setSuccess(`Aggiornamento EPC inviato per approvazione IPP. Progress WBS proposto: ${(progress * 100).toFixed(2)}%`);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  const grouped = rows.reduce((acc, r) => {
    const key = `${r.level1}${r.level2 ? " / " + r.level2 : ""}`;
    acc[key] = acc[key] || [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">EPC Area</span>
          <h1>EPC Weekly Input</h1>
          <p>Compilazione quantità settimanali per attività WBS. Il sistema calcola progress e curve.</p>
        </div>
        <div className="input-row">
          <ProjectSelect value={projectCode} onChange={setProjectCode} />
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel">
        <div className="panel-head">
          <div><h2>Quantity Update - {projectCode}</h2><p>Inserisci Qty totale progetto, Qty precedente e Qty settimana. Le quantità totali restano salvate nella WBS del progetto.</p></div>
          <button className="primary-btn" onClick={submit}>Submit EPC Update</button>
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div className="wbs-group" key={group}>
            <h3>{group}</h3>
            <table>
              <thead><tr><th>Attività</th><th>UM</th><th>Qty Totale</th><th>Qty Prec.</th><th>Qty Settimana</th><th>Cumulato</th><th>Progress</th><th>Note</th></tr></thead>
              <tbody>
                {items.map((r) => {
                  const total = Number(r.quantity_total || 0);
                  const prev = Number(r.qty_previous || 0);
                  const week = Number(r.qty_week || 0);
                  const cum = Math.min(total, prev + week);
                  const progress = total > 0 ? cum / total : 0;
                  return (
                    <tr key={r.id}>
                      <td>{r.activity}</td>
                      <td>{r.unit}</td>
                      <td><input className="table-input" type="number" value={r.quantity_total || 0} onChange={(e) => updateRow(r.id, "quantity_total", e.target.value)} /></td>
                      <td><input className="table-input" type="number" value={r.qty_previous} onChange={(e) => updateRow(r.id, "qty_previous", e.target.value)} /></td>
                      <td><input className="table-input" type="number" value={r.qty_week} onChange={(e) => updateRow(r.id, "qty_week", e.target.value)} /></td>
                      <td>{cum.toLocaleString("it-IT")}</td>
                      <td>{(progress * 100).toFixed(1)}%</td>
                      <td><input className="table-input wide" value={r.notes} onChange={(e) => updateRow(r.id, "notes", e.target.value)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {!rows.length && <div className="empty-state">Nessuna WBS caricata per {projectCode}.</div>}
      </div>
    </div>
  );
}

function ProjectSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="V0015">V0015 Atzori</option>
      <option value="V0021">V0021 Friargiu</option>
      <option value="V0012">V0012 Loffreda</option>
      <option value="V0057">V0057 Bertolin</option>
      <option value="TEMPLATE">TEMPLATE</option>
    </select>
  );
}

function CurvesPage({ curve }) {
  return (
    <div className="page">
      <div className="page-header">
        <div><span className="eyebrow">S-Curve</span><h1>Curve S</h1><p>Confronto Planned / Forecast / Actual.</p></div>
      </div>
      <section className="panel">
        <ResponsiveContainer width="100%" height={430}>
          <LineChart data={curve}>
            <CartesianGrid stroke="rgba(255,255,255,.10)" />
            <XAxis dataKey="date" stroke="#91a8c7" />
            <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
            <Tooltip formatter={(v) => v == null ? "-" : pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
            <Legend />
            <ReferenceLine x="2026-06-27" stroke="#fff" strokeDasharray="6 6" label={{ value: "Ultimo SAL", fill: "#fff" }} />
            <Line type="monotone" dataKey="planned" stroke="#55d7ff" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="#ffb020" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function Placeholder({ title, subtitle, icon: Icon }) {
  return (
    <div className="page">
      <div className="page-header">
        <div><span className="eyebrow">Modulo</span><h1>{title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="panel empty-module">{Icon && <Icon size={44} />}<h2>Modulo in sviluppo</h2><p>Questa sezione sarà collegata al database nella prossima iterazione.</p></div>
    </div>
  );
}



function WeeklyReview({ selectedProject }) {
  const [projectCode, setProjectCode] = useState(selectedProject?.code || "V0015");
  const [rows, setRows] = useState([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  async function load() {
    setError("");
    setSuccess("");
    try {
      const data = await getSubmittedWeeklyUpdates(projectCode);
      setRows(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => { load(); }, [projectCode]);

  const grouped = rows.reduce((acc, r) => {
    const key = `${r.project_code} | Week ${r.week_start} | ${r.status}`;
    acc[key] = acc[key] || [];
    acc[key].push(r);
    return acc;
  }, {});

  async function reviewGroup(items, action) {
    setError("");
    setSuccess("");
    if (action === "reject" && !reason.trim()) {
      setError("Inserisci una motivazione per il rifiuto.");
      return;
    }
    try {
      await reviewWeeklyUpdates(items.map((i) => i.id), action, "IPP PM", reason);
      setSuccess(action === "approve" ? "Aggiornamento approvato." : "Aggiornamento rifiutato.");
      setReason("");
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">IPP Approval Workflow</span>
          <h1>Weekly Review</h1>
          <p>Gli avanzamenti EPC aggiornano Portfolio e Project solo dopo approvazione IPP.</p>
        </div>
        <ProjectSelect value={projectCode} onChange={setProjectCode} />
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel">
        <h2>Submitted / Rejected Updates</h2>
        <p className="small">Storico per settimana e progetto. Approva solo i dati corretti.</p>

        <div className="review-list">
          {Object.entries(grouped).map(([key, items]) => (
            <div className="review-card" key={key}>
              <div className="review-head">
                <h3>{key}</h3>
                <span className={`status status-${String(items[0].status).toLowerCase()}`}>{items[0].status}</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Attività</th>
                    <th>Disciplina</th>
                    <th>Qty Prec.</th>
                    <th>Qty Week</th>
                    <th>Cumulato</th>
                    <th>Progress</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const total = Number(r.wbs_activities?.quantity_total || 0);
                    const progress = total > 0 ? Number(r.qty_cumulative || 0) / total : 0;
                    return (
                      <tr key={r.id}>
                        <td>{r.wbs_activities?.activity}</td>
                        <td>{r.wbs_activities?.level2 || r.wbs_activities?.level1}</td>
                        <td>{Number(r.qty_previous || 0).toLocaleString("it-IT")}</td>
                        <td>{Number(r.qty_week || 0).toLocaleString("it-IT")}</td>
                        <td>{Number(r.qty_cumulative || 0).toLocaleString("it-IT")}</td>
                        <td>{(progress * 100).toFixed(1)}%</td>
                        <td>{r.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <textarea
                className="review-reason"
                placeholder="Motivazione rifiuto, se necessaria..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="form-actions">
                <button className="primary-btn" onClick={() => reviewGroup(items, "approve")}>Approve</button>
                <button className="secondary-btn danger-outline" onClick={() => reviewGroup(items, "reject")}>Reject</button>
              </div>
            </div>
          ))}
          {!rows.length && <div className="empty-state">Nessun update da revisionare per {projectCode}.</div>}
        </div>
      </div>
    </div>
  );
}


function EpcWbsReadOnly({ selectedProject }) {
  const [rows, setRows] = useState([]);
  const [projectCode, setProjectCode] = useState(selectedProject?.code || "V0015");
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  async function load() {
    const data = await getWbsActivities(projectCode);
    setRows(data);
    setSelectedActivity(data?.[0] || null);
  }

  useEffect(() => { load(); }, [projectCode]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">EPC Restricted View</span>
          <h1>WBS Operativa</h1>
          <p>Vista sola lettura della WBS del progetto. La modifica struttura è riservata al portale IPP.</p>
        </div>
        <ProjectSelect value={projectCode} onChange={setProjectCode} />
      </div>

      <div className="grid two wbs-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>WBS Tree - {projectCode}</h2>
              <p>{rows.length} attività operative</p>
            </div>
          </div>
          <WbsTreeView rows={rows} onSelect={setSelectedActivity} />
        </section>

        <section className="panel">
          <ActivityDetail activity={selectedActivity} />
        </section>
      </div>
    </div>
  );
}



function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      onLogin(result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function demoIpp() {
    onLogin({
      user: { id: "demo-ipp", email: "demo.ipp@company.com" },
      profile: { id: "demo-ipp", email: "demo.ipp@company.com", full_name: "Demo IPP PM", role: "admin" }
    });
  }

  function demoEpc() {
    onLogin({
      user: { id: "demo-epc", email: "demo.epc@epc.com" },
      profile: { id: "demo-epc", email: "demo.epc@epc.com", full_name: "Demo EPC PM", role: "epc_pm" }
    });
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <span className="eyebrow">Helios CM</span>
        <h1>Construction Management System</h1>
        <p>Accesso sicuro con ruoli separati IPP / EPC.</p>

        <div className="login-form">
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@azienda.com" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /></label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary-btn login-btn" onClick={submit} disabled={loading}>
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </div>

        <div className="demo-login">
          <p>Per test immediato:</p>
          <button className="secondary-btn" onClick={demoIpp}>Entra Demo IPP</button>
          <button className="secondary-btn" onClick={demoEpc}>Entra Demo EPC</button>
        </div>
      </div>
    </div>
  );
}

function UserBadge({ profile, onLogout }) {
  return (
    <div className="user-badge">
      <div>
        <strong>{profile?.full_name || profile?.email}</strong>
        <span>{profile?.role}</span>
      </div>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}




function IppAnalytics({ projects }) {
  const [stats, setStats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [selectedCode, setSelectedCode] = useState("ALL");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [projectStats, weeklyTrend] = await Promise.all([
        getApprovedProjectStats(),
        getApprovedWeeklyTrend(selectedCode === "ALL" ? null : selectedCode)
      ]);
      setStats(projectStats);
      setTrend(weeklyTrend);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => { load(); }, [selectedCode]);

  const projectRows = projects.map((p) => {
    const s = stats.find((x) => x.project_code === p.code);
    const actual = s?.actual ?? p.actual ?? 0;
    return {
      ...p,
      approvedActual: actual,
      deltaPlannedApproved: actual - (p.planned || 0),
      deltaForecastApproved: actual - (p.forecast || 0)
    };
  });

  const avgApproved = projectRows.reduce((a, p) => a + (p.approvedActual || 0), 0) / Math.max(1, projectRows.length);
  const atRisk = projectRows.filter((p) => p.deltaPlannedApproved < -0.05).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">IPP Analytics</span>
          <h1>Control Room</h1>
          <p>Grafici e KPI derivati dagli aggiornamenti settimanali approvati dal PM IPP.</p>
        </div>
        <div className="input-row">
          <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
            <option value="ALL">Portfolio</option>
            {projects.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
          </select>
          <button className="primary-btn" onClick={load}>Aggiorna analytics</button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="kpi-grid five">
        <KpiCard icon={Activity} label="Actual approvato" value={pct(avgApproved)} note="da weekly approved" />
        <KpiCard icon={AlertTriangle} label="Progetti sotto piano" value={atRisk} note="delta planned < -5%" tone={atRisk > 0 ? "warning" : "success"} />
        <KpiCard icon={CheckCircle2} label="Fonte dati" value="Approved" note="solo dati validati IPP" />
        <KpiCard icon={Gauge} label="Controllo" value="IPP" note="nessun dato sporco in dashboard" />
        <KpiCard icon={CalendarDays} label="Storico" value={trend.length} note="settimane approvate" />
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Approved Actual vs Baseline</h2>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={projectRows} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
              <YAxis dataKey="name" type="category" stroke="#91a8c7" width={105} />
              <Tooltip formatter={(v) => pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill="#55d7ff" radius={[0, 8, 8, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#ffb020" radius={[0, 8, 8, 0]} />
              <Bar dataKey="approvedActual" name="Approved Actual" fill="#2ecc71" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Approved Weekly Trend</h2>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" />
              <XAxis dataKey="week" stroke="#91a8c7" />
              <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
              <Tooltip formatter={(v) => pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Approved Actual" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          {!trend.length && <p className="small">Il trend comparirà quando saranno presenti weekly update approvati.</p>}
        </section>
      </div>

      <section className="panel">
        <h2>Delta Control</h2>
        <table>
          <thead>
            <tr>
              <th>Progetto</th>
              <th>Approved Actual</th>
              <th>Planned</th>
              <th>Forecast</th>
              <th>Δ Planned</th>
              <th>Δ Forecast</th>
              <th>Stato IPP</th>
            </tr>
          </thead>
          <tbody>
            {projectRows.map((p) => (
              <tr key={p.code}>
                <td><b>{p.code}</b> · {p.name}</td>
                <td>{pct(p.approvedActual)}</td>
                <td>{pct(p.planned)}</td>
                <td>{pct(p.forecast)}</td>
                <td className={p.deltaPlannedApproved < 0 ? "negative" : "positive"}>{signedPct(p.deltaPlannedApproved)}</td>
                <td className={p.deltaForecastApproved < 0 ? "negative" : "positive"}>{signedPct(p.deltaForecastApproved)}</td>
                <td>{p.deltaPlannedApproved < -0.05 ? "ATTENTION" : "OK"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    company: "",
    role: "epc_pm",
    project_codes: ["V0015"]
  });

  const projectOptions = [
    ["V0015", "Atzori"],
    ["V0021", "Friargiu"],
    ["V0012", "Loffreda"],
    ["V0057", "Bertolin"]
  ];

  async function load() {
    setError("");
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleProject(code) {
    setForm((f) => {
      const exists = f.project_codes.includes(code);
      return {
        ...f,
        project_codes: exists
          ? f.project_codes.filter((c) => c !== code)
          : [...f.project_codes, code]
      };
    });
  }

  async function createUser() {
    setError("");
    setSuccess("");

    if (!form.email || !form.role) {
      setError("Email e ruolo sono obbligatori.");
      return;
    }

    try {
      await inviteUserByEmail(form);
      setSuccess("Invito inviato / utente creato. Se Edge Function non è attiva, usa Supabase Auth per completare la creazione.");
      setShowForm(false);
      setForm({ email: "", full_name: "", company: "", role: "epc_pm", project_codes: ["V0015"] });
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  async function disable(id) {
    setError("");
    setSuccess("");
    try {
      await deactivateUser(id);
      setSuccess("Utente disattivato.");
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Users & Access</h1>
          <p>Crea utenti, assegna ruoli e limita gli EPC ai soli progetti assegnati.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(true)}>+ Nuovo utente</button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showForm && (
        <section className="panel admin-form">
          <h2>Nuovo utente</h2>
          <div className="form-grid">
            <label>Email<input value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
            <label>Nome completo<input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></label>
            <label>Azienda<input value={form.company} onChange={(e) => update("company", e.target.value)} /></label>
            <label>Ruolo
              <select value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="admin">Admin</option>
                <option value="director">Direzione</option>
                <option value="pm_ipp">PM IPP</option>
                <option value="viewer">Viewer</option>
                <option value="epc_pm">EPC PM</option>
                <option value="site_manager">Site Manager</option>
              </select>
            </label>
          </div>

          <div className="project-checkboxes">
            <h3>Progetti assegnati</h3>
            {projectOptions.map(([code, name]) => (
              <label key={code}>
                <input type="checkbox" checked={form.project_codes.includes(code)} onChange={() => toggleProject(code)} />
                {code} · {name}
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button className="primary-btn" onClick={createUser}>Crea / invita utente</button>
            <button className="secondary-btn" onClick={() => setShowForm(false)}>Annulla</button>
          </div>

          <p className="small">
            Nota: per inviare davvero l'email di invito deve essere deployata la Supabase Edge Function
            <b> admin-invite-user</b>.
          </p>
        </section>
      )}

      <section className="panel">
        <h2>Utenti</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Azienda</th>
              <th>Ruolo</th>
              <th>Stato</th>
              <th>Azione</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || "-"}</td>
                <td>{u.email}</td>
                <td>{u.company || "-"}</td>
                <td><span className="role-pill">{u.role}</span></td>
                <td>{u.active ? "Attivo" : "Disattivato"}</td>
                <td><button className="secondary-btn danger-outline" onClick={() => disable(u.id)}>Disattiva</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


export default function App() {
  const [auth, setAuth] = useState({ checked: false, user: null, profile: null });
  const [portal, setPortal] = useState(null);
  const [page, setPage] = useState("portfolio");
  const { projects, issues, curve, source, loading, reload } = useData();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    async function boot() {
      const session = await getSession();
      const nextPortal = session.profile ? roleToPortal(session.profile.role) : null;
      setAuth({ checked: true, user: session.user, profile: session.profile });
      setPortal(nextPortal);
      setPage(nextPortal === "epc" ? "epc" : "portfolio");
    }
    boot();
  }, []);

  useEffect(() => {
    if (!selectedProject && projects.length) setSelectedProject(projects[0]);
  }, [projects, selectedProject]);

  function handleLogin(result) {
    const nextPortal = roleToPortal(result.profile.role);
    setAuth({ checked: true, user: result.user, profile: result.profile });
    setPortal(nextPortal);
    setPage(nextPortal === "epc" ? "epc" : "portfolio");
  }

  async function handleLogout() {
    await signOut();
    setAuth({ checked: true, user: null, profile: null });
    setPortal(null);
    setPage("portfolio");
  }

  function openProject(project) {
    setSelectedProject(project);
    setPage("project");
  }

  if (!auth.checked) {
    return <div className="login-shell"><div className="login-card"><h1>Caricamento...</h1></div></div>;
  }

  if (!auth.user || !auth.profile) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const role = auth.profile.role;
  const isIpp = portal === "ipp";
  const isEpc = portal === "epc";

  const ippMenu = [
    ["portfolio", "Portfolio", Building2],
    ["analytics", "IPP Analytics", Activity],
    ["project", "Project", Zap],
    ["wbs", "WBS Setup", ClipboardList],
    ["weekly-review", "Weekly Review", CheckCircle2],
    ["epc", "EPC Input Review", UploadCloud],
    ["curves", "S-Curves", Activity],
    ["cod", "COD Center", Gauge],
    ["issues", "Risk Center", AlertTriangle],
    ["reports", "Reports", FileSpreadsheet],
    ["admin", "Administration", ClipboardList]
  ];

  const epcMenu = [
    ["epc", "Weekly Input", UploadCloud],
    ["wbs-readonly", "WBS View", ClipboardList]
  ];

  const menu = isIpp ? ippMenu : epcMenu;

  return (
    <div className={`app-shell ${isEpc ? "epc-portal" : "ipp-portal"}`}>
      <aside>
        <div className="brand">
          {isIpp ? "Helios CM" : "EPC Weekly Portal"}
          <span>{isIpp ? "IPP Control Center" : "Restricted operational access"}</span>
        </div>

        <UserBadge profile={auth.profile} onLogout={handleLogout} />

        {canAccessIpp(role) && canAccessEpc(role) && (
          <div className="portal-switch">
            <button onClick={() => { setPortal(isIpp ? "epc" : "ipp"); setPage(isIpp ? "epc" : "portfolio"); }}>
              Passa a portale {isIpp ? "EPC" : "IPP"}
            </button>
          </div>
        )}

        <nav>
          {menu.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>

        <div className="side-footer">
          <CheckCircle2 size={14} />
          {isIpp ? "IPP access" : "EPC limited access"}
        </div>
      </aside>

      <main>
        {loading && <Placeholder title="Caricamento dati..." subtitle="Connessione a Supabase in corso." icon={Activity} />}

        {!loading && isIpp && page === "portfolio" && <PortfolioHome projects={projects} issues={issues} source={source} onReload={reload} onOpenProject={openProject} />}
        {!loading && isIpp && page === "analytics" && <IppAnalytics projects={projects} />}
        {!loading && isIpp && page === "project" && <ProjectPage project={selectedProject} setPage={setPage} />}
        {!loading && isIpp && page === "wbs" && <WbsSetup selectedProject={selectedProject} />}
        {!loading && isIpp && page === "weekly-review" && <WeeklyReview selectedProject={selectedProject} />}
        {!loading && isIpp && page === "epc" && <EpcWeeklyInput selectedProject={selectedProject} />}
        {!loading && isIpp && page === "curves" && <CurvesPage curve={curve} />}
        {!loading && isIpp && page === "cod" && <Placeholder title="COD Center" subtitle="Readiness, commissioning, documentazione e DSO." icon={Gauge} />}
        {!loading && isIpp && page === "issues" && <Placeholder title="Risk Center" subtitle="Issues, owner, scadenze e impatto COD." icon={AlertTriangle} />}
        {!loading && isIpp && page === "reports" && <Placeholder title="Management Reports" subtitle="Report settimanale per direzione e management." icon={FileSpreadsheet} />}
        {!loading && isIpp && page === "admin" && <AdminUsers />}

        {!loading && isEpc && page === "epc" && <EpcWeeklyInput selectedProject={selectedProject} />}
        {!loading && isEpc && page === "wbs-readonly" && <EpcWbsReadOnly selectedProject={selectedProject} />}
      </main>
    </div>
  );
}
