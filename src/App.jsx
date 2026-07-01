import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Factory,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  UploadCloud,
  ClipboardList,
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

  useEffect(() => {
    load();
  }, []);

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

function ProjectCard({ project, onOpen }) {
  return (
    <button className="project-card" onClick={() => onOpen(project)}>
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
        <div>
          <span>Δ Planned</span>
          <b className={project.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(project.deltaPlanned)}</b>
        </div>
        <div>
          <span>Δ Forecast</span>
          <b className={project.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(project.deltaForecast)}</b>
        </div>
        <div>
          <span>Health</span>
          <b>{project.health}/100</b>
        </div>
      </div>
    </button>
  );
}

function Executive({ projects, issues, curve, source, onReload, onOpenProject }) {
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
          <span className="eyebrow">IPP Construction Control</span>
          <h1>Construction Intelligence Platform</h1>
          <p>Portfolio, SAL EPC, curve S, rischi e COD in un unico centro di controllo.</p>
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
        <KpiCard icon={Factory} label="MW monitorati" value={stats.totalMw.toFixed(1)} note="da SAL caricati" />
        <KpiCard icon={LayoutDashboard} label="Progetti" value={projects.length} note="in construction" />
        <KpiCard icon={Activity} label="Actual medio" value={pct(stats.avgActual)} note="portfolio progress" />
        <KpiCard icon={ArrowDownRight} label="Δ Planned" value={signedPct(stats.avgDelta)} note="scostamento medio" tone={stats.avgDelta < 0 ? "danger" : "success"} />
        <KpiCard icon={AlertTriangle} label="A rischio" value={stats.atRisk} note="attention / critical" tone={stats.atRisk > 0 ? "warning" : "success"} />
        <KpiCard icon={Gauge} label="Health Index" value={`${stats.avgHealth.toFixed(0)}/100`} note="score portfolio" />
      </div>

      <div className="grid two">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Portfolio Progress</h2>
              <p>Confronto Planned / Forecast / Actual per progetto</p>
            </div>
          </div>
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
          <div className="panel-head">
            <div>
              <h2>Portfolio S-Curve</h2>
              <p>Linea tratteggiata = ultimo SAL disponibile</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
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

      <div className="grid two">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Project Portfolio</h2>
              <p>Apri una card per entrare nella Project Room</p>
            </div>
          </div>
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.code} project={p} onOpen={onOpenProject} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Management Attention</h2>
              <p>Issue aperte e punti da portare in riunione</p>
            </div>
          </div>
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
            )) : (
              <div className="empty-state">Nessuna issue aperta.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Portfolio({ projects, onOpenProject }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Portfolio</span>
          <h1>Project Portfolio</h1>
          <p>Vista di controllo dei progetti in construction.</p>
        </div>
      </div>
      <div className="project-grid large">
        {projects.map((p) => <ProjectCard key={p.code} project={p} onOpen={onOpenProject} />)}
      </div>
    </div>
  );
}

function ProjectRoom({ project }) {
  if (!project) {
    return <div className="page"><h1>Project Room</h1><div className="panel empty-state">Seleziona un progetto.</div></div>;
  }

  const codValue = Math.max(15, Math.min(92, project.actual * 100 + 25));
  const codData = [{ name: "COD", value: codValue, fill: "#2ecc71" }];

  return (
    <div className="page">
      <div className="project-hero">
        <div>
          <span className="eyebrow">{project.code} · {project.technology}</span>
          <h1>{project.name}</h1>
          <p>{project.mwDc.toFixed(1)} MW DC · ultimo SAL {project.lastSal || "-"}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="kpi-grid five">
        <KpiCard icon={Activity} label="Actual" value={pct(project.actual)} note="SAL EPC" />
        <KpiCard icon={CalendarDays} label="Planned" value={pct(project.planned)} note="baseline" />
        <KpiCard icon={CircleDot} label="Forecast" value={pct(project.forecast)} note="EPC forecast" />
        <KpiCard icon={ArrowDownRight} label="Δ Planned" value={signedPct(project.deltaPlanned)} note="scostamento" tone={project.deltaPlanned < 0 ? "danger" : "success"} />
        <KpiCard icon={Gauge} label="Health" value={`${project.health}/100`} note="score" />
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
            ].map(([label, value]) => (
              <MiniBar key={label} label={label} value={value} type="actual" />
            ))}
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

      <div className="grid two">
        <section className="panel">
          <h2>AI Construction Analyst</h2>
          <ul className="insight-list">
            <li>{project.name} è a {pct(project.actual)} di avanzamento actual.</li>
            <li>Delta vs planned: <b className={project.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(project.deltaPlanned)}</b>.</li>
            <li>Delta vs forecast: <b className={project.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(project.deltaForecast)}</b>.</li>
            <li>{project.deltaForecast > -0.03 ? "Il forecast è sostanzialmente coerente con l'actual." : "Il forecast richiede verifica con EPC."}</li>
          </ul>
        </section>

        <section className="panel">
          <h2>IPP Notes</h2>
          <textarea placeholder="Note PM IPP, decisioni, prossime azioni..." />
        </section>
      </div>
    </div>
  );
}

function ImportSal() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Import</span>
          <h1>Import SAL EPC</h1>
          <p>Prossimo modulo: upload del SAL e parsing automatico nel database.</p>
        </div>
      </div>
      <div className="panel upload-panel">
        <FileSpreadsheet size={46} />
        <h2>Trascina qui il SAL Excel</h2>
        <p>Il sistema riconoscerà progetto, percentuali, curve S e fasi WBS.</p>
        <button className="primary-btn">Seleziona file</button>
      </div>
    </div>
  );
}


