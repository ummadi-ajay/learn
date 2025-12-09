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

function getEmbedUrl(youtubeUrl) {
  if (!youtubeUrl) return null;
  try {
    const url = new URL(youtubeUrl);
    const v = url.searchParams.get("v");
    if (v) {
      return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id) {
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }
  } catch (e) {
    // ignore parse error
  }
  return null;
}

function CoursePage({ user }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | theory | resources

  const purple = "#6d28d9";

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
        setSelectedLesson(list[0]);
      }
    }
    loadLessons();
  }, [courseId]);

  // Ensure progress doc exists when visiting course page (deep link or from dashboard)
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
            startedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Error updating lesson progress:", err);
      }
    }
  };

  const embedUrl = getEmbedUrl(selectedLesson?.youtubeUrl);

  const overviewText =
    selectedLesson?.description ||
    course?.description ||
    "This lesson description will appear here.";

  return (
    <div
      className="cp-root"
      style={{
        display: "flex",
        height: "calc(100vh - 56px)", // inside DashboardLayout
        background: "#111827",
        color: "white",
      }}
    >
      {/* LEFT: video + tabs */}
      <div
        className="cp-left"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0b1120",
          borderRight: "1px solid #020617",
        }}
      >
        {/* Video / YouTube embed */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%", // 16:9
            background: "black",
          }}
        >
          {selectedLesson ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title={selectedLesson.title || "Lesson video"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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
                  color: "white",
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
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "default",
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
              }}
            >
              Select a lesson on the right
            </div>
          )}
        </div>

        {/* Tabs and content */}
        <div
          style={{
            background: "#f9fafb",
            color: "#111827",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #e5e7eb",
              background: "white",
              padding: "0 16px",
            }}
          >
            {[
              { id: "overview", label: "Overview" },
              { id: "theory", label: "Theory" },
              { id: "resources", label: "Resources" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "12px 14px",
                  cursor: "pointer",
                  fontSize: 14,
                  borderBottom:
                    activeTab === tab.id
                      ? `2px solid ${purple}`
                      : "2px solid transparent",
                  color: activeTab === tab.id ? purple : "#6b7280",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "16px 20px", fontSize: 14 }}>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {selectedLesson?.title || course?.title || "Lesson overview"}
                </h2>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#4b5563",
                  }}
                >
                  {overviewText}
                </p>

                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Course:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {course?.title || "Course"}
                  </span>
                </p>
                {selectedLesson?.duration && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Duration: {selectedLesson.duration} min
                  </p>
                )}
              </>
            )}

            {/* THEORY TAB */}
            {activeTab === "theory" && (
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                {selectedLesson?.content ||
                  "Detailed theory/content for this lesson will go here."}
              </div>
            )}

            {/* RESOURCES TAB */}
            {activeTab === "resources" && (
              <div
                style={{
                  fontSize: 14,
                  color: "#4b5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* PDF INLINE */}
                {selectedLesson?.pdfUrl ? (
                  <div>
                    <p style={{ marginBottom: 6 }}>
                      PDF resource for this lesson:
                    </p>
                    <a
                      href={selectedLesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 14,
                        color: purple,
                        fontWeight: 600,
                      }}
                    >
                      📄 Open PDF in new tab
                    </a>
                    <div
                      style={{
                        marginTop: 10,
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        overflow: "hidden",
                        height: 400,
                        background: "white",
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
                  <p style={{ color: "#6b7280", margin: 0 }}>
                    No PDF attached for this lesson.
                  </p>
                )}

                {/* IMAGES INLINE */}
                {selectedLesson?.imageUrls &&
                  Array.isArray(selectedLesson.imageUrls) &&
                  selectedLesson.imageUrls.length > 0 && (
                    <div>
                      <p style={{ marginBottom: 6 }}>Images for this lesson:</p>
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
                              border: "1px solid #e5e7eb",
                              background: "white",
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
          width: 360,
          background: "#f9fafb",
          borderLeft: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            background: "white",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {course?.title || "Course content"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
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
            return (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: isActive ? "#e5e7eb" : "transparent",
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {index + 1}.
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {lesson.title || "Lesson"}
                  </div>
                  {lesson.duration && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                      }}
                    >
                      {lesson.duration} min
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
                color: "#6b7280",
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
