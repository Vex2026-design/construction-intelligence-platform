export const PROJECTS = [
  {
    code: "V0015",
    name: "Atzori",
    technology: "Tracker 2P",
    mwDc: 5.51,
    mwAc: 4.9,
    planned: 0.797,
    forecast: 0.38,
    cod: "2026-09-14",
    status: "NO APPROVED DATA"
  },
  {
    code: "V0021",
    name: "Friargiu",
    technology: "Tracker 2P",
    mwDc: 5.59,
    mwAc: 4.5,
    planned: 0.724,
    forecast: 0.383,
    cod: "2026-09-20",
    status: "NO APPROVED DATA"
  },
  {
    code: "V0012",
    name: "Loffreda",
    technology: "Tracker 1P",
    mwDc: 5.999,
    mwAc: 5.5,
    planned: 0.36,
    forecast: 0.36,
    cod: "2026-10-02",
    status: "NO APPROVED DATA"
  },
  {
    code: "V0057",
    name: "Bertolin",
    technology: "Tracker 1P",
    mwDc: 11.818,
    mwAc: 10.8,
    planned: 0.673,
    forecast: 0.069,
    cod: "2026-09-30",
    status: "NO APPROVED DATA"
  }
];

export const WBS_TEMPLATE = [
  ["Ingegneria", 10, "", null, "Prima Emissione PE", 20, "n°", 1, "2025-11-01", "2025-12-01"],
  ["Ingegneria", 10, "", null, "Emissione Finale PE", 10, "n°", 1, "2025-12-01", "2025-12-31"],
  ["Ingegneria", 10, "", null, "As built e fascicolo finale", 5, "n°", 1, "2026-07-30", "2026-07-30"],
  ["Procurement", 15, "", null, "Ordine Moduli", 5, "n°", 1, "2025-12-15", "2025-12-15"],
  ["Procurement", 15, "", null, "Ordine Inverter", 5, "n°", 1, "2026-01-31", "2026-01-31"],
  ["Procurement", 15, "", null, "Ordine Strutture", 15, "n°", 1, "2025-11-30", "2025-11-30"],
  ["Construction", 75, "Opere Civili", 10, "Recinzione", 15, "ml", 1310, "2026-02-09", "2026-03-03"],
  ["Construction", 75, "Opere Civili", 10, "Fondazioni cabine", 10, "n°", 4, "2026-03-30", "2026-04-24"],
  ["Construction", 75, "Opere Civili", 10, "Scavi per cavi MT/BT", 10, "ml", 823, "2026-03-23", "2026-04-10"],
  ["Construction", 75, "Opere Civili", 10, "Viabilità interna", 5, "mq", 511, "2026-04-10", "2026-05-18"],
  ["Construction", 75, "Opere Meccaniche", 30, "Battitura Pali", 40, "n°", 858, "2026-02-18", "2026-03-31"],
  ["Construction", 75, "Opere Meccaniche", 30, "Sovrastrutture tipo 1", 30, "n°", 286, "2026-03-16", "2026-05-01"],
  ["Construction", 75, "Opere Meccaniche", 30, "Montaggio Moduli", 25, "n°", 7436, "2026-04-02", "2026-06-10"],
  ["Construction", 75, "Opere Elettriche", 38, "Stringatura moduli", 10, "n°", 286, "2026-05-07", "2026-07-01"],
  ["Construction", 75, "Opere Elettriche", 38, "Montaggio e cablaggio Inverter", 10, "n°", 17, "2026-05-18", "2026-06-16"],
  ["Construction", 75, "Opere Elettriche", 38, "Stesura Cavi BT Inverter", 10, "ml", 6488, "2026-03-30", "2026-04-27"],
  ["Construction", 75, "Opere Elettriche", 38, "Stesura Cavi MT", 10, "ml", 402, "2026-04-06", "2026-04-13"],
  ["Construction", 75, "Collaudi e Commissioning", 6, "Collaudo Tracker", 20, "nr", 286, "2026-07-20", "2026-07-31"],
  ["Construction", 75, "Collaudi e Commissioning", 6, "Configurazione Inverter e monitoraggio", 10, "nr", 1, "2026-09-01", "2026-09-09"],
  ["Construction", 75, "Opere di Rete", 16, "Scavi e reinterri", 20, "ml", 2350, "2026-04-13", "2026-05-15"],
  ["Construction", 75, "Opere di Rete", 16, "TOC", 20, "ml", 380, "2026-04-30", "2026-05-17"],
  ["Construction", 75, "Opere di Rete", 16, "Stesura Cavo", 15, "ml", 2500, "2026-05-15", "2026-06-11"]
];

export const ISSUES = [
  { id: "ISS-001", projectCode: "V0015", title: "In attesa primo Weekly approvato", impact: "Info", owner: "IPP", status: "Open" },
  { id: "ISS-002", projectCode: "V0021", title: "In attesa primo Weekly approvato", impact: "Info", owner: "IPP", status: "Open" }
];

export const TREND_EMPTY = [];
