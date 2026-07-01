import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LogOut,
  Shield,
  UploadCloud,
  Zap
} from "lucide-react";

const ippMenu = [
  ["portfolio", "Portfolio", Building2],
  ["analytics", "IPP Analytics", Activity],
  ["project", "Project Room", Zap],
  ["wbs", "WBS Setup", ClipboardList],
  ["weekly", "EPC Weekly", UploadCloud],
  ["review", "Weekly Review", CheckCircle2],
  ["calculation", "Calculation Engine", Gauge],
  ["admin", "Administration", Shield],
  ["override", "Admin Override", Shield],
  ["cod", "COD Center", Gauge],
  ["issues", "Risk Center", AlertTriangle]
];

const epcMenu = [
  ["weekly", "Weekly Input", UploadCloud],
  ["wbs", "WBS View", ClipboardList]
];

export default function Layout({
  children,
  portal,
  profile,
  page,
  setPage,
  onLogout,
  onSwitchPortal
}) {
  const isEpc = portal === "epc";
  const menu = isEpc ? epcMenu : ippMenu;

  return (
    <div className={`app-shell ${isEpc ? "epc-shell" : "ipp-shell"}`}>
      <aside>
        <div className="brand">
          Helios CM
          <span>{isEpc ? "EPC Portal" : "IPP Control Center"}</span>
        </div>

        <div className="user-card">
          <strong>{profile?.fullName || profile?.full_name || profile?.email || "User"}</strong>
          <span>{profile?.role}</span>
          <button type="button" onClick={onLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {profile?.role === "admin" && (
          <button className="switch-button" type="button" onClick={onSwitchPortal}>
            Switch to {isEpc ? "IPP" : "EPC"}
          </button>
        )}

        <nav>
          {menu.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main>{children}</main>
    </div>
  );
}
