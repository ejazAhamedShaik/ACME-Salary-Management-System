import { Route, Routes } from "react-router";
import { EmployeeListPage } from "./pages/EmployeeListPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<EmployeeListPage />} />
    </Routes>
  );
}
