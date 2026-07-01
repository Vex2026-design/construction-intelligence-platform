import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

const pct = (value) => `${((value || 0) * 100).toFixed(1)}%`;

export default function CalculationPage({ snapshots, alerts, refreshData }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Calculation Engine</span>
          <h1>Analytics Engine</h1>
          <p>Il motore calcola KPI, snapshot e alert partendo dai Weekly approvati.</p>
        </div>
        <button className="primary-button" type="button" onClick={refreshData}>Run Calculation Engine</button>
      </header>

      <div className="split-grid">
        <section className="panel">
          <h2>Project Snapshots</h2>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Actual</th>
                <th>Planned</th>
                <th>SPI</th>
                <th>Health</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.filter((s) => s.hasApprovedData).map((snapshot) => (
                <tr key={snapshot.code}>
                  <td>{snapshot.code}</td>
                  <td>{pct(snapshot.actual)}</td>
                  <td>{pct(snapshot.planned)}</td>
                  <td>{snapshot.spi?.toFixed(2)}</td>
                  <td>{snapshot.health}</td>
                  <td><StatusBadge status={snapshot.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!snapshots.some((s) => s.hasApprovedData) && (
            <EmptyState message="Nessuno snapshot disponibile: approva un Weekly per attivare il motore." />
          )}
        </section>

        <section className="panel">
          <h2>Alerts</h2>
          {alerts.map((alert) => (
            <div className="issue" key={alert.id}>
              <div>
                <strong>{alert.projectCode}</strong>
                <p>{alert.title}</p>
                <small>{alert.message}</small>
              </div>
              <StatusBadge status={alert.severity} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
