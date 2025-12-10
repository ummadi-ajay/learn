// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const THEME_KEYS = ["light", "dark", "green", "orange"];

const themeConfig = {
  light: {
    name: "Light",
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceSoft: "#f9fafb",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    accent: "#10b981",
    textMain: "#111827",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    heroGradient: "linear-gradient(135deg,#ffffff,#f9fafb)",
    chipBgActive: "#2563eb",
    chipTextActive: "#ffffff",
  },
  dark: {
    name: "Dark",
    background: "#020617",
    surface: "#0f172a",
    surfaceSoft: "#020617",
    primary: "#38bdf8",
    primarySoft: "#082f49",
    accent: "#22c55e",
    textMain: "#e5e7eb",
    textMuted: "#9ca3af",
    border: "#1f2937",
    heroGradient: "linear-gradient(135deg,#020617,#020617)",
    chipBgActive: "#38bdf8",
    chipTextActive: "#020617",
  },
  green: {
    name: "Green",
    background: "#ecfdf5",
    surface: "#ffffff",
    surfaceSoft: "#f0fdf4",
    primary: "#16a34a",
    primarySoft: "#dcfce7",
    accent: "#0ea5e9",
    textMain: "#022c22",
    textMuted: "#047857",
    border: "#bbf7d0",
    heroGradient: "linear-gradient(135deg,#ecfdf5,#ffffff)",
    chipBgActive: "#16a34a",
    chipTextActive: "#ffffff",
  },
  orange: {
    name: "Orange",
    background: "#fff7ed",
    surface: "#ffffff",
    surfaceSoft: "#fff7ed",
    primary: "#f97316",
    primarySoft: "#ffedd5",
    accent: "#22c55e",
    textMain: "#7c2d12",
    textMuted: "#9a3412",
    border: "#fed7aa",
    heroGradient: "linear-gradient(135deg,#fff7ed,#ffffff)",
    chipBgActive: "#f97316",
    chipTextActive: "#ffffff",
  },
};

function StudentDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [allProgress, setAllProgress] = useState({});
  const [profile, setProfile] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [courseFilter, setCourseFilter] = useState("all"); // all | enrolled | available
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | az | progress

  const [theme, setTheme] = useState("light");

  // for entry animation
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();

  // load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("makerworks-theme");
    if (saved && THEME_KEYS.includes(saved)) {
      setTheme(saved);
    }
  }, []);

  // save theme
  useEffect(() => {
    localStorage.setItem("makerworks-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const t = themeConfig[theme];
  const isLoading = loadingCourses || loadingProgress;

  // helper: resolves /images/... into correct URL for /learn/ base
  const resolveStaticPath = (path) => {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return cleanBase + cleanPath;
  };

  // Load profile (name, etc.) from users/{uid}
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const refUser = doc(db, "users", user.uid);
        const snap = await getDoc(refUser);

        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user]);

  // Load all courses
  useEffect(() => {
    setLoadingCourses(true);
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingCourses(false);
      },
      (error) => {
        console.error("Error loading courses:", error);
        setLoadingCourses(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load progress (enrolled courses)
  useEffect(() => {
    if (!user) return;

    setLoadingProgress(true);
    const ref = collection(db, "users", user.uid, "progress");

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const map = {};
        snap.forEach((d) => {
          map[d.id] = d.data();
        });
        setAllProgress(map);
        setLoadingProgress(false);
      },
      (error) => {
        console.error("Error loading progress:", error);
        setLoadingProgress(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: t.background,
          color: t.textMuted,
          fontSize: 14,
        }}
      >
        Loading your Makerworks LMS dashboard...
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => allProgress[c.id]);
  const availableCourses = courses.filter((c) => !allProgress[c.id]); // kept for logic if you need later

  // name
  const displayName =
    (profile && profile.name && profile.name.trim()) ||
    user.displayName ||
    user.email ||
    "Learner";

  // student ID
  const studentId =
    profile && typeof profile.studentId === "string"
      ? profile.studentId.trim() || null
      : null;

  // avatar
  const avatarPath = profile?.avatarPath || "";
  const avatarUrl = avatarPath ? resolveStaticPath(avatarPath) : "";

  const goToCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleStartCourse = async (courseId) => {
    try {
      const ref = doc(db, "users", user.uid, "progress", courseId);
      await setDoc(
        ref,
        {
          startedAt: serverTimestamp(),
          completedLessons: [],
          lastOpenedLessonId: null,
          lastOpenedAt: serverTimestamp(),
        },
        { merge: true }
      );
      goToCourse(courseId);
    } catch (err) {
      console.error("Error starting course:", err);
      goToCourse(courseId);
    }
  };

  const initials = displayName
    .split(" ")
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  // Search
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (course) => {
    if (!normalizedSearch) return true;
    const title = (course.title || "").toLowerCase();
    const desc = (course.description || "").toLowerCase();
    const cat = (course.category || "").toLowerCase();
    return (
      title.includes(normalizedSearch) ||
      desc.includes(normalizedSearch) ||
      cat.includes(normalizedSearch)
    );
  };

  // Categories
  const categories = Array.from(
    new Set(courses.map((c) => c.category).filter(Boolean))
  ).sort();

  // last opened
  const progressEntries = Object.entries(allProgress);
  const lastOpenedEntry =
    progressEntries.length > 0
      ? progressEntries
          .filter(([, p]) => p.lastOpenedAt || p.startedAt)
          .sort((a, b) => {
            const getTime = (prog) => {
              const ts = prog.lastOpenedAt || prog.startedAt;
              if (!ts || typeof ts.toMillis !== "function") return 0;
              return ts.toMillis();
            };
            return getTime(b[1]) - getTime(a[1]);
          })[0]
      : null;

  const lastOpenedCourse =
    lastOpenedEntry && courses.find((c) => c.id === lastOpenedEntry[0]);
  const lastOpenedCourseProgress = lastOpenedEntry ? lastOpenedEntry[1] : null;

  // activity
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  const dayKey = (d) => d.toISOString().slice(0, 10);

  const activeDaySet = new Set();
  progressEntries.forEach(([, p]) => {
    const timestamps = [p.lastOpenedAt, p.startedAt].filter(Boolean);
    timestamps.forEach((ts) => {
      if (ts && typeof ts.toMillis === "function") {
        const d = new Date(ts.toMillis());
        if (d >= sevenDaysAgo && d <= today) {
          activeDaySet.add(dayKey(d));
        }
      }
    });
  });
  const activeDaysLast7 = activeDaySet.size;

  const getProgressPercent = (courseId) => {
    const progress = allProgress[courseId] || {};
    const completedCount = progress.completedLessons?.length || 0;

    const courseMeta = courses.find((c) => c.id === courseId);
    const totalLessons =
      progress.totalLessons ||
      progress.lessonCount ||
      courseMeta?.lessonCount ||
      0;

    if (!totalLessons || totalLessons <= 0) return 0;

    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  };

  // visible with filters
  let visibleCourses = courses.filter(matchesSearch);

  if (courseFilter === "enrolled") {
    visibleCourses = visibleCourses.filter((c) => allProgress[c.id]);
  } else if (courseFilter === "available") {
    visibleCourses = visibleCourses.filter((c) => !allProgress[c.id]);
  }

  if (selectedCategory !== "all") {
    visibleCourses = visibleCourses.filter(
      (c) => c.category === selectedCategory
    );
  }

  visibleCourses = [...visibleCourses];

  if (sortBy === "az") {
    visibleCourses.sort((a, b) =>
      (a.title || "Untitled").localeCompare(b.title || "Untitled")
    );
  } else if (sortBy === "progress") {
    visibleCourses.sort(
      (a, b) => getProgressPercent(b.id) - getProgressPercent(a.id)
    );
  }

  const visibleEnrolledCourses = visibleCourses.filter(
    (c) => allProgress[c.id]
  );

  const filterChipStyle = (active) => ({
    padding: "4px 10px",
    borderRadius: 999,
    border: active ? "none" : `1px solid ${t.border}`,
    background: active ? t.chipBgActive : t.surface,
    color: active ? t.chipTextActive : t.textMuted,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  const themeChipStyle = (key) => {
    const active = theme === key;
    return {
      padding: "4px 10px",
      borderRadius: 999,
      border: active ? "none" : `1px solid ${t.border}`,
      background: active ? t.primary : t.surface,
      color: active ? "#ffffff" : t.textMuted,
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      transform: active ? "scale(1.02)" : "scale(1)",
    };
  };

  const cardBaseAnimation = (delayMs = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 0.35s ease ${delayMs}ms, transform 0.35s ease ${delayMs}ms, box-shadow 0.2s ease, transform 0.2s ease`,
  });

  const hoverCardStyle = {
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const buttonBaseStyle = {
    transition:
      "background 0.2s ease, transform 0.15s ease, boxShadow 0.15s ease",
  };

  const lastOpenedCoursePercent = lastOpenedCourse
    ? getProgressPercent(lastOpenedCourse.id)
    : 0;

  return (
    <div
      style={{
        padding: 0,
        display: "flex",
        justifyContent: "center",
        background: t.background,
        minHeight: "100vh",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          padding: 24,
        }}
      >
        {/* TOP BAR / BRAND */}
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            ...cardBaseAnimation(0),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: t.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 800,
                color: t.primary,
                boxShadow:
                  theme === "dark"
                    ? "0 6px 10px rgba(0,0,0,0.6)"
                    : "0 3px 6px rgba(15,23,42,0.15)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              M
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.textMain,
                }}
              >
                Makerworks LMS
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                }}
              >
                Student dashboard
              </div>
            </div>
          </div>

          {/* Theme switcher */}
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: 11,
              color: t.textMuted,
            }}
          >
            <span>Theme:</span>
            <button
              style={themeChipStyle("light")}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              style={themeChipStyle("dark")}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              style={themeChipStyle("green")}
              onClick={() => setTheme("green")}
            >
              Green
            </button>
            <button
              style={themeChipStyle("orange")}
              onClick={() => setTheme("orange")}
            >
              Orange
            </button>
          </div>
        </div>

        {/* HERO HEADER */}
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 18,
            background: t.heroGradient,
            color: t.textMain,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow:
              theme === "dark"
                ? "0 18px 40px rgba(15,23,42,0.7)"
                : "0 12px 30px rgba(15,23,42,0.12)",
            border: `1px solid ${t.border}`,
            ...cardBaseAnimation(80),
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginBottom: 4,
              }}
            >
              {isLoading
                ? "Setting up your learning space..."
                : "Welcome back 👋"}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
              }}
            >
              Makerworks LMS · Active on{" "}
              <strong>{activeDaysLast7}</strong> day
              {activeDaysLast7 === 1 ? "" : "s"} in the last week.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: t.surfaceSoft,
                fontSize: 11,
                fontWeight: 600,
                textAlign: "right",
                border: `1px solid ${t.border}`,
                color: t.textMain,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ color: t.textMuted }}>Enrolled</div>
              <div style={{ fontSize: 15 }}>{enrolledCourses.length}</div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background: t.primary,
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  theme === "dark"
                    ? "0 8px 18px rgba(15,23,42,0.8)"
                    : "0 8px 18px rgba(15,23,42,0.25)",
                ...buttonBaseStyle,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Profile &amp; settings
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div
          style={{
            background: t.surface,
            borderRadius: 999,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow:
              theme === "dark"
                ? "0 8px 20px rgba(15,23,42,0.7)"
                : "0 8px 24px rgba(15,23,42,0.06)",
            marginBottom: 18,
            border: `1px solid ${t.border}`,
            ...cardBaseAnimation(120),
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: t.primary,
              fontWeight: 700,
              marginRight: 6,
            }}
          >
            🔍
          </span>
          <input
            placeholder="Search courses by title, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: t.textMain,
              background: "transparent",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 12,
                color: t.textMuted,
                cursor: "pointer",
                ...buttonBaseStyle,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* PROFILE + OVERVIEW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {/* PROFILE CARD */}
          <div
            style={{
              background: t.surface,
              borderRadius: 18,
              padding: 18,
              boxShadow:
                theme === "dark"
                  ? "0 10px 26px rgba(15,23,42,0.7)"
                  : "0 10px 26px rgba(15,23,42,0.06)",
              border: `1px solid ${t.border}`,
              display: "flex",
              gap: 16,
              ...cardBaseAnimation(160),
              ...hoverCardStyle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                theme === "dark"
                  ? "0 16px 32px rgba(0,0,0,0.9)"
                  : "0 16px 32px rgba(15,23,42,0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                theme === "dark"
                  ? "0 10px 26px rgba(15,23,42,0.7)"
                  : "0 10px 26px rgba(15,23,42,0.06)";
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 90,
                minWidth: 90,
                height: 90,
                borderRadius: 24,
                overflow: "hidden",
                background: t.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.primary,
                fontSize: 30,
                fontWeight: 700,
                transition: "transform 0.2s ease",
              }}
            >
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                initials
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: t.textMain,
                  marginBottom: 4,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  marginBottom: 10,
                }}
              >
                {studentId
                  ? `Student ID: ${studentId}`
                  : `ID: ${user.uid.slice(0, 8)}`}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8,
                  fontSize: 12,
                  color: t.textMuted,
                  marginBottom: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: t.textMain }}>
                    Role:{" "}
                  </span>
                  Student
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: t.textMain }}>
                    Enrolled:{" "}
                  </span>
                  {enrolledCourses.length} course
                  {enrolledCourses.length === 1 ? "" : "s"}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: t.textMain }}>
                    Active days (7d):{" "}
                  </span>
                  {activeDaysLast7}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                }}
              >
                {isLoading
                  ? "Syncing your progress..."
                  : "Tip: 20–30 minutes a day beats one long weekend binge."}
              </div>
            </div>
          </div>

          {/* OVERVIEW CARD */}
          <div
            style={{
              background: t.surface,
              borderRadius: 18,
              padding: 18,
              boxShadow:
                theme === "dark"
                  ? "0 10px 26px rgba(15,23,42,0.7)"
                  : "0 10px 26px rgba(15,23,42,0.06)",
              border: `1px solid ${t.border}`,
              ...cardBaseAnimation(200),
              ...hoverCardStyle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                theme === "dark"
                  ? "0 16px 32px rgba(0,0,0,0.9)"
                  : "0 16px 32px rgba(15,23,42,0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                theme === "dark"
                  ? "0 10px 26px rgba(15,23,42,0.7)"
                  : "0 10px 26px rgba(15,23,42,0.06)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.textMain,
                }}
              >
                Learning overview
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: t.primarySoft,
                    color: t.primary,
                    fontWeight: 600,
                  }}
                >
                  Active
                </span>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                    color: t.textMuted,
                  }}
                >
                  Last 7 days: {activeDaysLast7}d
                </span>
              </div>
            </div>

            {/* mini stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  background: t.surfaceSoft,
                  borderRadius: 12,
                  padding: 8,
                  fontSize: 12,
                  color: t.textMuted,
                  fontWeight: 600,
                  border: `1px solid ${t.border}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                Total courses
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 2,
                    color: t.textMain,
                  }}
                >
                  {courses.length}
                </div>
              </div>
              <div
                style={{
                  background: t.surfaceSoft,
                  borderRadius: 12,
                  padding: 8,
                  fontSize: 12,
                  color: t.textMuted,
                  fontWeight: 600,
                  border: `1px solid ${t.border}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                Enrolled
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 2,
                    color: t.textMain,
                  }}
                >
                  {enrolledCourses.length}
                </div>
              </div>
            </div>

            {/* progress bars */}
            <div style={{ fontSize: 12, color: t.textMuted }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 2 }}>Active courses</div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "#e5e7eb33",
                  }}
                >
                  <div
                    style={{
                      width:
                        courses.length === 0
                          ? "0%"
                          : `${Math.min(
                              (enrolledCourses.length / courses.length) *
                                100,
                              100
                            ).toFixed(0)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: t.primary,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTINUE LEARNING */}
        {lastOpenedCourse && !isLoading && (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: 16,
              background: theme === "dark" ? "#1f2937" : "#fefce8",
              border: `1px solid ${
                theme === "dark" ? "#374151" : "#fef08a"
              }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              color: theme === "dark" ? "#f9fafb" : "#78350f",
              ...cardBaseAnimation(240),
              ...hoverCardStyle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                theme === "dark"
                  ? "0 12px 26px rgba(0,0,0,0.8)"
                  : "0 12px 26px rgba(15,23,42,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Continue learning
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {lastOpenedCourse.title || "Untitled course"}
              </div>
              {lastOpenedCourseProgress?.lastOpenedLessonTitle && (
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.9,
                    marginBottom: 2,
                  }}
                >
                  Last lesson:{" "}
                  <strong>
                    {lastOpenedCourseProgress.lastOpenedLessonTitle}
                  </strong>
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                Progress: {lastOpenedCoursePercent}% complete
              </div>
            </div>
            <button
              onClick={() => goToCourse(lastOpenedCourse.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background: t.accent,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                ...buttonBaseStyle,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Resume course
            </button>
          </div>
        )}

        {/* ENROLLED COURSES */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              alignItems: "center",
              ...cardBaseAnimation(260),
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: t.textMain,
              }}
            >
              Enrolled courses
            </h3>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              {visibleEnrolledCourses.length} enrolled
              {normalizedSearch || courseFilter !== "all"
                ? " (filtered)"
                : ""}
            </span>
          </div>

          {loadingCourses || loadingProgress ? (
            <p style={{ fontSize: 13, color: t.textMuted }}>
              Loading your enrolled courses...
            </p>
          ) : visibleEnrolledCourses.length === 0 ? (
            <p style={{ fontSize: 13, color: t.textMuted }}>
              {normalizedSearch || courseFilter !== "all"
                ? "No enrolled courses match your filters."
                : "You haven&apos;t enrolled in any courses yet."}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {visibleEnrolledCourses.map((course, idx) => {
                const progress = allProgress[course.id] || {};
                const completedCount =
                  progress.completedLessons?.length || 0;
                const totalLessons =
                  progress.totalLessons ||
                  progress.lessonCount ||
                  Math.max(completedCount, 1);
                const percent =
                  totalLessons > 0
                    ? Math.min(
                        100,
                        Math.round((completedCount / totalLessons) * 100)
                      )
                    : 0;

                const isCourseCompleted =
                  progress.courseCompleted ||
                  (totalLessons > 0 && completedCount >= totalLessons);

                const currentLessonLabel = isCourseCompleted
                  ? `All ${totalLessons} lessons completed`
                  : progress.lastOpenedLessonTitle
                  ? `Currently on: ${progress.lastOpenedLessonTitle}`
                  : `Progress: ${completedCount}/${totalLessons} lessons`;

                return (
                  <div
                    key={course.id}
                    style={{
                      background: t.surface,
                      borderRadius: 12,
                      border: `1px solid ${t.border}`,
                      boxShadow:
                        theme === "dark"
                          ? "0 6px 18px rgba(15,23,42,0.7)"
                          : "0 6px 18px rgba(15,23,42,0.06)",
                      display: "flex",
                      overflow: "hidden",
                      ...cardBaseAnimation(280 + idx * 40),
                      ...hoverCardStyle,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow =
                        theme === "dark"
                          ? "0 14px 30px rgba(0,0,0,0.9)"
                          : "0 14px 30px rgba(15,23,42,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        theme === "dark"
                          ? "0 6px 18px rgba(15,23,42,0.7)"
                          : "0 6px 18px rgba(15,23,42,0.06)";
                    }}
                  >
                    {/* LEFT STRIP */}
                    <div
                      style={{
                        width: 80,
                        minWidth: 80,
                        background: t.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "999px",
                          background: t.surface,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 10px rgba(15,23,42,0.35)",
                          ...buttonBaseStyle,
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft: `14px solid ${t.primary}`,
                            marginLeft: 2,
                          }}
                        />
                      </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div
                      style={{
                        flex: 1,
                        padding: "10px 14px 8px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: t.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        {course.category || "Course"}
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: t.textMain,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {course.title || "Untitled course"}
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: t.textMuted,
                        }}
                      >
                        {isCourseCompleted ? (
                          <>✅ Completed • {totalLessons} lessons</>
                        ) : (
                          <>
                            {currentLessonLabel} • {percent}% complete
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          height: 6,
                          borderRadius: 999,
                          background: "#e5e7eb33",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background: t.primary,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      {isCourseCompleted && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.accent,
                          }}
                        >
                          Course completed 🎉
                        </div>
                      )}

                      <button
                        onClick={() => goToCourse(course.id)}
                        style={{
                          marginTop: 8,
                          alignSelf: "flex-start",
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "none",
                          background: t.primary,
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          ...buttonBaseStyle,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {isCourseCompleted ? "Review course" : "Continue course"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ALL COURSES – FILTERS + GRID */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              alignItems: "center",
              gap: 10,
              ...cardBaseAnimation(320),
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: t.textMain,
              }}
            >
              All courses
            </h3>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              {visibleCourses.length} shown
              {normalizedSearch ||
              courseFilter !== "all" ||
              selectedCategory !== "all"
                ? ` of ${courses.length} (filtered)`
                : ""}
            </span>
          </div>

          {/* Filters row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
              alignItems: "center",
              justifyContent: "space-between",
              ...cardBaseAnimation(340),
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <button
                style={filterChipStyle(courseFilter === "all")}
                onClick={() => setCourseFilter("all")}
              >
                All
              </button>
              <button
                style={filterChipStyle(courseFilter === "enrolled")}
                onClick={() => setCourseFilter("enrolled")}
              >
                Enrolled
              </button>
              <button
                style={filterChipStyle(courseFilter === "available")}
                onClick={() => setCourseFilter("available")}
              >
                Not enrolled
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  fontSize: 11,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  color: t.textMain,
                  transition: "border 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  fontSize: 11,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  color: t.textMain,
                  transition: "border 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="az">Sort: A–Z</option>
                <option value="progress">Sort: Progress</option>
              </select>
            </div>
          </div>

          {loadingCourses ? (
            <p style={{ fontSize: 13, color: t.textMuted }}>
              Loading courses...
            </p>
          ) : visibleCourses.length === 0 ? (
            <p style={{ fontSize: 13, color: t.textMuted }}>
              {normalizedSearch ||
              courseFilter !== "all" ||
              selectedCategory !== "all"
                ? "No courses match your filters."
                : "No courses yet."}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {visibleCourses.map((course, idx) => {
                const enrolled = !!allProgress[course.id];
                const rawImage = course.imageUrl || "";
                const imageUrl = rawImage ? resolveStaticPath(rawImage) : "";

                const percent = enrolled
                  ? getProgressPercent(course.id)
                  : 0;

                return (
                  <div
                    key={course.id}
                    style={{
                      background: t.surface,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: `1px solid ${t.border}`,
                      boxShadow:
                        theme === "dark"
                          ? "0 6px 14px rgba(15,23,42,0.7)"
                          : "0 6px 14px rgba(15,23,42,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      ...cardBaseAnimation(360 + idx * 40),
                      ...hoverCardStyle,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow =
                        theme === "dark"
                          ? "0 14px 28px rgba(0,0,0,0.9)"
                          : "0 14px 28px rgba(15,23,42,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        theme === "dark"
                          ? "0 6px 14px rgba(15,23,42,0.7)"
                          : "0 6px 14px rgba(15,23,42,0.06)";
                    }}
                  >
                    {/* Top: image + badge */}
                    <div style={{ position: "relative" }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={course.title}
                          style={{
                            width: "100%",
                            height: 140,
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            parent.style.background =
                              "linear-gradient(135deg, #e5e7eb, #d1d5db)";
                            parent.style.display = "flex";
                            parent.style.alignItems = "center";
                            parent.style.justifyContent = "center";
                            parent.textContent = "No image";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 140,
                            background:
                              "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            color: "#4b5563",
                            fontWeight: 500,
                          }}
                        >
                          No image
                        </div>
                      )}

                      {course.badge && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: t.primary,
                            color: "white",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {course.badge}
                        </div>
                      )}

                      {!course.badge && enrolled && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: t.primarySoft,
                            color: t.primary,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Enrolled{percent ? ` • ${percent}%` : ""}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div
                      style={{
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      {/* Title – max 2 lines */}
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: t.textMain,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: 40,
                        }}
                      >
                        {course.title || "Untitled course"}
                      </div>

                      {/* Short description – also 2 lines */}
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: t.textMuted,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: 32,
                        }}
                      >
                        {course.description || "No description yet."}
                      </div>

                      {/* Button */}
                      <button
                        onClick={() =>
                          enrolled
                            ? goToCourse(course.id)
                            : handleStartCourse(course.id)
                        }
                        style={{
                          marginTop: 10,
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "none",
                          background: enrolled ? t.primary : t.accent,
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          alignSelf: "stretch",
                          ...buttonBaseStyle,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {enrolled ? "Go to course" : "Start course"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
