import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Zap,
  FileText,
  UploadCloud,
  Settings
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
  ReferenceLine
} from "recharts";
import { projects, issues, portfolioCurve } from "./data/mockData";
import "./styles.css";

const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`;
const signedPct = (v) => `${v >= 0 ? "+" : ""}${((v || 0) * 100).toFixed(1)}%`;

function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

function KpiCard({ label, value, note }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}

function ProgressBars({ project }) {
  const rows = [
    ["Planned", project.planned, "planned"],
    ["Forecast", project.forecast, "forecast"],
    ["Actual", project.actual, "actual"]
  ];

  return (
    <div className="bars">
      {rows.map(([label, value, cls]) => (
        <div className="bar-row" key={label}>
          <span>{label}</span>
          <div className="bar-track">
            <div className={`bar-fill ${cls}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
          </div>
          <strong>{pct(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function Executive() {
  const totalMw = projects.reduce((a, p) => a + p.mwDc, 0);
  const avgActual = projects.reduce((a, p) => a + p.actual, 0) / projects.length;
  const avgDelta = projects.reduce((a, p) => a + p.deltaPlanned, 0) / projects.length;
  const avgHealth = projects.reduce((a, p) => a + p.health, 0) / projects.length;
  const delayed = projects.filter((p) => p.status !== "ON TRACK").length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Portfolio Executive</h1>
          <p>SAL EPC + Weekly Report + IPP Governance</p>
        </div>
        <button className="primary-btn"><UploadCloud size={18} /> Import SAL</button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="MW monitorati" value={totalMw.toFixed(1)} note="da SAL importati" />
        <KpiCard label="Progetti" value={projects.length} note="con dati" />
        <KpiCard label="Actual medio" value={pct(avgActual)} note="portfolio" />
        <KpiCard label="Δ Planned" value={signedPct(avgDelta)} note="medio" />
        <KpiCard label="In ritardo" value={delayed} note="attention/critical" />
        <KpiCard label="Health Index" value={`${avgHealth.toFixed(0)}/100`} note="portfolio" />
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Portfolio Progress</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={projects} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
              <YAxis dataKey="name" type="category" stroke="#91a8c7" width={100} />
              <Tooltip formatter={(v) => pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366" }} />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill="#55d7ff" radius={[0, 8, 8, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#ffb020" radius={[0, 8, 8, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#2ecc71" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Portfolio S-Curve</h2>
          <p className="small">Linea tratteggiata = ultimo SAL disponibile</p>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={portfolioCurve}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" />
              <XAxis dataKey="date" stroke="#91a8c7" />
              <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} stroke="#91a8c7" />
              <Tooltip formatter={(v) => v == null ? "-" : pct(v)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366" }} />
              <Legend />
              <ReferenceLine x="2026-06-27" stroke="#fff" strokeDasharray="6 6" label={{ value: "Ultimo SAL", fill: "#fff" }} />
              <Line type="monotone" dataKey="planned" stroke="#55d7ff" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="#ffb020" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Portfolio Cards</h2>
          <div className="project-list">
            {projects.map((p) => (
              <div className="project-card" key={p.code}>
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.code} · {p.technology} · {p.mwDc.toFixed(1)} MW</p>
                  <StatusBadge status={p.status} />
                </div>
                <ProgressBars project={p} />
                <div className="delta-box">
                  <span>Δ Planned</span>
                  <strong className={p.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(p.deltaPlanned)}</strong>
                  <span>Δ Forecast</span>
                  <strong className={p.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(p.deltaForecast)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Management Attention</h2>
          {issues.map((issue) => (
            <div className="issue" key={issue.id}>
              <div>
                <strong>{issue.project}</strong>
                <p>{issue.title}</p>
                <span>{issue.owner} · {issue.status}</span>
              </div>
              <b className={`impact ${issue.impact.toLowerCase()}`}>{issue.impact}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Portfolio() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Portfolio</h1>
          <p>Confronto dettagliato dei progetti in construction.</p>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>MW</th>
              <th>Planned</th>
              <th>Forecast</th>
              <th>Actual</th>
              <th>Δ Planned</th>
              <th>Δ Forecast</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.code}>
                <td><strong>{p.name}</strong><br /><span>{p.code}</span></td>
                <td>{p.mwDc.toFixed(1)}</td>
                <td>{pct(p.planned)}</td>
                <td>{pct(p.forecast)}</td>
                <td>{pct(p.actual)}</td>
                <td className={p.deltaPlanned < 0 ? "negative" : "positive"}>{signedPct(p.deltaPlanned)}</td>
                <td className={p.deltaForecast < 0 ? "negative" : "positive"}>{signedPct(p.deltaForecast)}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectRoom() {
  const [selected, setSelected] = useState(projects[0].code);
  const project = projects.find((p) => p.code === selected);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Project Room</h1>
          <p>Controllo puntuale del singolo progetto.</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {projects.map((p) => <option value={p.code} key={p.code}>{p.name}</option>)}
        </select>
      </div>

      <div className="kpi-grid five">
        <KpiCard label="Actual" value={pct(project.actual)} note="SAL EPC" />
        <KpiCard label="Planned" value={pct(project.planned)} note="baseline" />
        <KpiCard label="Forecast" value={pct(project.forecast)} note="forecast EPC" />
        <KpiCard label="Δ Planned" value={signedPct(project.deltaPlanned)} note="scostamento" />
        <KpiCard label="Health" value={`${project.health}/100`} note="score" />
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Progress</h2>
          <ProgressBars project={project} />
        </div>
        <div className="card">
          <h2>IPP Notes</h2>
          <textarea placeholder="Inserisci note PM IPP, decisioni, prossime azioni..." />
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title, text }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="card">
        <h2>Prossimo sviluppo</h2>
        <p>Questo modulo sarà collegato al database Supabase nella versione aziendale.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("executive");
  const menu = [
    ["executive", "Executive", LayoutDashboard],
    ["portfolio", "Portfolio", FolderKanban],
    ["project", "Project Room", Zap],
    ["cod", "COD Room", Zap],
    ["issues", "Issues", AlertTriangle],
    ["reports", "Reports", FileText],
    ["settings", "Settings", Settings]
  ];

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
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        {page === "executive" && <Executive />}
        {page === "portfolio" && <Portfolio />}
        {page === "project" && <ProjectRoom />}
        {page === "cod" && <Placeholder title="COD Room" text="Checklist COD, readiness documentale, O&M, Enel/DSO e commissioning." />}
        {page === "issues" && <Placeholder title="Issues Center" text="Registro criticità, owner, priorità, impatto COD e decisioni." />}
        {page === "reports" && <Placeholder title="Management Reports" text="Generazione report settimanali PDF/PPT per management." />}
        {page === "settings" && <Placeholder title="Settings" text="Configurazione progetti, utenti, template e data sources." />}
      </main>
    </div>
  );
}
