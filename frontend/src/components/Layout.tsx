import { NavLink, Outlet } from "react-router-dom";

import MotivationTicker from "./MotivationTicker";
import SceneBackdrop from "./SceneBackdrop";
import { useAuth } from "../hooks/useAuth";

const coreNav = [
  { to: "/", label: "Home", end: true },
  { to: "/jobs", label: "Board", end: false },
  { to: "/cvs", label: "CVs", end: false, soon: "2" as const },
  { to: "/applications", label: "Pipeline", end: false },
] as const;

const aiNav = [
  { to: "/analyze", label: "Analyze", soon: "3" as const },
  { to: "/interview", label: "Interview", soon: "3" as const },
  { to: "/cover-letter", label: "Letters", soon: "3" as const },
] as const;

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <SceneBackdrop />
      <MotivationTicker />

      <header className="topbar">
        <div className="topbar-start">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-arrow">→</span>
          </div>
          <div className="brand-copy">
            <span className="brand-name">InternRoute</span>
            <span className="brand-tag">student career kit</span>
          </div>
        </div>

        <nav className="topnav" aria-label="Main">
          {coreNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `topnav-link${isActive ? " topnav-link--active" : ""}${"soon" in item ? " topnav-link--soon" : ""}`
              }
            >
              {item.label}
              {"soon" in item && item.soon ? (
                <span className="nav-sprint-tag">S{item.soon}</span>
              ) : null}
            </NavLink>
          ))}

          <span className="topnav-divider" aria-hidden="true" />

          {aiNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={false}
              className={({ isActive }) =>
                `topnav-link topnav-link--ai${isActive ? " topnav-link--active" : ""} topnav-link--soon`
              }
            >
              {item.label}
              <span className="nav-sprint-tag">S{item.soon}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar-end">
          <div className="user-chip">
            <span className="user-chip-label">Hey,</span>
            <span className="user-chip-name">{user?.full_name ?? user?.email}</span>
          </div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `btn-profile${isActive ? " btn-profile--active" : ""}`}
          >
            Profile
          </NavLink>
          <button type="button" className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
