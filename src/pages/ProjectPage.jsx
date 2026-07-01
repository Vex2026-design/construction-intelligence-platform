import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

const pct = (value) => `${((value || 0) * 100).toFixed(1)}%`;
const signedPct = (value) => `${value >= 0 ? "+" : ""}${((value || 0) * 100).toFixed(1)}%`;

export default function ProjectPage({ project, setPage }) {
  if (!project) return null;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <span className="eyebrow">{project.code}</span>
          <h1>{project.name}</h1>
          <p>{project.technology} · {project.mwDc} MW DC · COD {project.cod}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <section className="kpi-grid">
        <KpiCard
          label="Approved Actual"
          value={project.hasApprovedData ? pct(project.actual) : "—"}
          note={project.hasApprovedData ? "official" : "in attesa weekly approved"}
        />
        <KpiCard label="Planned" value={pct(project.planned)} note="baseline" />
        <KpiCard label="Forecast" value={pct(project.forecast)} note="EPC forecast" />
        <KpiCard
          label="Δ Planned"
          value={project.hasApprovedData ? signedPct(project.deltaPlanned) : "—"}
          note="gap"
          tone={project.deltaPlanned < 0 ? "warning" : ""}
        />
        <KpiCard
          label="Health"
          value={project.hasApprovedData ? `${project.health}/100` : "—"}
          note="calculated"
        />
      </section>

      <div className="tabs">
        <button type="button" onClick={() => setPage("wbs")}>WBS</button>
        <button type="button" onClick={() => setPage("weekly")}>EPC Weekly</button>
        <button type="button" onClick={() => setPage("review")}>Weekly Review</button>
        <button type="button" onClick={() => setPage("analytics")}>Analytics</button>
      </div>

      <section className="panel">
        <h2>IPP Summary</h2>
        {project.hasApprovedData ? (
          <ul className="summary-list">
            <li>Actual ufficiale: <b>{pct(project.actual)}</b></li>
            <li>Delta Planned: <b>{signedPct(project.deltaPlanned)}</b></li>
            <li>SPI: <b>{project.spi?.toFixed(2)}</b></li>
            <li>Stato: <b>{project.status}</b></li>
          </ul>
        ) : (
          <p className="muted">Il progetto non ha ancora Weekly approvati. La Project Room si popolerà dopo la prima approvazione IPP.</p>
        )}
      </section>
    </div>
  );
}
