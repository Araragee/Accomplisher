import { lazy, Suspense } from 'react';

// Recharts is heavy (~500kB). Load it on demand so the main bundle stays light;
// only the Dashboard and History pages pull it in.
const CoverageTrendImpl = lazy(() => import('./charts').then((m) => ({ default: m.CoverageTrend })));
const WorkloadSparklineImpl = lazy(() => import('./charts').then((m) => ({ default: m.WorkloadSparkline })));

function ChartSkeleton({ height }) {
  return <div className="w-full animate-pulse rounded-lg bg-panel" style={{ height }} />;
}

export function CoverageTrend(props) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 220} />}>
      <CoverageTrendImpl {...props} />
    </Suspense>
  );
}

export function WorkloadSparkline(props) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 56} />}>
      <WorkloadSparklineImpl {...props} />
    </Suspense>
  );
}
