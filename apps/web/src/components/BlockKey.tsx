import type { ViewTone } from "../lib/nav";
import { TONE } from "../lib/keyTone";

type BlockKeyProps = {
  tone: ViewTone;
  active?: boolean;
  children: string;
  className?: string;
} & (
  | { as?: "button"; onClick?: () => void; type?: "button" | "submit" }
  | { as: "span" }
);

export default function BlockKey({
  tone,
  active = false,
  children,
  className = "",
  ...rest
}: BlockKeyProps) {
  const palette = TONE[tone];
  const cls = [
    "inline-flex h-9 min-w-[92px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
    active ? palette.active : palette.idle,
    className,
  ].join(" ");

  if (rest.as === "span") {
    return <span className={cls}>{children}</span>;
  }

  return (
    <button type={rest.type ?? "button"} onClick={rest.onClick} className={cls}>
      {children}
    </button>
  );
}
