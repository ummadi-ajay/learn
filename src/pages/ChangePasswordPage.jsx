import React, { useState } from "react";
import { auth } from "../firebase/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";

function ChangePasswordPage({ user }) {
  // For "change with old password"
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changeStatus, setChangeStatus] = useState(null);
  const [changeLoading, setChangeLoading] = useState(false);

  // For "reset by email"
  const [resetStatus, setResetStatus] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleChangePassword = async () => {
    setChangeStatus(null);

    if (!oldPass || !newPass || !confirmPass) {
      setChangeStatus("missing");
      return;
    }

    if (newPass !== confirmPass) {
      setChangeStatus("mismatch");
      return;
    }

    if (!auth.currentUser) {
      setChangeStatus("noUser");
      return;
    }

    setChangeLoading(true);

    try {
      // 1) Re-authenticate with old password
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(auth.currentUser, cred);

      // 2) Update password
      await updatePassword(auth.currentUser, newPass);

      setChangeStatus("success");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      console.error("Password change error:", err);
      if (err.code === "auth/wrong-password") {
        setChangeStatus("wrongpass");
      } else {
        setChangeStatus("error");
      }
    }

    setChangeLoading(false);
  };

  const handleSendResetEmail = async () => {
    setResetStatus(null);

    if (!user?.email) {
      setResetStatus("noEmail");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetStatus("sent");
    } catch (err) {
      console.error("Reset email error:", err);
      setResetStatus("error");
    }

    setResetLoading(false);
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #e5e7eb",
        maxWidth: 480,
      }}
    >
      {/* MAIN HEADING */}
      <h2
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 700,
          color: "#111827", // dark so it’s visible
        }}
      >
        Change Password
      </h2>

      {/* SECTION 1: Change with old password */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            marginBottom: 10,
            color: "#111827",
          }}
        >
          Change using old password
        </h3>

        {/* OLD PASSWORD */}
        <label
          style={{
            fontSize: 13,
            color: "#4b5563",
            display: "block",
            marginBottom: 4,
          }}
        >
          Old Password
        </label>
        <input
          type="password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        {/* NEW PASSWORD */}
        <label
          style={{
            fontSize: 13,
            color: "#4b5563",
            display: "block",
            marginBottom: 4,
          }}
        >
          New Password
        </label>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        {/* CONFIRM NEW PASSWORD */}
        <label
          style={{
            fontSize: 13,
            color: "#4b5563",
            display: "block",
            marginBottom: 4,
          }}
        >
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        <button
          onClick={handleChangePassword}
          disabled={changeLoading}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 999,
            border: "none",
            background: "#5b21b6",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            opacity: changeLoading ? 0.7 : 1,
          }}
        >
          {changeLoading ? "Updating..." : "Update Password"}
        </button>

        {/* CHANGE STATUS MESSAGES */}
        {changeStatus === "missing" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            Please fill all fields.
          </p>
        )}
        {changeStatus === "mismatch" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            New passwords do not match.
          </p>
        )}
        {changeStatus === "wrongpass" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            Old password is incorrect.
          </p>
        )}
        {changeStatus === "noUser" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            You are not logged in.
          </p>
        )}
        {changeStatus === "success" && (
          <p style={{ color: "#16a34a", marginTop: 8, fontSize: 13 }}>
            Password updated successfully!
          </p>
        )}
        {changeStatus === "error" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            Something went wrong. Please try again.
          </p>
        )}
      </div>

      {/* DIVIDER */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          marginBottom: 16,
        }}
      />

      {/* SECTION 2: Reset by email */}
      <div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            marginBottom: 8,
            color: "#111827",
          }}
        >
          Forgot your password?
        </h3>
        <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 10 }}>
          We can send a password reset link to{" "}
          <strong>{user?.email}</strong>.
        </p>

        <button
          onClick={handleSendResetEmail}
          disabled={resetLoading}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #5b21b6",
            background: "white",
            color: "#5b21b6",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            opacity: resetLoading ? 0.7 : 1,
          }}
        >
          {resetLoading ? "Sending..." : "Send reset email"}
        </button>

        {/* RESET STATUS MESSAGES */}
        {resetStatus === "sent" && (
          <p style={{ color: "#16a34a", marginTop: 8, fontSize: 13 }}>
            Reset email sent. Please check your inbox.
          </p>
        )}
        {resetStatus === "noEmail" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            No email found for this account.
          </p>
        )}
        {resetStatus === "error" && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            Could not send reset email. Try again later.
          </p>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordPage;
