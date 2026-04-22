import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SalesOrderPage from "./pages/SalesOrderPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sales-order" element={<SalesOrderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
