export const projects = [
  {
    code: "V0012",
    name: "Loffreda",
    technology: "Tracker 1P",
    mwDc: 5.999,
    planned: 0.360,
    forecast: 0.360,
    actual: 0.265,
    deltaPlanned: -0.095,
    deltaForecast: -0.095,
    health: 66,
    status: "ATTENTION",
    lastSal: "26/06/2026"
  },
  {
    code: "V0015",
    name: "AtzoriLangiu",
    technology: "Tracker 2P",
    mwDc: 5.510,
    planned: 0.797,
    forecast: 0.380,
    actual: 0.291,
    deltaPlanned: -0.506,
    deltaForecast: -0.090,
    health: 52,
    status: "ATTENTION",
    lastSal: "29/05/2026"
  },
  {
    code: "V0021",
    name: "Friargiu2",
    technology: "Tracker 2P",
    mwDc: 5.590,
    planned: 0.724,
    forecast: 0.383,
    actual: 0.354,
    deltaPlanned: -0.370,
    deltaForecast: -0.029,
    health: 61,
    status: "ATTENTION",
    lastSal: "08/05/2026"
  },
  {
    code: "V0057",
    name: "Bertolin",
    technology: "Tracker 1P",
    mwDc: 11.818,
    planned: 0.673,
    forecast: 0.069,
    actual: 0.446,
    deltaPlanned: -0.227,
    deltaForecast: 0.377,
    health: 72,
    status: "ATTENTION",
    lastSal: "27/06/2026"
  }
];

export const issues = [
  {
    id: "ISS-001",
    project: "AtzoriLangiu",
    title: "Ritardo rispetto alla baseline Planned",
    owner: "IPP/EPC",
    impact: "High",
    status: "Open",
    action: "Richiedere recovery plan e aggiornamento forecast."
  },
  {
    id: "ISS-002",
    project: "Friargiu2",
    title: "Delta Planned rilevante, forecast quasi allineato",
    owner: "IPP/EPC",
    impact: "Medium",
    status: "Open",
    action: "Verificare affidabilità forecast e critical path."
  },
  {
    id: "ISS-003",
    project: "Bertolin",
    title: "Actual sopra forecast ma sotto baseline",
    owner: "IPP/EPC",
    impact: "Medium",
    status: "Open",
    action: "Riallineare baseline, forecast e curve di recupero."
  }
];

export const portfolioCurve = [
  { date: "2026-05-01", planned: 0.18, forecast: 0.12, actual: 0.09 },
  { date: "2026-05-15", planned: 0.32, forecast: 0.21, actual: 0.18 },
  { date: "2026-06-01", planned: 0.48, forecast: 0.29, actual: 0.25 },
  { date: "2026-06-15", planned: 0.62, forecast: 0.34, actual: 0.31 },
  { date: "2026-06-27", planned: 0.69, forecast: 0.38, actual: 0.36 },
  { date: "2026-07-15", planned: 0.82, forecast: 0.52, actual: null },
  { date: "2026-08-01", planned: 0.94, forecast: 0.70, actual: null }
];
