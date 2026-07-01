export default function KpiCard({ label, value, note, tone }) {
  return (
    <div className={`kpi-card ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
