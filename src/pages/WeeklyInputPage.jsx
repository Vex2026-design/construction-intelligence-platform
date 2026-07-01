import { useEffect, useState } from "react";
import ProjectSelect from "../components/ProjectSelect";
import { getWbs, submitWeekly } from "../lib/api";

const pct = (value) => `${((value || 0) * 100).toFixed(1)}%`;

export default function WeeklyInputPage({ selectedProject, projects }) {
  const [projectCode, setProjectCode] = useState(selectedProject?.code || projects[0]?.code || "");
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  async function load() {
    if (!projectCode) return;
    const data = await getWbs(projectCode);
    setRows(data.map((row) => ({ ...row, quantityPrevious: 0, quantityWeek: 0, notes: "" })));
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  function updateRow(id, field, value) {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  async function submit() {
    await submitWeekly(projectCode, weekStart, rows);
    setMessage("Weekly inviato al PM IPP per approvazione.");
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">EPC Portal</span>
          <h1>Weekly Input</h1>
          <p>L'EPC compila quantità settimanali. I dati non diventano ufficiali finché il PM IPP non approva.</p>
        </div>
        <div className="actions">
          <ProjectSelect projects={projects} value={projectCode} onChange={setProjectCode} />
          <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
          <button className="primary-button" type="button" onClick={submit}>Submit</button>
        </div>
      </header>

      {message && <div className="alert success">{message}</div>}

      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Attività</th>
              <th>UM</th>
              <th>Qty totale</th>
              <th>Qty prec.</th>
              <th>Qty settimana</th>
              <th>Cumulato</th>
              <th>%</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const total = Number(row.quantityTotal || 0);
              const previous = Number(row.quantityPrevious || 0);
              const week = Number(row.quantityWeek || 0);
              const cumulative = Math.min(total, previous + week);
              const progress = total > 0 ? cumulative / total : 0;

              return (
                <tr key={row.id}>
                  <td>{row.activity}</td>
                  <td>{row.unit}</td>
                  <td><input type="number" value={row.quantityTotal} onChange={(event) => updateRow(row.id, "quantityTotal", event.target.value)} /></td>
                  <td><input type="number" value={row.quantityPrevious} onChange={(event) => updateRow(row.id, "quantityPrevious", event.target.value)} /></td>
                  <td><input type="number" value={row.quantityWeek} onChange={(event) => updateRow(row.id, "quantityWeek", event.target.value)} /></td>
                  <td>{cumulative.toLocaleString("it-IT")}</td>
                  <td>{pct(progress)}</td>
                  <td><input value={row.notes} onChange={(event) => updateRow(row.id, "notes", event.target.value)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
