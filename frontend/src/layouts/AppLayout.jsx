
import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contractors", label: "Contractors", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNav = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/document-rules", label: "Document rules", icon: FileCheck2 },
  { to: "/audit-log", label: "Audit log", icon: FileText },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);

  const getPageName = () => {
    const path = location.pathname;

    if (path === "/dashboard" || path === "/") return "Dashboard";
    if (path === "/contractors") return "Contractors";
    if (path.includes("/upload")) return "Upload document";
    if (path.startsWith("/contractors/")) return "Contractor details";
    if (path === "/reports") return "Reports";
    if (path === "/settings") return "Settings";
    if (path === "/document-rules") return "Document rules";
    if (path === "/audit-log") return "Audit log";
    return "Compliance workspace";
  };

  const handleLogout = () => {
    // Connect this to AuthContext when real authentication is implemented.
    navigate("/login");
    closeMenu();
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <NavLink
          to="/dashboard"
          className="brand"
          onClick={closeMenu}
          aria-label="ComplyTrack home"
        >
          <img src="/logo.webp" alt="ComplyTrack" />
        </NavLink>
        

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-section-label">Workspace</div>

          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="nav-section-label">Administration</div>

          <NavLink
            to="/contractors"
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Building2 size={18} />
            <span>Contractor records</span>
          </NavLink>

          {adminNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">TN</div>

          <div className="sidebar-profile-details">
            <strong>Thandi Nkosi</strong>
            <span>Compliance Officer</span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={17} />
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
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="breadcrumb">
            <NavLink to="/dashboard">ComplyTrack</NavLink>
            <span>/</span>
            <span>{getPageName()}</span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => navigate("/dashboard")}
            >
              <Bell size={18} />
            </button>

            <div className="topbar-user" title="Thandi Nkosi">
              TN
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
