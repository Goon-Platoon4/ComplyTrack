import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loading" role="status">
        Loading your secure workspace…
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (
    user.role === "Administrator" &&
    !user.mfaEnabled &&
    location.pathname !== "/mfa-setup"
  )
    return <Navigate to="/mfa-setup" replace />;
  return <Outlet />;
}
