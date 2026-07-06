import { Route, Routes } from "react-router";
import { DirectoryPlaceholderPage } from "./pages/DirectoryPlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DirectoryPlaceholderPage />} />
    </Routes>
  );
}
