const WIDTH = 100;
const HEIGHT = 44;
const LINE_WIDTH = 2.5;

interface SparklineProps {
  values: number[];
  color: string;
  className?: string;
}

export function Sparkline({ values, color, className }: SparklineProps) {
  if (values.length < 2) {
    const y = HEIGHT * 0.6;
    return (
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d={`M0,${y} L${WIDTH},${y}`}
          fill="none"
          stroke={color}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          strokeDasharray="4 5"
          opacity={0.3}
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const inset = LINE_WIDTH;
  const width = WIDTH - inset * 2;
  const height = HEIGHT - inset * 2;

  const points = values.map((value, index) => {
    const x = inset + (width * index) / (values.length - 1);
    const normalized = range === 0 ? 0.5 : (value - min) / range;
    const y = inset + height * (1 - normalized);
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={LINE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
        className="spark-draw"
      />
    </svg>
  );
}
