import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contractors from "./pages/Contractors";
import ContractorDetails from "./pages/ContractorDetails";
import UploadDocument from "./pages/UploadDocument";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/contractors/:id" element={<ContractorDetails />} />
        <Route path="/contractors/:id/upload" element={<UploadDocument />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
