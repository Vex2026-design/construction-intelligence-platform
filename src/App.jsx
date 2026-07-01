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
import { getWbsActivities, saveWeeklyUpdates, calculateProgressFromWbs } from "./lib/wbsApi";

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
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => { if (selectedProject?.code) setProjectCode(selectedProject.code); }, [selectedProject]);

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Project WBS Tree</span>
          <h1>WBS Setup</h1>
          <p>Vista ad albero per progetto: L1, L2 e attività operative cliccabili.</p>
        </div>
        <ProjectSelect value={projectCode} onChange={setProjectCode} />
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="grid two wbs-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>WBS Tree - {projectCode}</h2>
              <p>{rows.length} attività caricate</p>
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
      setSuccess(`Aggiornamento EPC salvato. Progress WBS stimato: ${(progress * 100).toFixed(2)}%`);
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
          <div><h2>Quantity Update - {projectCode}</h2><p>Inserisci Qty precedente e Qty settimana.</p></div>
          <button className="primary-btn" onClick={submit}>Submit EPC Update</button>
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div className="wbs-group" key={group}>
            <h3>{group}</h3>
            <table>
              <thead><tr><th>Attività</th><th>UM</th><th>Qty Totale</th><th>Qty Prec.</th><th>Qty Settimana</th><th>Progress</th><th>Note</th></tr></thead>
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
                      <td>{total.toLocaleString("it-IT")}</td>
                      <td><input className="table-input" type="number" value={r.qty_previous} onChange={(e) => updateRow(r.id, "qty_previous", e.target.value)} /></td>
                      <td><input className="table-input" type="number" value={r.qty_week} onChange={(e) => updateRow(r.id, "qty_week", e.target.value)} /></td>
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

export default function App() {
  const [page, setPage] = useState("portfolio");
  const { projects, issues, curve, source, loading, reload } = useData();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!selectedProject && projects.length) setSelectedProject(projects[0]);
  }, [projects, selectedProject]);

  function openProject(project) {
    setSelectedProject(project);
    setPage("project");
  }

  const menu = [
    ["portfolio", "Portfolio", Building2],
    ["project", "Project", Zap],
    ["wbs", "WBS Setup", ClipboardList],
    ["epc", "EPC Weekly Input", UploadCloud],
    ["curves", "S-Curves", Activity],
    ["cod", "COD Center", Gauge],
    ["issues", "Risk Center", AlertTriangle],
    ["reports", "Reports", FileSpreadsheet]
  ];

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">Construction<br />Intelligence<br />Platform<span>Project-first V2</span></div>
        <nav>
          {menu.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="side-footer"><CheckCircle2 size={14} />Supabase ready</div>
      </aside>

      <main>
        {loading && <Placeholder title="Caricamento dati..." subtitle="Connessione a Supabase in corso." icon={Activity} />}
        {!loading && page === "portfolio" && <PortfolioHome projects={projects} issues={issues} source={source} onReload={reload} onOpenProject={openProject} />}
        {!loading && page === "project" && <ProjectPage project={selectedProject} setPage={setPage} />}
        {!loading && page === "wbs" && <WbsSetup selectedProject={selectedProject} />}
        {!loading && page === "epc" && <EpcWeeklyInput selectedProject={selectedProject} />}
        {!loading && page === "curves" && <CurvesPage curve={curve} />}
        {!loading && page === "cod" && <Placeholder title="COD Center" subtitle="Readiness, commissioning, documentazione e DSO." icon={Gauge} />}
        {!loading && page === "issues" && <Placeholder title="Risk Center" subtitle="Issues, owner, scadenze e impatto COD." icon={AlertTriangle} />}
        {!loading && page === "reports" && <Placeholder title="Management Reports" subtitle="Report settimanale per direzione e management." icon={FileSpreadsheet} />}
      </main>
    </div>
  );
}
