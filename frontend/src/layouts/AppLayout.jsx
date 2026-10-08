import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Bell, Building2, FileCheck2, FileText, LayoutDashboard, LogOut, Settings, Users, BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contractors", label: "Contractors", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNav = [
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <img src="/logo.svg" alt="ComplyTrack" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="nav-section-label">Administration</div>
          <NavLink to="/contractors" className={`nav-link ${location.pathname.includes("/contractors") ? "active" : ""}`} onClick={() => setOpen(false)}>
            <Building2 size={18} />
            <span>Contractor records</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setOpen(false)}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <div className="nav-link disabled">
            <FileCheck2 size={18} />
            <span>Document rules</span>
            <span className="soon">Soon</span>
          </div>
          <div className="nav-link disabled">
            <FileText size={18} />
            <span>Audit log</span>
            <span className="soon">Soon</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">TN</div>
          <div>
            <strong>Thandi Nkosi</strong>
            <span>Compliance Officer</span>
          </div>
          <LogOut size={17} className="logout-icon" />
        </div>
      </aside>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
          <div className="breadcrumb">ComplyTrack <span>/</span> Compliance workspace</div>
          <div className="topbar-actions">
            <button className="icon-button"><Bell size={18} /><span className="notification-dot" /></button>
            <div className="topbar-user">TN</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
