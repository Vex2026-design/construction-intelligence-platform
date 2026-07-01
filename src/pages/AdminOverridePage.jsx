import { useEffect, useState } from "react";
import ProjectSelect from "../components/ProjectSelect";
import { adminOverride, getWeeklyUpdates } from "../lib/api";

export default function AdminOverridePage({ projects }) {
  const [projectCode, setProjectCode] = useState(projects[0]?.code || "");
  const [updates, setUpdates] = useState([]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!projectCode) return;
    const data = await getWeeklyUpdates(projectCode);
    setUpdates(data);
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  function updateRow(id, field, value) {
    setUpdates((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  async function save(row) {
    await adminOverride(
      row.id,
      {
        quantityPrevious: Number(row.quantityPrevious || 0),
        quantityWeek: Number(row.quantityWeek || 0),
        quantityCumulative: Number(row.quantityCumulative || 0),
        progressPct: Number(row.progressPct || 0),
        notes: row.notes || "",
        status: row.status
      },
      reason
    );
    setMessage("Override salvato con audit log.");
    setReason("");
    await load();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin Console</span>
          <h1>Weekly Override</h1>
          <p>Correzione amministrativa post approvazione con motivazione obbligatoria.</p>
        </div>
        <ProjectSelect projects={projects} value={projectCode} onChange={setProjectCode} />
      </header>

      {message && <div className="alert success">{message}</div>}

      <section className="panel table-panel">
        <label className="reason-box">
          Motivazione override
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>

        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Attività</th>
              <th>Status</th>
              <th>Prec.</th>
              <th>Week</th>
              <th>Cumulato</th>
              <th>Progress</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {updates.map((row) => (
              <tr key={row.id}>
                <td>{row.weekStart}</td>
                <td>{row.activity}</td>
                <td>
                  <select value={row.status} onChange={(event) => updateRow(row.id, "status", event.target.value)}>
                    <option>Submitted</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </td>
                <td><input type="number" value={row.quantityPrevious} onChange={(event) => updateRow(row.id, "quantityPrevious", event.target.value)} /></td>
                <td><input type="number" value={row.quantityWeek} onChange={(event) => updateRow(row.id, "quantityWeek", event.target.value)} /></td>
                <td><input type="number" value={row.quantityCumulative} onChange={(event) => updateRow(row.id, "quantityCumulative", event.target.value)} /></td>
                <td><input type="number" step="0.01" value={row.progressPct} onChange={(event) => updateRow(row.id, "progressPct", event.target.value)} /></td>
                <td><input value={row.notes || ""} onChange={(event) => updateRow(row.id, "notes", event.target.value)} /></td>
                <td><button className="primary-button" type="button" onClick={() => save(row)}>Override</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {!updates.length && <p className="muted">Nessun Weekly presente per questo progetto.</p>}
      </section>
    </div>
  );
}
