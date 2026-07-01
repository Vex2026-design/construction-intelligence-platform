import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProjectSelect from "../components/ProjectSelect";
import { getWbs, saveWbsActivity } from "../lib/api";

function buildTree(rows) {
  const tree = {};
  rows.forEach((row) => {
    const l1 = row.level1 || "Altro";
    const l2 = row.level2 || "Attività dirette";
    tree[l1] = tree[l1] || { weight: row.level1Weight, children: {} };
    tree[l1].children[l2] = tree[l1].children[l2] || { weight: row.level2Weight, activities: [] };
    tree[l1].children[l2].activities.push(row);
  });
  return tree;
}

export default function WbsPage({ selectedProject, projects }) {
  const [projectCode, setProjectCode] = useState(selectedProject?.code || projects[0]?.code || "");
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState({});
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selectedProject?.code) setProjectCode(selectedProject.code);
  }, [selectedProject]);

  async function load() {
    if (!projectCode) return;
    const data = await getWbs(projectCode);
    setRows(data);
    setSelected(data[0] || null);
  }

  useEffect(() => {
    load();
  }, [projectCode]);

  const tree = useMemo(() => buildTree(rows), [rows]);

  function startNew() {
    setForm({
      projectCode,
      level1: "Construction",
      level1Weight: 75,
      level2: "Opere Civili",
      level2Weight: 10,
      activity: "",
      activityWeight: 0,
      unit: "n°",
      quantityTotal: 0,
      plannedStart: "",
      plannedFinish: "",
      active: true
    });
  }

  function startEdit(activity) {
    setForm(activity);
  }

  async function save() {
    await saveWbsActivity(form);
    setMessage("WBS salvata.");
    setForm(null);
    await load();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">WBS Engine</span>
          <h1>WBS Setup</h1>
          <p>Ogni progetto ha WBS, quantità, pesi e date indipendenti.</p>
        </div>
        <div className="actions">
          <ProjectSelect projects={projects} value={projectCode} onChange={setProjectCode} />
          <button className="primary-button" type="button" onClick={startNew}>
            <Plus size={16} />
            Aggiungi attività
          </button>
        </div>
      </header>

      {message && <div className="alert success">{message}</div>}

      {form && (
        <section className="panel form-panel">
          <h2>{form.id ? "Modifica attività" : "Nuova attività"}</h2>
          {[
            ["level1", "Livello 1"],
            ["level1Weight", "Peso L1 %"],
            ["level2", "Livello 2"],
            ["level2Weight", "Peso L2 %"],
            ["activity", "Attività"],
            ["activityWeight", "Peso attività %"],
            ["unit", "U.M."],
            ["quantityTotal", "Quantità totale"],
            ["plannedStart", "Inizio planned"],
            ["plannedFinish", "Fine planned"]
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type={key.includes("Weight") || key.includes("quantity") || key.includes("Quantity") ? "number" : key.includes("planned") || key.includes("Planned") ? "date" : "text"}
                value={form[key] || ""}
                onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}
              />
            </label>
          ))}
          <button className="primary-button" type="button" onClick={save}>Salva attività</button>
        </section>
      )}

      <div className="split-grid">
        <section className="panel">
          <h2>WBS Tree</h2>
          <div className="wbs-tree">
            {Object.entries(tree).map(([l1, node]) => (
              <div className="tree-node" key={l1}>
                <button type="button" onClick={() => setOpen((previous) => ({ ...previous, [l1]: !(previous[l1] ?? true) }))}>
                  {(open[l1] ?? true) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>{l1}</strong>
                  <span>{node.weight}%</span>
                </button>
                {(open[l1] ?? true) &&
                  Object.entries(node.children).map(([l2, child]) => (
                    <div className="tree-child" key={l2}>
                      <h4>{l2}{child.weight ? ` · ${child.weight}%` : ""}</h4>
                      {child.activities.map((activity) => (
                        <button
                          className="activity-row"
                          key={activity.id}
                          type="button"
                          onClick={() => setSelected(activity)}
                        >
                          {activity.activity}
                          <small>{activity.unit} · {Number(activity.quantityTotal || 0).toLocaleString("it-IT")} · peso {activity.activityWeight}%</small>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Activity Detail</h2>
          {selected && (
            <div className="activity-detail">
              <h3>{selected.activity}</h3>
              <p>{selected.level1} / {selected.level2}</p>
              <div className="mini-kpis">
                <div><span>Qty</span><strong>{selected.quantityTotal} {selected.unit}</strong></div>
                <div><span>Peso</span><strong>{selected.activityWeight}%</strong></div>
                <div><span>Start</span><strong>{selected.plannedStart || "—"}</strong></div>
                <div><span>Finish</span><strong>{selected.plannedFinish || "—"}</strong></div>
              </div>
              <button className="primary-button" type="button" onClick={() => startEdit(selected)}>Modifica</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
