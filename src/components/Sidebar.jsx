// src/components/Sidebar.jsx

import React from "react";
import { NavLink } from "react-router-dom";

function Sidebar({ userRole }) {
  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "10px 14px",
    marginBottom: 6,
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? "#ffffff" : "#333",
    background: isActive ? "#2563eb" : "transparent",
  });

  return (
    <div
      style={{
        width: 220,
        borderRight: "1px solid #e5e5e5",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: 18,
            marginBottom: 4,
          }}
        >
          MakerWorks LMS
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>
          {userRole ? userRole.toUpperCase() : "USER"}
        </div>
      </div>

      <nav>
        {userRole === "student" && (
          <>
            <NavLink to="/student" style={linkStyle}>
              📚 My Courses
            </NavLink>
          </>
        )}

        {userRole === "instructor" && (
          <>
            <NavLink to="/instructor" style={linkStyle}>
              🎓 Instructor Dashboard
            </NavLink>
          </>
        )}

        {/* Common links you can expand later */}
        <NavLink to="/" style={linkStyle}>
          🏠 Home
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;
