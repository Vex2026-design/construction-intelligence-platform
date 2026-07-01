import { useEffect, useMemo, useState } from "react";
import ProjectSelect from "../components/ProjectSelect";
import { getWeeklyUpdates, reviewWeekly } from "../lib/api";

export default function WeeklyReviewPage({ selectedProject, projects, refreshData }) {
  const [projectCode, setProjectCode] = useState(selectedProject?.code || projects[0]?.code || "");
  const [updates, setUpdates] = useState([]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  async function load() {
    if (!projectCode) return;
    const data = await getWeeklyUpdates(projectCode, ["Submitted", "Rejected"]);
    setUpdates(data);
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  const grouped = useMemo(() => {
    return updates.reduce((acc, update) => {
      const key = `${update.projectCode} · ${update.weekStart} · ${update.status}`;
      acc[key] = acc[key] || [];
      acc[key].push(update);
      return acc;
    }, {});
  }, [updates]);

  async function review(items, action) {
    await reviewWeekly(items.map((item) => item.id), action, reason);
    setMessage(action === "approve" ? "Weekly approvato. Le dashboard IPP sono state aggiornate." : "Weekly rifiutato.");
    setReason("");
    await load();
    refreshData();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">IPP Approval Workflow</span>
          <h1>Weekly Review</h1>
          <p>Solo gli aggiornamenti approvati alimentano Analytics, Portfolio e Project Room.</p>
        </div>
        <ProjectSelect projects={projects} value={projectCode} onChange={setProjectCode} />
      </header>

      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        {Object.entries(grouped).map(([key, items]) => (
          <div className="review-card" key={key}>
            <h3>{key}</h3>
            <table>
              <thead>
                <tr>
                  <th>Attività</th>
                  <th>Prec.</th>
                  <th>Week</th>
                  <th>Cumulato</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.activity}</td>
                    <td>{item.quantityPrevious}</td>
                    <td>{item.quantityWeek}</td>
                    <td>{item.quantityCumulative}</td>
                    <td>{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <textarea
              placeholder="Motivazione rifiuto, se necessaria"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className="actions">
              <button className="primary-button" type="button" onClick={() => review(items, "approve")}>Approve</button>
              <button className="secondary-button danger" type="button" onClick={() => review(items, "reject")}>Reject</button>
            </div>
          </div>
        ))}

        {!updates.length && <p className="muted">Nessun Weekly da revisionare.</p>}
      </section>
    </div>
  );
}
