// SVG coordinates define an internal drawing grid, not fixed layout dimensions.
const width = 100;
const height = 24;
const padding = 2;

export default function ResponseTrend({ values }) {
  if (!Array.isArray(values) || values.length < 2 || !values.every(Number.isFinite)) {
    return (
      <span className="text-xs text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No trend data</span>
      </span>
    );
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  // Include zero so small fluctuations stay visually smaller than large changes.
  const lowerBound = Math.min(0, minimum);
  const range = Math.max(0, maximum) - lowerBound;
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = maximum === minimum
      ? height / 2
      : height - padding - ((value - lowerBound) / range) * (height - padding * 2);

    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      role="img"
      aria-label={`Response trend, ${values.length} samples: ${values.join(', ')}`}
      viewBox={`0 0 ${width} ${height}`}
      className="h-6 w-24 shrink-0 text-chart-1"
    >
      <polyline points={points} fill="none" stroke="currentColor" className="stroke-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
