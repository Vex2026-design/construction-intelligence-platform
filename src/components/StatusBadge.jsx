export default function StatusBadge({ status }) {
  const normalized = String(status || "NO DATA").toLowerCase().replaceAll(" ", "-");
  return <span className={`status status-${normalized}`}>{status || "NO DATA"}</span>;
}
