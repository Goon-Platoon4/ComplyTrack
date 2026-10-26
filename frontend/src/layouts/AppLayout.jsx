import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  Bell,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const workspaceNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/contractors", label: "Contractors", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNav = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/document-rules", label: "Document rules", icon: FileCheck2 },
  { to: "/audit-log", label: "Audit log", icon: FileText },
];

function getPageName(pathname) {
  if (pathname === "/dashboard" || pathname === "/") return "Dashboard";
  if (pathname === "/contractors") return "Contractors";
  if (pathname.includes("/upload")) return "Upload document";
  if (pathname.startsWith("/contractors/")) return "Contractor details";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/document-rules") return "Document rules";
  if (pathname === "/audit-log") return "Audit log";
  return "Compliance workspace";
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function closeMenu() {
    setOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
    closeMenu();
  }

  function renderNavLink({ to, label, icon: Icon, end }) {
    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={closeMenu}
        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    );
  }

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Application sidebar"
      >
        <NavLink
          to="/dashboard"
          className="brand"
          onClick={closeMenu}
          aria-label="ComplyTrack home"
        >
          <img src="/logo.webp" alt="ComplyTrack" className="sidebar-logo" />
        </NavLink>

        <nav
          id="main-navigation"
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          <div className="nav-section-label">Workspace</div>
          {workspaceNav.map(renderNavLink)}

          <div className="nav-section-label">Administration</div>
          {adminNav.map(renderNavLink)}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar" aria-hidden="true">
            {user?.initials || "CT"}
          </div>
          <div className="profile-details">
            <strong>{user?.name || "ComplyTrack user"}</strong>
            <span>{user?.role || "Member"}</span>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={handleSignOut}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeMenu}
          aria-label="Close navigation menu"
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="breadcrumb">
            <NavLink to="/dashboard">ComplyTrack</NavLink>
            <span>/</span>
            <span aria-current="page">{getPageName(location.pathname)}</span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Go to dashboard"
              title="Notifications"
              onClick={() => navigate("/dashboard")}
            >
              <Bell size={18} aria-hidden="true" />
            </button>

            <div className="topbar-user" title={user?.name || "ComplyTrack user"}>
              {user?.initials || "CT"}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
