import { Navigate, Outlet } from "react-router-dom";

import BrandMark from "./BrandMark";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading, token } = useAuth();

  if (loading || (token && !user)) {
    return (
      <div className="page-center" role="status" aria-live="polite" aria-busy="true">
        <div className="session-loader">
          <div className="auth-brand">
            <BrandMark />
            <div>
              <p className="auth-brand-name">InternRoute</p>
              <p className="auth-brand-tag">student career kit</p>
            </div>
          </div>
          <p className="session-loader-title">Opening your desk</p>
          <p className="muted session-loader-copy">Loading your session…</p>
          <div className="session-loader-pulse" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
