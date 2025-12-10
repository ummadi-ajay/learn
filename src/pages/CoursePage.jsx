// src/pages/CoursePage.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// ---- THEME SETUP (shared with dashboard via localStorage) ----

const themeConfig = {
  light: {
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceSoft: "#f9fafb",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    accent: "#10b981",
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
    accent: "#22c55e",
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
    accent: "#0ea5e9",
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
    accent: "#22c55e",
    textMain: "#7c2d12",
    textMuted: "#9a3412",
    border: "#fed7aa",
  },
};

// extract YouTube video ID
function getYoutubeId(youtubeUrl) {
  if (!youtubeUrl) return null;
  try {
    const url = new URL(youtubeUrl);
    const v = url.searchParams.get("v");
    if (v) return v;
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return id || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function CoursePage({ user }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | theory | resources

  const [theme, setTheme] = useState("light");
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [canMarkComplete, setCanMarkComplete] = useState(false);

  const [mounted, setMounted] = useState(false);

  // load theme from localStorage (same key as dashboard)
  useEffect(() => {
    const saved = localStorage.getItem("makerworks-theme");
    if (saved && themeConfig[saved]) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const t = themeConfig[theme] || themeConfig.light;

  // Load course info
  useEffect(() => {
    async function loadCourse() {
      const ref = doc(db, "courses", courseId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCourse({ id: snap.id, ...snap.data() });
      }
    }
    loadCourse();
  }, [courseId]);

  // Load lessons
  useEffect(() => {
    async function loadLessons() {
      const ref = collection(db, "courses", courseId, "lessons");
      const q = query(ref, orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLessons(list);
      if (list.length > 0) {
        setSelectedLesson((prev) => prev || list[0]);
      }
    }
    loadLessons();
  }, [courseId]);

  // Ensure progress doc exists when visiting course page
  useEffect(() => {
    if (!user) return;
    async function ensureProgress() {
      const ref = doc(db, "users", user.uid, "progress", courseId);
      await setDoc(
        ref,
        {
          startedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    ensureProgress();
  }, [user, courseId]);

  // Load completed lessons for this course (progress)
  useEffect(() => {
    if (!user) return;
    async function loadProgress() {
      try {
        const ref = doc(db, "users", user.uid, "progress", courseId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const arr = Array.isArray(data.completedLessons)
            ? data.completedLessons
            : [];
          setCompletedLessonIds(arr);
        }
      } catch (err) {
        console.error("Error loading progress for course page:", err);
      }
    }
    loadProgress();
  }, [user, courseId]);

  const handleSelectLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setActiveTab("overview");

    // Update last opened lesson in progress
    if (user) {
      try {
        const ref = doc(db, "users", user.uid, "progress", courseId);
        await setDoc(
          ref,
          {
            lastOpenedLessonId: lesson.id,
            lastOpenedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Error updating lesson progress:", err);
      }
    }
  };

  const toggleCompleteSelectedLesson = async () => {
    if (!user || !selectedLesson) return;
    try {
      const ref = doc(db, "users", user.uid, "progress", courseId);
      const snap = await getDoc(ref);
      let current = [];
      if (snap.exists()) {
        const data = snap.data();
        current = Array.isArray(data.completedLessons)
          ? [...data.completedLessons]
          : [];
      }
      const idx = current.indexOf(selectedLesson.id);
      if (idx === -1) {
        current.push(selectedLesson.id);
      } else {
        current.splice(idx, 1);
      }

      await setDoc(
        ref,
        {
          completedLessons: current,
          lastOpenedLessonId: selectedLesson.id,
          lastOpenedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCompletedLessonIds(current);
    } catch (err) {
      console.error("Error toggling completed lesson:", err);
    }
  };

  // --- YOUTUBE IFRAME API: gate "mark as complete" until video ends ---
  useEffect(() => {
    // reset on lesson change
    setCanMarkComplete(false);

    if (!selectedLesson) return;

    const videoId = getYoutubeId(selectedLesson.youtubeUrl);

    // If no video, allow manual completion immediately
    if (!videoId) {
      setCanMarkComplete(true);
      return;
    }

    if (typeof window === "undefined") return;

    let player = null;
    let destroyed = false;

    function createPlayer() {
      if (destroyed) return;
      player = new window.YT.Player("yt-player", {
        height: "100%",      // fill container
        width: "100%",       // fill container
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setCanMarkComplete(true);
            }
          },
        },
      });
    }

    // If API already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // load the script only once
      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        )
      ) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      // YouTube calls this when API is ready
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        createPlayer();
      };
    }

    return () => {
      destroyed = true;
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [selectedLesson?.id, selectedLesson?.youtubeUrl]);

  const overviewText =
    selectedLesson?.description ||
    course?.description ||
    "This lesson description will appear here.";

  const isSelectedCompleted = selectedLesson
    ? completedLessonIds.includes(selectedLesson.id)
    : false;

  const cardAnim = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 0.25s ease ${delay}ms, transform 0.25s ease ${delay}ms`,
  });

  return (
    <div
      className="cp-root"
      style={{
        display: "flex",
        height: "calc(100vh - 56px)", // inside DashboardLayout
        background: t.background,
        color: t.textMain,
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* LEFT: video + tabs */}
      <div
        className="cp-left"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: t.surfaceSoft,
          borderRight: `1px solid ${t.border}`,
          ...cardAnim(40),
        }}
      >
        {/* Course header strip */}
        <div
          style={{
            padding: "10px 16px",
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.textMain,
                marginBottom: 2,
              }}
            >
              {course?.title || "Course"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
              }}
            >
              {selectedLesson
                ? `Now playing: ${selectedLesson.title || "Lesson"}`
                : "Select a lesson on the right"}
            </div>
          </div>

          {lessons.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: t.textMuted,
              }}
            >
              {completedLessonIds.length}/{lessons.length} lessons complete
            </div>
          )}
        </div>

        {/* Video / YouTube embed (via IFrame API) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "55vh",    // 🔹 smaller than before
            minHeight: 320,    // 🔹 still usable on short screens
            background: "#020617",
            overflow: "hidden",
          }}
        >
          {selectedLesson ? (
            selectedLesson.youtubeUrl ? (
              // Player API target
              <div
                id="yt-player"
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f9fafb",
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {selectedLesson.title || "Lesson"}
                </div>
                <button
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: "999px",
                    border: "none",
                    background: "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      marginLeft: 5,
                      width: 0,
                      height: 0,
                      borderTop: "14px solid transparent",
                      borderBottom: "14px solid transparent",
                      borderLeft: "24px solid #111827",
                    }}
                  />
                </button>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#e5e7eb",
                  }}
                >
                  No YouTube link set for this lesson.
                </div>
              </div>
            )
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              Select a lesson on the right
            </div>
          )}
        </div>

        {/* Under-video bar: mark complete */}
        <div
          style={{
            padding: "8px 16px",
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <div style={{ color: t.textMuted }}>
            {selectedLesson ? (
              <>
                Lesson:{" "}
                <span style={{ fontWeight: 600, color: t.textMain }}>
                  {selectedLesson.title || "Untitled"}
                </span>
              </>
            ) : (
              "No lesson selected"
            )}
          </div>
          {selectedLesson && (
            <button
              onClick={toggleCompleteSelectedLesson}
              disabled={!canMarkComplete}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: canMarkComplete ? "pointer" : "not-allowed",
                opacity: canMarkComplete ? 1 : 0.6,
                background: isSelectedCompleted ? t.accent : t.primary,
                color: "#ffffff",
                boxShadow:
                  theme === "dark"
                    ? "0 4px 10px rgba(0,0,0,0.8)"
                    : "0 4px 10px rgba(15,23,42,0.18)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!canMarkComplete) return;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isSelectedCompleted ? "Mark as not done" : "Mark as complete"}
            </button>
          )}
        </div>

        {/* Tabs and content */}
        <div
          style={{
            background: t.surfaceSoft,
            color: t.textMain,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${t.border}`,
              background: t.surface,
              padding: "0 16px",
            }}
          >
            {[
              { id: "overview", label: "Overview" },
              { id: "theory", label: "Theory" },
              { id: "resources", label: "Resources" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "12px 14px",
                    cursor: "pointer",
                    fontSize: 14,
                    borderBottom: active
                      ? `2px solid ${t.primary}`
                      : "2px solid transparent",
                    color: active ? t.primary : t.textMuted,
                    fontWeight: active ? 600 : 500,
                    transition: "color 0.2s ease, border-bottom 0.2s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div
            style={{
              padding: "16px 20px 20px",
              fontSize: 14,
              ...cardAnim(120),
            }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: 20,
                    fontWeight: 700,
                    color: t.textMain,
                  }}
                >
                  {selectedLesson?.title || course?.title || "Lesson overview"}
                </h2>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: t.textMuted,
                  }}
                >
                  {overviewText}
                </p>

                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 13,
                    color: t.textMuted,
                  }}
                >
                  Course:{" "}
                  <span style={{ fontWeight: 600, color: t.textMain }}>
                    {course?.title || "Course"}
                  </span>
                </p>
                {selectedLesson?.duration && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: t.textMuted,
                    }}
                  >
                    Duration: {selectedLesson.duration} min
                  </p>
                )}
              </>
            )}

            {/* THEORY TAB */}
            {activeTab === "theory" && (
              <div
                style={{
                  fontSize: 14,
                  color: t.textMain,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedLesson?.content ||
                  "Detailed theory/content for this lesson will go here."}
              </div>
            )}

            {/* RESOURCES TAB */}
            {activeTab === "resources" && (
              <div
                style={{
                  fontSize: 14,
                  color: t.textMuted,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* PDF INLINE */}
                {selectedLesson?.pdfUrl ? (
                  <div>
                    <p style={{ marginBottom: 6, color: t.textMain }}>
                      PDF resource for this lesson:
                    </p>
                    <a
                      href={selectedLesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 14,
                        color: t.primary,
                        fontWeight: 600,
                      }}
                    >
                      📄 Open PDF in new tab
                    </a>
                    <div
                      style={{
                        marginTop: 10,
                        border: `1px solid ${t.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                        height: 400,
                        background: t.surface,
                      }}
                    >
                      <iframe
                        src={selectedLesson.pdfUrl}
                        title="Lesson PDF"
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>
                    No PDF attached for this lesson.
                  </p>
                )}

                {/* IMAGES INLINE */}
                {selectedLesson?.imageUrls &&
                  Array.isArray(selectedLesson.imageUrls) &&
                  selectedLesson.imageUrls.length > 0 && (
                    <div>
                      <p
                        style={{
                          marginBottom: 6,
                          color: t.textMain,
                        }}
                      >
                        Images for this lesson:
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {selectedLesson.imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              borderRadius: 8,
                              overflow: "hidden",
                              border: `1px solid ${t.border}`,
                              background: t.surface,
                            }}
                          >
                            <img
                              src={url}
                              alt={`Resource ${idx + 1}`}
                              style={{
                                width: "100%",
                                height: 120,
                                objectFit: "cover",
                                display: "block",
                                transition: "transform 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "scale(1.03)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: lesson list */}
      <aside
        className="cp-right"
        style={{
          width: 320, // a bit slimmer to give the video more width
          background: t.surface,
          borderLeft: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          ...cardAnim(80),
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${t.border}`,
            background: t.surface,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: t.textMain,
            }}
          >
            {course?.title || "Course content"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: t.textMuted,
              marginTop: 4,
            }}
          >
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {lessons.map((lesson, index) => {
            const isActive = selectedLesson?.id === lesson.id;
            const isCompleted = completedLessonIds.includes(lesson.id);

            // Gate lessons: first is always open; others require previous completed OR already completed
            const canOpen =
              index === 0 ||
              isCompleted ||
              completedLessonIds.includes(lessons[index - 1]?.id);

            return (
              <button
                key={lesson.id}
                onClick={() => canOpen && handleSelectLesson(lesson)}
                disabled={!canOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: isActive ? t.surfaceSoft : "transparent",
                  padding: "10px 14px",
                  cursor: canOpen ? "pointer" : "not-allowed",
                  opacity: canOpen ? 1 : 0.6,
                  borderBottom: `1px solid ${t.border}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  transition: "background 0.15s ease, opacity 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && canOpen) {
                    e.currentTarget.style.background = t.surfaceSoft;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: t.textMuted,
                    minWidth: 20,
                  }}
                >
                  {index + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: t.textMain,
                        marginRight: 6,
                      }}
                    >
                      {lesson.title || "Lesson"}
                    </div>
                    {isCompleted && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: t.accent,
                          color: "#ffffff",
                        }}
                      >
                        ✓ Done
                      </span>
                    )}
                  </div>
                  {lesson.duration && (
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                      }}
                    >
                      {lesson.duration} min
                    </div>
                  )}
                  {!canOpen && index > 0 && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: t.textMuted,
                      }}
                    >
                      Complete the previous lesson to unlock.
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {lessons.length === 0 && (
            <div
              style={{
                padding: 14,
                fontSize: 13,
                color: t.textMuted,
              }}
            >
              No lessons created for this course yet.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CoursePage;
