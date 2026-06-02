import React, { lazy, Suspense } from 'react';

// Recharts is heavy (~500kB). Load it on demand so the main bundle stays light;
// only the Dashboard and History pages pull it in.
const CoverageTrendImpl = lazy(() => import('./charts').then((m) => ({ default: m.CoverageTrend })));
const WorkloadSparklineImpl = lazy(() => import('./charts').then((m) => ({ default: m.WorkloadSparkline })));

interface ChartSkeletonProps {
  height: number;
}

function ChartSkeleton({ height }: ChartSkeletonProps): React.JSX.Element {
  return <div className="w-full animate-pulse rounded-lg bg-panel" style={{ height }} />;
}

export interface CoverageTrendProps {
  data: Array<{ label: string; coverage: number }>;
  height?: number;
}

export function CoverageTrend(props: CoverageTrendProps): React.JSX.Element {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 220} />}>
      <CoverageTrendImpl {...props} />
    </Suspense>
  );
}

export interface WorkloadSparklineProps {
  data: Array<{ label: string; hours: number }>;
  height?: number;
}

export function WorkloadSparkline(props: WorkloadSparklineProps): React.JSX.Element {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 56} />}>
      <WorkloadSparklineImpl {...props} />
    </Suspense>
  );
}
