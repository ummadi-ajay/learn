// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.jsx auth listener will redirect to /student or /instructor
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT ILLUSTRATION PANEL */}
        <div className="auth-illustration">
          <div className="auth-illu-card">
            <div className="auth-illu-badge">
              <span>📚 MakerWorks LMS</span>
            </div>

            <div className="auth-illu-avatar">👩‍💻</div>

            <h2>Welcome back</h2>
            <p>
              Login to continue learning, track your progress, and complete your
              courses.
            </p>

            <ul className="auth-illu-list">
              <li>✅ Progress tracking per lesson</li>
              <li>✅ Quizzes & certificates</li>
              <li>✅ Separate student / instructor views</li>
            </ul>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="auth-panel">
          <div className="auth-logo">MakerWorks LMS</div>

          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">
            Enter your account details to access your dashboard.
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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-actions-row">
              <span className="tiny-text" style={{ color: "#9ca3af" }}>
                Use the test account you created
              </span>
            </div>

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {message && (
            <p className="auth-message error" style={{ marginTop: 8 }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
