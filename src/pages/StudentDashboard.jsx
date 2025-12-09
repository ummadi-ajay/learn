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
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function StudentDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [allProgress, setAllProgress] = useState({});

  const navigate = useNavigate();

  // Load all courses
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load progress (enrolled courses)
  useEffect(() => {
    const ref = collection(db, "users", user.uid, "progress");
    return onSnapshot(ref, (snap) => {
      const map = {};
      snap.forEach((d) => {
        map[d.id] = d.data();
      });
      setAllProgress(map);
    });
  }, [user.uid]);

  const enrolledCourses = courses.filter((c) => allProgress[c.id]);
  const availableCourses = courses.filter((c) => !allProgress[c.id]);

  const displayName = user.displayName || user.email || "Learner";

  const totalCompletedLessons = Object.values(allProgress).reduce(
    (sum, p) => sum + (p.completedLessons?.length || 0),
    0
  );

  const goToCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // create/mark progress when starting a course
  const handleStartCourse = async (courseId) => {
    try {
      const ref = doc(db, "users", user.uid, "progress", courseId);
      await setDoc(
        ref,
        {
          startedAt: serverTimestamp(),
          completedLessons: [],
          lastOpenedLessonId: null,
        },
        { merge: true }
      );
      goToCourse(courseId);
    } catch (err) {
      console.error("Error starting course:", err);
      goToCourse(courseId); // still navigate even if write fails
    }
  };

  const purple = "#6d28d9";
  const purpleLight = "#f5f3ff";

  return (
    <div
      style={{
        padding: 0,
        display: "flex",
        justifyContent: "center",
        background: purpleLight,
        minHeight: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          padding: 24,
        }}
      >
        {/* Search bar */}
        <div
          style={{
            background: "white",
            borderRadius: 999,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            marginBottom: 18,
            border: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: purple,
              fontWeight: 700,
              marginRight: 6,
            }}
          >
            🔍
          </span>
          <input
            placeholder="Search courses..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#111827",
            }}
          />
        </div>

        {/* TOP SECTION: profile + overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {/* Left: profile card */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
              border: "1px solid #e5e7eb",
              display: "flex",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 90,
                minWidth: 90,
                height: 90,
                borderRadius: 18,
                background: "linear-gradient(135deg, #a855f7, #4c1d95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {displayName
                .split(" ")
                .map((p) => p[0]?.toUpperCase())
                .join("")
                .slice(0, 2)}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                ID: {user.uid.slice(0, 8)} • Email: {user.email}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 8,
                  fontSize: 12,
                  color: "#4b5563",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>Role: </span>
                  Student
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Enrolled: </span>
                  {enrolledCourses.length} course
                  {enrolledCourses.length === 1 ? "" : "s"}
                </div>
                <div>
                  <span style={{ fontWeight: 600 }}>Completed lessons: </span>
                  {totalCompletedLessons}
                </div>
              </div>
            </div>
          </div>

          {/* Right: overview card */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
              border: "1px solid #e5e7eb",
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
                  color: "#111827",
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
                    background: purpleLight,
                    color: purple,
                    fontWeight: 600,
                  }}
                >
                  Active
                </span>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                  }}
                >
                  Regular
                </span>
              </div>
            </div>

            {/* mini stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  background: purpleLight,
                  borderRadius: 12,
                  padding: 8,
                  fontSize: 12,
                  color: purple,
                  fontWeight: 600,
                }}
              >
                Total courses
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 2,
                    color: "#111827",
                  }}
                >
                  {courses.length}
                </div>
              </div>
              <div
                style={{
                  background: "#ecfdf5",
                  borderRadius: 12,
                  padding: 8,
                  fontSize: 12,
                  color: "#15803d",
                  fontWeight: 600,
                }}
              >
                Enrolled
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 2,
                    color: "#111827",
                  }}
                >
                  {enrolledCourses.length}
                </div>
              </div>
              <div
                style={{
                  background: "#eff6ff",
                  borderRadius: 12,
                  padding: 8,
                  fontSize: 12,
                  color: "#2563eb",
                  fontWeight: 600,
                }}
              >
                Completed lessons
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 2,
                    color: "#111827",
                  }}
                >
                  {totalCompletedLessons}
                </div>
              </div>
            </div>

            {/* progress bars */}
            <div style={{ fontSize: 12, color: "#4b5563" }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 2 }}>Active courses</div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width:
                        courses.length === 0
                          ? "0%"
                          : `${Math.min(
                              (enrolledCourses.length / courses.length) * 100,
                              100
                            ).toFixed(0)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: purple,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ marginBottom: 2 }}>Courses not started</div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width:
                        courses.length === 0
                          ? "0%"
                          : `${Math.min(
                              (availableCourses.length / courses.length) *
                                100,
                              100
                            ).toFixed(0)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "#f97316",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

       {/* ENROLLED COURSES – UDEMY STYLE PROGRESS CARDS */}
<div style={{ marginBottom: 24 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 10,
      alignItems: "center",
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: "#111827",
      }}
    >
      Enrolled courses
    </h3>
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      {enrolledCourses.length} enrolled
    </span>
  </div>

  {enrolledCourses.length === 0 ? (
    <p style={{ fontSize: 13, color: "#6b7280" }}>
      You haven&apos;t enrolled in any courses yet.
    </p>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {enrolledCourses.map((course) => {
        const progress = allProgress[course.id] || {};
        const completedCount = progress.completedLessons?.length || 0;

        // If you later store total lessons in progress (e.g. progress.totalLessons),
        // this will automatically use it:
        const totalLessons =
          progress.totalLessons ||
          progress.lessonCount ||
          Math.max(completedCount, 1);

        const percent = Math.min(
          100,
          Math.round((completedCount / totalLessons) * 100)
        );

        return (
          <div
            key={course.id}
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* LEFT: colored strip + play button */}
            <div
              style={{
                width: 80,
                minWidth: 80,
                background:
                  "linear-gradient(135deg, #6d28d9, #4c1d95)", // purple grad
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "999px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(15,23,42,0.35)",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    borderLeft: "14px solid #6d28d9",
                    marginLeft: 2,
                  }}
                />
              </div>
            </div>

            {/* RIGHT: course info + progress bar */}
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
                  color: "#6b7280",
                  marginBottom: 2,
                }}
              >
                {course.category || "Course"}
              </div>

              {/* Title – 2 lines max */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
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
                  color: "#6b7280",
                }}
              >
                Lecture • {completedCount}/{totalLessons} lessons • {percent}%
                complete
              </div>

              {/* mini progress bar (like Udemy bottom strip) */}
              <div
                style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 999,
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: "#6d28d9",
                  }}
                />
              </div>

              {/* Continue button */}
              <button
                onClick={() => goToCourse(course.id)}
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: "#6d28d9",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue course
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>


        {/* ALL COURSES – UDEMY STYLE CARDS */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              All courses
            </h3>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {courses.length} total
            </span>
          </div>

          {courses.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>No courses yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {courses.map((course) => {
                const enrolled = !!allProgress[course.id];
                const imageUrl =
                  course.imageUrl ||
                  "https://via.placeholder.com/400x200.png?text=Course";

                return (
                  <div
                    key={course.id}
                    style={{
                      background: "white",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 6px 14px rgba(15,23,42,0.06)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Top: image + badge */}
                    <div style={{ position: "relative" }}>
                      <img
                        src={imageUrl}
                        alt={course.title}
                        style={{
                          width: "100%",
                          height: 140,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {course.badge && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "#4c1d95",
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
                            background: "#ecfdf5",
                            color: "#15803d",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Enrolled
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
                          color: "#111827",
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
                          color: "#6b7280",
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
                          background: enrolled ? purple : "#16a34a",
                          color: "white",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          alignSelf: "stretch",
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
