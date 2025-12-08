// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student"); // student / instructor
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      await setDoc(doc(db, "users", firebaseUser.uid), {
        email: firebaseUser.email,
        role,
        createdAt: new Date(),
      });

      setMessage("Account created! Redirecting…");
      navigate("/", { replace: true }); // App.jsx will send to /student or /instructor
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT ILLUSTRATION */}
        <div className="auth-illustration">
          <div className="auth-illu-card">
            <div className="auth-illu-badge">
              <span>🚀 Join MakerWorks</span>
            </div>

            <div className="auth-illu-avatar">🧑‍🏫</div>

            <h2>Create your account</h2>
            <p>
              Set up your student or instructor account and start creating or
              taking courses in minutes.
            </p>

            <ul className="auth-illu-list">
              <li>🎓 Role-based dashboards</li>
              <li>📁 Upload lessons & resources</li>
              <li>📊 Progress + quiz analytics</li>
            </ul>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="auth-panel">
          <div className="auth-logo">MakerWorks LMS</div>

          <h1 className="auth-title">Sign up</h1>
          <p className="auth-subtitle">
            Create an account to access the MakerWorks learning platform.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
            }}
          >
            Already have an account?{" "}
            <Link to="/login" className="auth-link-small">
              Login
            </Link>
          </div>

          {message && (
            <p
              className={`auth-message ${
                message.toLowerCase().includes("created") ? "success" : "error"
              }`}
              style={{ marginTop: 8 }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
