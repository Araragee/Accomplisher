// Roll WFH hours up against IPCR targets.
export function computeCoverage(wfhItems, targets) {
  const logged = {};
  let total = 0;
  wfhItems.forEach((w) => {
    const h = parseFloat(w.hours) || 0;
    logged[w.targetCode] = (logged[w.targetCode] || 0) + h;
    total += h;
  });

  const rows = targets.map((t) => {
    const hrs = logged[t.id] || 0;
    const required = t.requiredHours || 0;
    const progress = required > 0 ? Math.min(100, (hrs / required) * 100) : 0;
    return { ...t, logged: hrs, required, progress, met: required > 0 && hrs >= required };
  });

  const required = targets.reduce((s, t) => s + (t.requiredHours || 0), 0);
  const metCount = rows.filter((r) => r.met).length;

  return {
    rows,
    total,
    required,
    metCount,
    targetCount: targets.length,
    overallPct: required > 0 ? Math.min(100, (total / required) * 100) : 0,
    // Targets with the least coverage drive Thinker suggestions.
    deficits: rows.slice().sort((a, b) => a.progress - b.progress).filter((r) => !r.met),
  };
}
