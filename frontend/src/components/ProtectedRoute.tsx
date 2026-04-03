import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";

export function ProtectedRoute() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
