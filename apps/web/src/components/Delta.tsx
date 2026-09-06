type DeltaProps = {
  value: number;
  className?: string;
};

export default function Delta({ value, className = "" }: DeltaProps) {
  const up = value >= 0;
  return (
    <span className={`${up ? "text-up" : "text-down"} tabular-nums ${className}`}>
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
