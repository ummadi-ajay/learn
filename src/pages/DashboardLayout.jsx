// src/pages/DashboardLayout.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isInstructor = location.pathname.startsWith("/instructor");
  const dashboardPath = isInstructor ? "/instructor" : "/student";

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const navItemBaseStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
  };

  const iconStyle = {
    width: 18,
    textAlign: "center",
    fontSize: 16,
  };

  const textStyle = {
    whiteSpace: "nowrap",
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  // helper: check if route is active
  const isActive = (path) => {
    if (path === dashboardPath) {
      return (
        location.pathname === dashboardPath ||
        location.pathname === `${dashboardPath}/`
      );
    }
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  // all left-menu items (per role)
  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "▦",
      path: dashboardPath,
    },
    {
      key: "profile",
      label: "My Profile",
      icon: "👤",
      path: `${dashboardPath}/profile`,
    },
    {
      key: "change-password",
      label: "Change Password",
      icon: "🔑",
      path: `${dashboardPath}/change-password`,
    },
    {
      key: "messages",
      label: "Messages",
      icon: "✉️",
      path: `${dashboardPath}/messages`,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: "🔔",
      path: `${dashboardPath}/notifications`,
    },
  ];

  return (
    <div
      className="layout-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Backdrop (for mobile) */}
      {mobileNavOpen && (
        <div
          className="layout-backdrop"
          onClick={closeMobileNav}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            zIndex: 15,
          }}
        />
      )}

      {/* LEFT PURPLE SIDEBAR */}
      <aside
        className={`layout-sidebar ${
          mobileNavOpen ? "sidebar-open" : "sidebar-closed"
        }`}
        style={{
          width: 220,
          background: "#5b21b6",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        <div>
          {/* Logo */}
          <div
            className="sidebar-logo"
            style={{
              padding: "18px 12px 14px",
              display: "flex",
              justifyContent: "center",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "999px",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#5b21b6",
                boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
              }}
            >
              LOGO
            </div>
          </div>

          {/* Nav items */}
          <nav className="sidebar-nav" style={{ marginTop: 10 }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <div
                  key={item.key}
                  style={{
                    ...navItemBaseStyle,
                    backgroundColor: active ? "white" : "transparent",
                    color: active ? "#5b21b6" : "white",
                    borderRadius: "0 20px 20px 0",
                    marginRight: 8,
                  }}
                  onClick={() => {
                    navigate(item.path);
                    closeMobileNav();
                  }}
                >
                  <span style={iconStyle}>{item.icon}</span>
                  <span style={textStyle}>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Help bottom */}
        <div
          className="sidebar-help"
          style={{
            padding: 12,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              ...navItemBaseStyle,
              padding: "8px 10px",
              justifyContent: "center",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.6)",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 16 }}>❓</span>
            <span>Help &amp; Support</span>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div
        className="layout-main"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <header
          className="layout-topbar"
          style={{
            height: 56,
            background: "white",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* HAMBURGER – visible on mobile via CSS */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "white",
                display: "none", // overridden by CSS on mobile
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 2,
                  background: "#111827",
                  display: "block",
                  boxShadow: "0 5px 0 #111827, 0 -5px 0 #111827",
                }}
              ></span>
            </button>

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {isInstructor ? "Instructor Panel" : "Student Panel"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>

        <main
          className="layout-content"
          style={{ flex: 1, padding: 16, overflow: "auto" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
