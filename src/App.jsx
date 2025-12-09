// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./index.css";

import LoginPage from "./pages/LoginPage.jsx";
// ❌ remove SignupPage import
// import SignupPage from "./pages/SignupPage.jsx";

import StudentDashboard from "./pages/StudentDashboard.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import LessonPage from "./pages/LessonPage.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";

// NEW: pages for sidebar
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
      if (firebaseUser) {
        setUser(firebaseUser);
        const refUser = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(refUser);
        setUserRole(snap.exists() ? snap.data().role : null);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  if (loadingUser) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <Routes>
      {/* Root: decide based on login + role */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={userRole === "instructor" ? "/instructor" : "/student"}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Auth pages */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      {/* ❌ remove /signup route */}
      {/* <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignupPage />}
      /> */}

      {/* Student main dashboard */}
      <Route
        path="/student"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <StudentDashboard user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: profile */}
      <Route
        path="/student/profile"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <ProfilePage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: change password */}
      <Route
        path="/student/change-password"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <ChangePasswordPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: messages (global chat) */}
      <Route
        path="/student/messages"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <MessagesPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: notifications */}
      <Route
        path="/student/notifications"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <NotificationsPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: course view */}
      <Route
        path="/courses/:courseId"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <CoursePage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Student: lesson view */}
      <Route
        path="/courses/:courseId/lessons/:lessonId"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "student" ? (
            <Navigate to="/instructor" replace />
          ) : (
            <DashboardLayout>
              <LessonPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Instructor dashboard */}
      <Route
        path="/instructor"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <InstructorDashboard user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Instructor: same subpages if you want */}
      <Route
        path="/instructor/profile"
        element={
          !user ? (
            <Navigate to="/login" replace />
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
          ) : userRole !== "instructor" ? (
            <Navigate to="/student" replace />
          ) : (
            <DashboardLayout>
              <NotificationsPage user={user} />
            </DashboardLayout>
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
