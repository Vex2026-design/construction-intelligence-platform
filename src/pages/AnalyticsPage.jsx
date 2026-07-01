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

const pct = (value) => `${((value || 0) * 100).toFixed(1)}%`;
const signedPct = (value) => `${value >= 0 ? "+" : ""}${((value || 0) * 100).toFixed(1)}%`;

export default function AnalyticsPage({ snapshots }) {
  const approved = snapshots.filter((project) => project.hasApprovedData);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">IPP Analytics</span>
          <h1>Control Room</h1>
          <p>Analisi e grafici basati esclusivamente su dati approvati.</p>
        </div>
      </header>

      <section className="panel">
        <h2>Approved actual vs baseline</h2>
        {approved.length ? (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={snapshots} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,.10)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} stroke="#91a8c7" />
              <YAxis dataKey="name" type="category" stroke="#91a8c7" width={110} />
              <Tooltip formatter={(value) => pct(value)} contentStyle={{ background: "#101c2f", border: "1px solid #2a4366", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill="#55d7ff" />
              <Bar dataKey="forecast" name="Forecast" fill="#ffb020" />
              <Bar dataKey="actual" name="Approved Actual" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Analytics non disponibile: serve almeno un Weekly approvato." />
        )}
      </section>

      <section className="panel">
        <h2>Delta Control</h2>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Approved Actual</th>
              <th>Planned</th>
              <th>Forecast</th>
              <th>Δ Planned</th>
              <th>Δ Forecast</th>
              <th>SPI</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((project) => (
              <tr key={project.code}>
                <td>{project.code} · {project.name}</td>
                <td>{project.hasApprovedData ? pct(project.actual) : "—"}</td>
                <td>{pct(project.planned)}</td>
                <td>{pct(project.forecast)}</td>
                <td className={project.deltaPlanned < 0 ? "negative" : "positive"}>
                  {project.hasApprovedData ? signedPct(project.deltaPlanned) : "—"}
                </td>
                <td className={project.deltaForecast < 0 ? "negative" : "positive"}>
                  {project.hasApprovedData ? signedPct(project.deltaForecast) : "—"}
                </td>
                <td>{project.spi ? project.spi.toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
