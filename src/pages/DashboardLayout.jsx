// src/pages/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";

const THEME_KEYS = ["light", "dark", "green", "orange"];

const themeConfig = {
  light: {
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceSoft: "#f9fafb",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    textMain: "#111827",
    textMuted: "#6b7280",
    border: "#e5e7eb",
  },
  dark: {
    background: "#020617",
    surface: "#020617",
    surfaceSoft: "#0f172a",
    primary: "#38bdf8",
    primarySoft: "#082f49",
    textMain: "#e5e7eb",
    textMuted: "#9ca3af",
    border: "#1f2937",
  },
  green: {
    background: "#ecfdf5",
    surface: "#ffffff",
    surfaceSoft: "#f0fdf4",
    primary: "#16a34a",
    primarySoft: "#dcfce7",
    textMain: "#022c22",
    textMuted: "#047857",
    border: "#bbf7d0",
  },
  orange: {
    background: "#fff7ed",
    surface: "#ffffff",
    surfaceSoft: "#fff7ed",
    primary: "#f97316",
    primarySoft: "#ffedd5",
    textMain: "#7c2d12",
    textMuted: "#9a3412",
    border: "#fed7aa",
  },
};

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const isInstructor = location.pathname.startsWith("/instructor");
  const dashboardPath = isInstructor ? "/instructor" : "/student";

  // load theme from localStorage (same key as StudentDashboard)
  useEffect(() => {
    const saved = localStorage.getItem("makerworks-theme");
    if (saved && THEME_KEYS.includes(saved)) {
      setTheme(saved);
    }
  }, []);

  const t = themeConfig[theme] || themeConfig.light;

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
        // FULL SCREEN + STICKY SHELL
        position: "fixed",
        inset: 0,
        display: "flex",
        background: t.background,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden", // prevent page scroll, only content scrolls
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

      {/* LEFT SIDEBAR – themed by primary color */}
      <aside
        className={`layout-sidebar ${
          mobileNavOpen ? "sidebar-open" : "sidebar-closed"
        }`}
        style={{
          width: 220,
          background: t.primary,
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
              borderBottom: "1px solid rgba(255,255,255,0.12)",
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
                color: t.primary,
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
                    color: active ? t.primary : "white",
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
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div
            style={{
              ...navItemBaseStyle,
              padding: "8px 10px",
              justifyContent: "center",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.7)",
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
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: t.background,
        }}
      >
        <header
          className="layout-topbar"
          style={{
            height: 56,
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            flexShrink: 0,
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
                border: `1px solid ${t.border}`,
                background: t.surface,
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
                  background: t.textMain,
                  display: "block",
                  boxShadow: `0 5px 0 ${t.textMain}, 0 -5px 0 ${t.textMain}`,
                }}
              ></span>
            </button>

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: t.textMain,
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
              border: `1px solid ${t.border}`,
              background: t.surfaceSoft,
              color: t.textMain,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>

        {/* SCROLLABLE CONTENT ONLY HERE */}
        <main
          className="layout-content"
          style={{
            flex: 1,
            padding: 16,
            overflow: "auto",
            background: t.background,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
