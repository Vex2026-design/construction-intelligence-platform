import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import EmptyState from "../components/EmptyState";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

const pct = (value) => `${((value || 0) * 100).toFixed(1)}%`;

export default function PortfolioPage({ snapshots, issues, onOpenProject }) {
  const approved = snapshots.filter((project) => project.hasApprovedData);
  const totalMw = snapshots.reduce((sum, project) => sum + Number(project.mwDc || 0), 0);
  const averageActual = approved.length
    ? approved.reduce((sum, project) => sum + Number(project.actual || 0), 0) / approved.length
    : null;
  const atRisk = approved.filter((project) => Number(project.deltaPlanned || 0) < -0.05).length;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <span className="eyebrow">IPP Control Room</span>
          <h1>Portfolio Executive</h1>
          <p>Le dashboard usano solo Weekly approvati dal PM IPP.</p>
        </div>
      </header>

      <section className="kpi-grid">
        <KpiCard label="MW" value={totalMw.toFixed(1)} note="portfolio" />
        <KpiCard label="Projects" value={snapshots.length} note="in construction" />
        <KpiCard
          label="Approved Actual"
          value={averageActual === null ? "—" : pct(averageActual)}
          note={averageActual === null ? "in attesa weekly approved" : "official progress"}
        />
        <KpiCard label="At Risk" value={atRisk} note="delta planned < -5%" tone={atRisk ? "warning" : ""} />
        <KpiCard label="Data Policy" value="Approved" note="no unapproved EPC data" />
      </section>

      <section className="panel">
        <h2>Portfolio progress</h2>
        {approved.length ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={snapshots} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.10)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} stroke="#91a8c7" />
              <YAxis dataKey="name" type="category" stroke="#91a8c7" width={110} />
              <Tooltip formatter={(value) => pct(value)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill="#55d7ff" radius={[0, 8, 8, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#ffb020" radius={[0, 8, 8, 0]} />
              <Bar dataKey="actual" name="Approved Actual" fill="#2ecc71" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Nessun Weekly approvato: i grafici si attiveranno dopo la prima approvazione IPP." />
        )}
      </section>

      <section className="panel">
        <h2>Projects</h2>
        <div className="project-grid">
          {snapshots.map((project) => (
            <button key={project.code} className="project-card" type="button" onClick={() => onOpenProject(project)}>
              <div>
                <h3>{project.name}</h3>
                <p>{project.code} · {project.mwDc} MW · COD {project.cod}</p>
              </div>
              <StatusBadge status={project.status} />
              <div className="progress-line">
                <span>Approved Actual</span>
                <strong>{project.hasApprovedData ? pct(project.actual) : "—"}</strong>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Alerts</h2>
        {issues.map((issue) => (
          <div className="issue" key={issue.id}>
            <div>
              <strong>{issue.projectCode}</strong>
              <p>{issue.title}</p>
              <small>{issue.owner} · {issue.status}</small>
            </div>
            <StatusBadge status={issue.impact} />
          </div>
        ))}
      </section>
    </div>
  );
}
