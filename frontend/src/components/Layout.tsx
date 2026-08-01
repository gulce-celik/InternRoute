import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import BrandMark from "./BrandMark";
import DeskBuddy from "./DeskBuddy";
import MotivationTicker from "./MotivationTicker";
import SceneBackdrop from "./SceneBackdrop";
import { useAuth } from "../hooks/useAuth";

type NavMenuId = "workspace" | "prep";

const workspaceNav = [
  { to: "/jobs", label: "Board", end: false, tour: "nav-board" },
  { to: "/cvs", label: "CVs", end: false, tour: "nav-cvs" },
  { to: "/applications", label: "Pipeline", end: false, tour: "nav-pipeline" },
] as const;

const prepNav = [
  { to: "/analyze", label: "Analyze", end: false },
  { to: "/cover-letter", label: "Letters", end: false },
  { to: "/interview", label: "Interview", end: false },
] as const;

const HOVER_MQ = "(hover: hover) and (pointer: fine)";

function pathMatches(pathname: string, to: string, end: boolean) {
  if (end) {
    return pathname === to;
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function categoryIsActive(pathname: string, items: readonly { to: string; end: boolean }[]) {
  return items.some((item) => pathMatches(pathname, item.to, item.end));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<NavMenuId | null>(null);
  const [hoverMenus, setHoverMenus] = useState(
    () => typeof window !== "undefined" && window.matchMedia(HOVER_MQ).matches,
  );
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const workspaceMenuId = useId();
  const prepMenuId = useId();

  const workspaceActive = categoryIsActive(location.pathname, workspaceNav);
  const prepActive = categoryIsActive(location.pathname, prepNav);

  function clearCloseTimer() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    if (!hoverMenus) {
      return;
    }
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpenMenu(null);
      closeTimer.current = null;
    }, 120);
  }

  function openCategory(id: NavMenuId) {
    clearCloseTimer();
    setOpenMenu(id);
  }

  function toggleCategory(id: NavMenuId) {
    clearCloseTimer();
    setOpenMenu((current) => (current === id ? null : id));
  }

  function onCategoryClick(id: NavMenuId) {
    if (hoverMenus) {
      openCategory(id);
      return;
    }
    toggleCategory(id);
  }

  useEffect(() => {
    const media = window.matchMedia(HOVER_MQ);
    const sync = () => setHoverMenus(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      clearCloseTimer();
    };
  }, []);

  return (
    <div className="app-shell">
      <SceneBackdrop />
      <MotivationTicker />

      <header className="topbar">
        <div className="topbar-start">
          <BrandMark />
          <div className="brand-copy">
            <span className="brand-name">InternRoute</span>
            <span className="brand-tag">student career kit</span>
          </div>
        </div>

        <nav className="topnav" aria-label="Main" ref={navRef}>
          <NavLink
            to="/"
            end
            data-tour="nav-home"
            className={({ isActive }) => `topnav-link${isActive ? " topnav-link--active" : ""}`}
          >
            Home
          </NavLink>

          <NavLink
            to="/calendar"
            end={false}
            data-tour="nav-calendar"
            className={({ isActive }) => `topnav-link${isActive ? " topnav-link--active" : ""}`}
          >
            Calendar
          </NavLink>

          <div
            className={`topnav-category${openMenu === "workspace" ? " topnav-category--open" : ""}${
              workspaceActive ? " topnav-category--active" : ""
            }`}
            onMouseEnter={hoverMenus ? () => openCategory("workspace") : undefined}
            onMouseLeave={hoverMenus ? scheduleClose : undefined}
          >
            <button
              type="button"
              className="topnav-category-trigger"
              data-tour="nav-workspace"
              aria-expanded={openMenu === "workspace"}
              aria-controls={workspaceMenuId}
              aria-haspopup="menu"
              onClick={() => onCategoryClick("workspace")}
            >
              Workspace
              <span className="topnav-category-caret" aria-hidden="true" />
            </button>
            <div
              id={workspaceMenuId}
              className="topnav-dropdown"
              role="menu"
              hidden={openMenu !== "workspace"}
            >
              {workspaceNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  role="menuitem"
                  data-tour={item.tour}
                  className={({ isActive }) =>
                    `topnav-dropdown-link${isActive ? " topnav-dropdown-link--active" : ""}`
                  }
                  onClick={() => setOpenMenu(null)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div
            className={`topnav-category${openMenu === "prep" ? " topnav-category--open" : ""}${
              prepActive ? " topnav-category--active" : ""
            }`}
            onMouseEnter={hoverMenus ? () => openCategory("prep") : undefined}
            onMouseLeave={hoverMenus ? scheduleClose : undefined}
          >
            <button
              type="button"
              className="topnav-category-trigger"
              data-tour="nav-ai"
              aria-expanded={openMenu === "prep"}
              aria-controls={prepMenuId}
              aria-haspopup="menu"
              onClick={() => onCategoryClick("prep")}
            >
              Get Ready with AI
              <span className="topnav-category-caret" aria-hidden="true" />
            </button>
            <div
              id={prepMenuId}
              className="topnav-dropdown"
              role="menu"
              hidden={openMenu !== "prep"}
            >
              {prepNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  role="menuitem"
                  className={({ isActive }) =>
                    `topnav-dropdown-link${isActive ? " topnav-dropdown-link--active" : ""}`
                  }
                  onClick={() => setOpenMenu(null)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="topbar-end">
          <div className="user-chip">
            <span className="user-chip-label">Hey,</span>
            <span className="user-chip-name">{user?.full_name ?? user?.email}</span>
          </div>
          <NavLink
            to="/profile"
            data-tour="nav-profile"
            className={({ isActive }) => `btn-profile${isActive ? " btn-profile--active" : ""}`}
          >
            Profile
          </NavLink>
          <button type="button" className="btn-ghost" data-tour="nav-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>

      <DeskBuddy />
    </div>
  );
}
