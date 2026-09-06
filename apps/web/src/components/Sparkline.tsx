type SparklineProps = {
  values: number[];
  color: string;
  className?: string;
};

export default function Sparkline({ values, color, className = "h-8 w-full" }: SparklineProps) {
  if (values.length < 2) {
    return <div className={className} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
