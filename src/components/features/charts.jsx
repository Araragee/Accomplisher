import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Recharts colors use CSS custom properties (var(--accent), etc.) so they swap
// automatically in dark mode. Calm styling: no legends, hairline grid.

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs shadow-soft">
      <div className="text-subtle">{label}</div>
      <div className="font-medium tabular-nums text-ink">
        {payload[0].value}
        {suffix}
      </div>
    </div>
  );
}

// data: [{ label, hours }]
export function WorkloadSparkline({ data, height = 56 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id="acc-sparkline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<ChartTooltip suffix="h" />} cursor={{ stroke: 'var(--line-strong)' }} />
        <Area type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={2} fill="url(#acc-sparkline)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// data: [{ label, coverage }] coverage 0-100
export function CoverageTrend({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--subtle)', fontSize: 11 }} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--subtle)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: 'var(--line-strong)' }} />
        <Line
          type="monotone"
          dataKey="coverage"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
