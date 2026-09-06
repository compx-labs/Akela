export type ViewId = "home" | "boards" | "agents" | "formula" | "register";

export type ViewTone = "amber" | "orange" | "green" | "cyan" | "white";

export type ViewDef = {
  id: ViewId;
  to: string;
  label: string;
  hint: string;
  tone: ViewTone;
  end: boolean;
};

export const VIEWS: ViewDef[] = [
  { id: "home", to: "/", label: "HOME", hint: "F2", tone: "amber", end: true },
  { id: "boards", to: "/boards", label: "BOARDS", hint: "F3", tone: "orange", end: false },
  { id: "agents", to: "/agents", label: "AGENTS", hint: "F4", tone: "green", end: false },
  { id: "formula", to: "/formula", label: "FORMULA", hint: "F5", tone: "cyan", end: false },
  { id: "register", to: "/register", label: "REGISTER", hint: "F6", tone: "white", end: false },
];

export const HINTS = ["F1 HELP", "F2 HOME", "F3 BOARDS", "F4 AGENTS", "F5 FORMULA", "F6 REGISTER"] as const;

export function viewByPath(pathname: string): ViewDef {
  const exact = VIEWS.find((view) => view.to === pathname);
  if (exact) {
    return exact;
  }
  return VIEWS.find((view) => view.to !== "/" && pathname.startsWith(view.to)) ?? VIEWS[0];
}
