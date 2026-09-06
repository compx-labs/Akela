import { Route, Routes } from "react-router-dom";
import TerminalShell from "./components/TerminalShell";
import AgentsPage from "./pages/AgentsPage";
import BoardsPage from "./pages/BoardsPage";
import DashboardPage from "./pages/DashboardPage";
import FormulaPage from "./pages/FormulaPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <TerminalShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/formula" element={<FormulaPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TerminalShell>
  );
}
