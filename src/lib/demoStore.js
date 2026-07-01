const KEY = "helios_enterprise_demo_state";

const defaultState = {
  weeklyUpdates: [],
  wbsByProject: {},
  users: [
    { id: "u-1", fullName: "Ugo Ricciardi", email: "ugo@ipp.it", role: "admin", company: "IPP", active: true },
    { id: "u-2", fullName: "EPC Demo", email: "epc@demo.it", role: "epc_pm", company: "EPC", active: true }
  ],
  auditLog: []
};

export function readDemoState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaultState;
  }
}

export function writeDemoState(nextState) {
  localStorage.setItem(KEY, JSON.stringify(nextState));
}

export function resetDemoState() {
  localStorage.removeItem(KEY);
}
