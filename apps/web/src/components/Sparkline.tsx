import { useId, useMemo } from "react";

type SparklineProps = {
  values: number[];
  color: string;
  className?: string;
  /** Soft gradient under the line. */
  fill?: boolean;
  /** Pulsing marker on the latest point. */
  dot?: boolean;
};

export default function Sparkline({
  values,
  color,
  className = "h-8 w-full",
  fill = true,
  dot = true,
}: SparklineProps) {
  const gradientId = useId();

  const geometry = useMemo(() => {
    if (values.length < 2) {
      return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((value, index) => ({
      x: (index / (values.length - 1)) * 100,
      y: 100 - ((value - min) / range) * 100,
    }));
    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
    const area = `${line} L100 100 L0 100 Z`;
    const last = points[points.length - 1];
    return { line, area, last };
  }, [values]);

  if (!geometry) {
    return <div className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {fill ? (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path key={`a-${geometry.area}`} d={geometry.area} fill={`url(#${gradientId})`} className="spark-area" />
          </>
        ) : null}
        <path
          key={`l-${geometry.line}`}
          d={geometry.line}
          fill="none"
          stroke={color}
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
          className="spark-line"
        />
      </svg>
      {dot ? (
        <span
          className="spark-dot"
          style={{
            left: `${geometry.last.x}%`,
            top: `${geometry.last.y}%`,
            background: color,
            ["--dot-glow" as string]: `${color}88`,
          }}
        />
      ) : null}
    </div>
  );
}
