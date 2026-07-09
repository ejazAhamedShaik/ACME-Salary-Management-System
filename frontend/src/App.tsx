import { Route, Routes } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { InsightsPage } from "./pages/InsightsPage";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<EmployeeListPage />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Routes>
    </AppLayout>
  );
}
