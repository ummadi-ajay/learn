import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
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

  const purple = "#6d28d9";
  const purpleLight = "#f5f3ff";

  return (
    <div
      className="sd-root"
      style={{
        padding: 0,
        display: "flex",
        justifyContent: "center",
        background: purpleLight,
        minHeight: "100%",
      }}
    >
      <div
        className="sd-inner"
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
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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

        {/* ENROLLED COURSES */}
        <div style={{ marginBottom: 20 }}>
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
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 14,
                    border: `1px solid ${purpleLight}`,
                    boxShadow: "0 8px 20px rgba(109,40,217,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    {course.title || "Untitled course"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#4b5563",
                      marginBottom: 8,
                    }}
                  >
                    {course.description?.slice(0, 80) || "No description yet."}
                    {course.description && course.description.length > 80
                      ? "..."
                      : ""}
                  </div>

                  <button
                    onClick={() => goToCourse(course.id)}
                    style={{
                      marginTop: 4,
                      padding: "8px 12px",
                      width: "100%",
                      borderRadius: 999,
                      border: "1px solid transparent",
                      background: purple,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Continue course
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ALL COURSES */}
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
                background: "white",
                borderRadius: 18,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                padding: 10,
              }}
            >
              {courses.map((course) => {
                const enrolled = !!allProgress[course.id];
                return (
                  <div
                    key={course.id}
                    className="sd-course-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 6px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div className="sd-course-row-left">
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {course.title || "Untitled course"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          maxWidth: 380,
                        }}
                      >
                        {course.description?.slice(0, 120) ||
                          "No description yet."}
                        {course.description &&
                        course.description.length > 120
                          ? "..."
                          : ""}
                      </div>
                    </div>

                    <div
                      className="sd-course-row-right"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: enrolled ? "#ecfdf5" : "#fef9c3",
                          color: enrolled ? "#15803d" : "#92400e",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {enrolled ? "Enrolled" : "Not started"}
                      </span>
                      <button
                        onClick={() => goToCourse(course.id)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 999,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          background: enrolled ? purple : "#16a34a",
                          color: "white",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
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
