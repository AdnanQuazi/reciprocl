// SVG coordinates define an internal drawing grid, not fixed layout dimensions.
const width = 100;
const height = 24;
const padding = 2;

export default function ResponseTrend({ values }: { values: readonly number[] | null }) {
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

    return { x, y };
  });
  const midpoints = points.slice(1).map((point, index) => ({
    x: (points[index].x + point.x) / 2,
    y: (points[index].y + point.y) / 2,
  }));
  const lastPoint = points[points.length - 1];
  const path = [
    `M ${points[0].x} ${points[0].y}`,
    ...midpoints.map((point, index) => `Q ${points[index].x} ${points[index].y} ${point.x} ${point.y}`),
    `Q ${lastPoint.x} ${lastPoint.y} ${lastPoint.x} ${lastPoint.y}`,
  ].join(' ');

  return (
    <svg
      role="img"
      aria-label={`Response trend, ${values.length} samples: ${values.join(', ')}`}
      viewBox={`0 0 ${width} ${height}`}
      className="h-6 w-24 shrink-0 text-chart-1"
    >
      <path d={path} fill="none" stroke="currentColor" className="stroke-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
