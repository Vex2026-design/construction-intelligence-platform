import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import PortfolioPage from "./pages/PortfolioPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProjectPage from "./pages/ProjectPage";
import WbsPage from "./pages/WbsPage";
import WeeklyInputPage from "./pages/WeeklyInputPage";
import WeeklyReviewPage from "./pages/WeeklyReviewPage";
import CalculationPage from "./pages/CalculationPage";
import AdminPage from "./pages/AdminPage";
import AdminOverridePage from "./pages/AdminOverridePage";
import PlaceholderPage from "./pages/PlaceholderPage";
import { getIssues, getProjects, getWeeklyUpdates } from "./lib/api";
import { buildAlerts, buildProjectSnapshots } from "./lib/calculationEngine";
import { getSession, logout, portalForRole } from "./lib/auth";

export default function App() {
  const [auth, setAuth] = useState({ checked: false, user: null, profile: null });
  const [portal, setPortal] = useState("ipp");
  const [page, setPage] = useState("portfolio");
  const [projects, setProjects] = useState([]);
  const [approvedUpdates, setApprovedUpdates] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  async function refreshData() {
    const loadedProjects = await getProjects();
    const approved = await getWeeklyUpdates(null, ["Approved"]);
    const loadedIssues = await getIssues();

    setProjects(loadedProjects);
    setApprovedUpdates(approved);
    setIssues(loadedIssues);

    setSelectedProject((current) => current || loadedProjects[0] || null);
  }

  useEffect(() => {
    async function boot() {
      const session = await getSession();
      setAuth({ checked: true, user: session.user, profile: session.profile });

      if (session.profile) {
        const userPortal = portalForRole(session.profile.role);
        setPortal(userPortal);
        setPage(userPortal === "epc" ? "weekly" : "portfolio");
      }

      await refreshData();
    }

    boot();
  }, []);

  const snapshots = useMemo(
    () => buildProjectSnapshots(projects, approvedUpdates),
    [projects, approvedUpdates]
  );

  const alerts = useMemo(() => buildAlerts(snapshots), [snapshots]);

  const selectedSnapshot = useMemo(() => {
    if (!selectedProject) return snapshots[0] || null;
    return snapshots.find((project) => project.code === selectedProject.code) || snapshots[0] || null;
  }, [selectedProject, snapshots]);

  async function handleLogout() {
    await logout();
    setAuth({ checked: true, user: null, profile: null });
  }

  if (!auth.checked) return null;

  if (!auth.user) {
    return (
      <LoginPage
        onLogin={(result) => {
          const userPortal = portalForRole(result.profile.role);
          setAuth({ checked: true, ...result });
          setPortal(userPortal);
          setPage(userPortal === "epc" ? "weekly" : "portfolio");
        }}
      />
    );
  }

  return (
    <Layout
      portal={portal}
      profile={auth.profile}
      page={page}
      setPage={setPage}
      onLogout={handleLogout}
      onSwitchPortal={() => {
        const nextPortal = portal === "epc" ? "ipp" : "epc";
        setPortal(nextPortal);
        setPage(nextPortal === "epc" ? "weekly" : "portfolio");
      }}
    >
      {page === "portfolio" && (
        <PortfolioPage
          snapshots={snapshots}
          issues={[...issues, ...alerts]}
          onOpenProject={(project) => {
            setSelectedProject(project);
            setPage("project");
          }}
        />
      )}

      {page === "analytics" && <AnalyticsPage snapshots={snapshots} />}

      {page === "project" && <ProjectPage project={selectedSnapshot} setPage={setPage} />}

      {page === "wbs" && (
        <WbsPage selectedProject={selectedSnapshot} projects={projects} />
      )}

      {page === "weekly" && (
        <WeeklyInputPage selectedProject={selectedSnapshot} projects={projects} />
      )}

      {page === "review" && (
        <WeeklyReviewPage
          selectedProject={selectedSnapshot}
          projects={projects}
          refreshData={refreshData}
        />
      )}

      {page === "calculation" && (
        <CalculationPage snapshots={snapshots} alerts={alerts} refreshData={refreshData} />
      )}

      {page === "admin" && <AdminPage />}

      {page === "override" && <AdminOverridePage projects={projects} />}

      {page === "cod" && <PlaceholderPage title="COD Center" />}

      {page === "issues" && <PlaceholderPage title="Risk Center" />}
    </Layout>
  );
}
