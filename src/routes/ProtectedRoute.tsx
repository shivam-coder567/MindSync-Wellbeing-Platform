import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="auth-loading">Loading your wellbeing space…</div>;
  return session ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
