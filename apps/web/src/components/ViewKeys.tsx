import { NavLink } from "react-router-dom";
import { VIEWS } from "../lib/nav";
import { toneClass } from "../lib/keyTone";

export default function ViewKeys() {
  return (
    <nav
      aria-label="Primary"
      className="flex shrink-0 flex-nowrap items-stretch gap-1 overflow-x-auto border-b border-hair bg-void px-1 py-1"
    >
      {VIEWS.map((view) => (
        <NavLink
          key={view.id}
          to={view.to}
          end={view.end}
          className={({ isActive }) =>
            [
              "group relative inline-flex h-9 min-w-[92px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
              "active:translate-y-px",
              toneClass(view.tone, isActive),
            ].join(" ")
          }
        >
          {view.label}
          <span
            aria-hidden="true"
            className="absolute right-1 top-0.5 text-[8px] font-semibold leading-none opacity-50 transition-opacity group-hover:opacity-90"
          >
            {view.hint}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
