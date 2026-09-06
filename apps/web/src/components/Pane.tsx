import type { ReactNode } from "react";

type PaneProps = {
  title: string;
  titleClass?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Pane({ title, titleClass = "text-label", meta, children, className = "" }: PaneProps) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col border border-hair bg-panel ${className}`}>
      <header className="flex h-5 shrink-0 items-center justify-between gap-2 border-b border-hair px-2">
        <h2 className={`truncate text-[10px] font-semibold uppercase tracking-wider ${titleClass}`}>{title}</h2>
        {meta ? <div className="shrink-0 text-[10px] text-muted">{meta}</div> : null}
      </header>
      <div className="min-h-0 flex-1 px-2 py-1">{children}</div>
    </section>
  );
}
