// src/components/Topbar.jsx

import React from "react";

function Topbar({ user, userRole, onLogout }) {
  return (
    <div
      style={{
        height: 56,
        borderBottom: "1px solid #e5e5e5",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        background: "#ffffff",
      }}
    >
      <div>
        <div style={{ fontWeight: "bold", fontSize: 18 }}>Dashboard</div>
        <div style={{ fontSize: 12, color: "#777" }}>
          {userRole ? userRole.toUpperCase() : "USER"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user && (
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <div>{user.email}</div>
            <div
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#eef2ff",
                display: "inline-block",
                marginTop: 2,
              }}
            >
              {userRole || "role?"}
            </div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: "#dc2626",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;
