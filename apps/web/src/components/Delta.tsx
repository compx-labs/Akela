type DeltaProps = {
  value: number;
  className?: string;
  /** Lead with ▲ / ▼ instead of a sign. */
  arrow?: boolean;
  /** Inherit the parent colour (e.g. on a selected amber row) instead of green/red. */
  inherit?: boolean;
};

export default function Delta({ value, className = "", arrow = true, inherit = false }: DeltaProps) {
  const up = value >= 0;
  const magnitude = Math.abs(value).toFixed(1);
  const tone = inherit ? "" : up ? "text-up" : "text-down";
  return (
    <span className={`${tone} tabular-nums ${className}`}>
      {arrow ? (
        <>
          <span aria-hidden="true" className="mr-px text-[0.8em]">
            {up ? "▲" : "▼"}
          </span>
          <span className="sr-only">{up ? "up " : "down "}</span>
          {magnitude}%
        </>
      ) : (
        <>
          {up ? "+" : "-"}
          {magnitude}%
        </>
      )}
    </span>
  );
}
