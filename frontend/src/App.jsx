
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contractors from "./pages/Contractors";
import ContractorDetails from "./pages/ContractorDetails";
import UploadDocument from "./pages/UploadDocument";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DocumentRules from "./pages/DocumentRules";
import AuditLog from "./pages/AuditLog";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route
          path="/contractors/:id"
          element={<ContractorDetails />}
        />
        <Route
          path="/contractors/:id/upload"
          element={<UploadDocument />}
        />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/document-rules"
          element={<DocumentRules />}
        />
        <Route path="/audit-log" element={<AuditLog />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
