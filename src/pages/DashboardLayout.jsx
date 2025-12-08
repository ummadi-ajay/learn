// src/pages/DashboardLayout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f4",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              MakerWorks LMS
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "2px",
              }}
            >
              Learn • Teach • Track progress
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            {user && (
              <div>
                <div>{user.email}</div>
                <div
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "#eee",
                    display: "inline-block",
                    marginTop: "2px",
                  }}
                >
                  Logged in
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              style={{
                padding: "8px 10px",
                border: "none",
                borderRadius: "6px",
                background: "#dc3545",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main card with dashboard content */}
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #eee",
            minHeight: "70vh",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
