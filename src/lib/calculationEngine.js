export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

export function calculateWeightedProgress(update) {
  const quantityTotal = Number(update.quantityTotal || update.quantity_total || 0);
  const quantityCumulative = Number(update.quantityCumulative || update.qty_cumulative || 0);
  const activityProgress = quantityTotal > 0 ? quantityCumulative / quantityTotal : 0;

  const w1 = Number(update.level1Weight || update.level1_weight || 0) / 100;
  const w2 =
    update.level2Weight === null || update.level2Weight === undefined
      ? 1
      : Number(update.level2Weight || update.level2_weight || 0) / 100;
  const w3 = Number(update.activityWeight || update.activity_weight || 0) / 100;

  return clamp(activityProgress) * w1 * w2 * w3;
}

export function buildProjectSnapshots(projects, approvedUpdates) {
  return projects.map((project) => {
    const projectUpdates = approvedUpdates.filter((u) => u.projectCode === project.code);

    if (!projectUpdates.length) {
      return {
        ...project,
        hasApprovedData: false,
        actual: null,
        deltaPlanned: null,
        deltaForecast: null,
        spi: null,
        health: null,
        status: "NO APPROVED DATA"
      };
    }

    const latestByActivity = {};
    projectUpdates.forEach((u) => {
      latestByActivity[u.activityId] = u;
    });

    const actual = clamp(
      Object.values(latestByActivity).reduce(
        (sum, update) => sum + calculateWeightedProgress(update),
        0
      )
    );

    const deltaPlanned = actual - Number(project.planned || 0);
    const deltaForecast = actual - Number(project.forecast || 0);
    const spi = Number(project.planned || 0) > 0 ? actual / Number(project.planned) : null;

    let health = 100;
    if (deltaPlanned < -0.12) health -= 35;
    else if (deltaPlanned < -0.05) health -= 20;
    else if (deltaPlanned < -0.02) health -= 10;

    if (deltaForecast < -0.08) health -= 15;

    return {
      ...project,
      hasApprovedData: true,
      actual,
      deltaPlanned,
      deltaForecast,
      spi,
      health: Math.max(0, Math.min(100, Math.round(health))),
      status: deltaPlanned < -0.12 ? "CRITICAL" : deltaPlanned < -0.05 ? "ATTENTION" : "ON TRACK"
    };
  });
}

export function buildAlerts(snapshots) {
  return snapshots.flatMap((snapshot) => {
    if (!snapshot.hasApprovedData) {
      return [
        {
          id: `${snapshot.code}-no-data`,
          projectCode: snapshot.code,
          severity: "INFO",
          title: "In attesa primo Weekly approvato",
          message: "Le dashboard saranno attive dopo l'approvazione IPP."
        }
      ];
    }

    if (snapshot.deltaPlanned < -0.12) {
      return [
        {
          id: `${snapshot.code}-critical`,
          projectCode: snapshot.code,
          severity: "CRITICAL",
          title: "Progetto sotto baseline",
          message: `Delta planned ${(snapshot.deltaPlanned * 100).toFixed(1)} punti percentuali.`
        }
      ];
    }

    if (snapshot.deltaPlanned < -0.05) {
      return [
        {
          id: `${snapshot.code}-attention`,
          projectCode: snapshot.code,
          severity: "WARNING",
          title: "Progetto da attenzionare",
          message: `Delta planned ${(snapshot.deltaPlanned * 100).toFixed(1)} punti percentuali.`
        }
      ];
    }

    return [];
  });
}
