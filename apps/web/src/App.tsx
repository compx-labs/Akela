import { Route, Routes } from "react-router-dom";
import TerminalShell from "./components/TerminalShell";
import MarksProvider from "./context/MarksProvider";
import AgentsPage from "./pages/AgentsPage";
import BoardsPage from "./pages/BoardsPage";
import DashboardPage from "./pages/DashboardPage";
import FormulaPage from "./pages/FormulaPage";
import GraphPage from "./pages/GraphPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <MarksProvider>
      <TerminalShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/formula" element={<FormulaPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </TerminalShell>
    </MarksProvider>
  );
}