function WbsSetup() {
  const [rows, setRows] = useState([]);
  const [projectCode, setProjectCode] = useState("TEMPLATE");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await getWbsActivities(projectCode);
      setRows(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  useEffect(() => {
    load();
  }, [projectCode]);

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
          <span className="eyebrow">Setup</span>
          <h1>WBS Setup</h1>
          <p>Struttura attività del progetto. Da qui nasce l’input settimanale EPC.</p>
        </div>
        <select value={projectCode} onChange={(e) => setProjectCode(e.target.value)}>
          <option value="TEMPLATE">TEMPLATE</option>
          <option value="V0015">V0015 Atzori</option>
          <option value="V0021">V0021 Friargiu</option>
          <option value="V0012">V0012 Loffreda</option>
          <option value="V0057">V0057 Bertolin</option>
        </select>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <h2>WBS Activities</h2>
        <p className="small">Attività lette dalla tabella Supabase <b>wbs_activities</b>.</p>
        <div className="wbs-list">
          {Object.entries(grouped).map(([group, items]) => (
            <div className="wbs-group" key={group}>
              <h3>{group}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Attività</th>
                    <th>UM</th>
                    <th>Qty</th>
                    <th>Peso</th>
                    <th>Start</th>
                    <th>Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>{r.activity}</td>
                      <td>{r.unit}</td>
                      <td>{Number(r.quantity_total || 0).toLocaleString("it-IT")}</td>
                      <td>{r.activity_weight}%</td>
                      <td>{r.planned_start || "-"}</td>
                      <td>{r.planned_finish || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {!rows.length && <div className="empty-state">Nessuna WBS caricata. Esegui lo script wbs_seed_template.sql in Supabase.</div>}
        </div>
      </div>
    </div>
  );
}

function EpcWeeklyInput() {
  const [projectCode, setProjectCode] = useState("TEMPLATE");
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    load();
  }, [projectCode]);

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
          <p>L’EPC compila le quantità settimanali per attività WBS. Il sistema calcola progress e curve.</p>
        </div>
        <div className="input-row">
          <select value={projectCode} onChange={(e) => setProjectCode(e.target.value)}>
            <option value="TEMPLATE">TEMPLATE</option>
            <option value="V0015">V0015 Atzori</option>
            <option value="V0021">V0021 Friargiu</option>
            <option value="V0012">V0012 Loffreda</option>
            <option value="V0057">V0057 Bertolin</option>
          </select>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Quantity Update</h2>
            <p>Compilare Qty precedente e Qty settimana. Il cumulato e il progress vengono calcolati automaticamente.</p>
          </div>
          <button className="primary-btn" onClick={submit}>Submit EPC Update</button>
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div className="wbs-group" key={group}>
            <h3>{group}</h3>
            <table>
              <thead>
                <tr>
                  <th>Attività</th>
                  <th>UM</th>
                  <th>Qty Totale</th>
                  <th>Qty Prec.</th>
                  <th>Qty Settimana</th>
                  <th>Progress</th>
                  <th>Note</th>
                </tr>
              </thead>
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
        {!rows.length && <div className="empty-state">Nessuna WBS caricata. Esegui lo script wbs_seed_template.sql in Supabase.</div>}
      </div>
    </div>
  );
}


function Placeholder({ title, subtitle, icon: Icon }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Modulo</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="panel empty-module">
        {Icon && <Icon size={44} />}
        <h2>Modulo in sviluppo</h2>
        <p>Questa sezione sarà collegata al database nella prossima iterazione.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("executive");
  const { projects, issues, curve, source, loading, reload } = useData();
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!selectedProject && projects.length) setSelectedProject(projects[0]);
  }, [projects, selectedProject]);

  const menu = [
    ["executive", "Executive", LayoutDashboard],
    ["portfolio", "Portfolio", Factory],
    ["project", "Project Room", Zap],
    ["wbs", "WBS Setup", ClipboardList],
    ["epc", "EPC Weekly Input", UploadCloud],
    ["import", "Import SAL", UploadCloud],
    ["cod", "COD Center", Gauge],
    ["issues", "Risk Center", AlertTriangle],
    ["reports", "Reports", FileSpreadsheet]
  ];

  function openProject(project) {
    setSelectedProject(project);
    setPage("project");
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          Construction<br />Intelligence<br />Platform
          <span>IPP Control Layer</span>
        </div>
        <nav>
          {menu.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-footer">
          <CheckCircle2 size={14} />
          Supabase ready
        </div>
      </aside>

      <main>
        {loading && <Placeholder title="Caricamento dati..." subtitle="Connessione a Supabase in corso." icon={Activity} />}
        {!loading && page === "executive" && <Executive projects={projects} issues={issues} curve={curve} source={source} onReload={reload} onOpenProject={openProject} />}
        {!loading && page === "portfolio" && <Portfolio projects={projects} onOpenProject={openProject} />}
        {!loading && page === "project" && <ProjectRoom project={selectedProject} />}
        {!loading && page === "wbs" && <WbsSetup />}
        {!loading && page === "epc" && <EpcWeeklyInput />}
        {!loading && page === "import" && <ImportSal />}
        {!loading && page === "cod" && <Placeholder title="COD Center" subtitle="Readiness, documenti, commissioning, Enel/DSO e handover." icon={Gauge} />}
        {!loading && page === "issues" && <Placeholder title="Risk Center" subtitle="Issues, decision log, owner, scadenze e impatto COD." icon={AlertTriangle} />}
        {!loading && page === "reports" && <Placeholder title="Management Reports" subtitle="Report settimanale per direzione e management." icon={FileSpreadsheet} />}
      </main>
    </div>
  );
}
