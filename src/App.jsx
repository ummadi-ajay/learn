// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore"; // ⬅️ setDoc added
import "./index.css";

import AdminPage from "./pages/AdminPage.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import PublicNewsPage from "./pages/PublicNewsPage.jsx";

import StudentDashboard from "./pages/StudentDashboard.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import LessonPage from "./pages/LessonPage.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";

import MessagesPage from "./pages/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          const refUser = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(refUser);

          let role = "student"; // default

          if (!snap.exists()) {
            // first time this account is seen – create a Firestore user doc
            await setDoc(
              refUser,
              {
                email: firebaseUser.email || "",
                role, // "student" by default
                name: "",
                avatarPath: null,
                createdAt: new Date(),
              },
              { merge: true }
            );
          } else {
            const data = snap.data();
            if (data.role) role = data.role;
          }

          setUserRole(role);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error in auth state listener:", err);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsub();
  }, []);

  if (loadingUser) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <Routes>
      {/* PUBLIC PAGES (no login) */}
      <Route path="/news" element={<PublicNewsPage />} />
      <Route path="/test" element={<div>PUBLIC TEST</div>} />

      {/* ROOT – send based on role */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole === "instructor" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <Navigate to="/student" replace />
          )
        }
      />

      {/* ADMIN – only role 'admin' */}
      <Route
        path="/admin"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "admin" ? (
            <Navigate to="/" replace />
          ) : (
            <DashboardLayout>
              <AdminPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* ===== STUDENT ROUTES ===== */}
      <Route
        path="/student"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <StudentDashboard user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/student/profile"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <ProfilePage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/student/change-password"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <ChangePasswordPage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/student/messages"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <MessagesPage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/student/notifications"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <NotificationsPage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/courses/:courseId"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <CoursePage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/courses/:courseId/lessons/:lessonId"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <LessonPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* ===== INSTRUCTOR ROUTES ===== */}
      <Route
        path="/instructor"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <InstructorDashboard user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/instructor/profile"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <ProfilePage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/instructor/change-password"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <ChangePasswordPage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/instructor/messages"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <MessagesPage user={user} />
            </DashboardLayout>
          )
        }
      />

      <Route
        path="/instructor/notifications"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <NotificationsPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
