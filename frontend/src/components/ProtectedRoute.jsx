import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { token, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <div className="app-status">Loading your workspace...</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

