import { Link } from "react-router-dom";
import Pane from "../components/Pane";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-0 flex-1">
      <Pane title="404" titleClass="text-down" meta="missing" className="flex-1">
        <p className="text-fg">That route is not in the terminal.</p>
        <Link
          to="/"
          className="mt-3 inline-flex h-8 items-center border border-amber bg-void px-3 text-[11px] font-bold uppercase text-amber hover:bg-amber hover:text-amber-ink"
        >
          Home
        </Link>
      </Pane>
    </div>
  );
}
