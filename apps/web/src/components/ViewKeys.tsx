import { NavLink } from "react-router-dom";
import { VIEWS } from "../lib/nav";
import { toneClass } from "../lib/keyTone";

export default function ViewKeys() {
  return (
    <nav aria-label="Primary" className="flex shrink-0 items-stretch gap-1 border-b border-hair bg-void px-1 py-1">
      {VIEWS.map((view) => (
        <NavLink
          key={view.id}
          to={view.to}
          end={view.end}
          className={({ isActive }) =>
            [
              "inline-flex h-9 min-w-[92px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
              toneClass(view.tone, isActive),
            ].join(" ")
          }
        >
          {view.label}
        </NavLink>
      ))}
    </nav>
  );
}
