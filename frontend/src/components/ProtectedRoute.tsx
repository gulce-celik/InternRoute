import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading, token } = useAuth();

  if (loading || (token && !user)) {
    return (
      <div className="page-center">
        <p className="muted">Loading your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
