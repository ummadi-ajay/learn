// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";

function StudentDashboard({ user }) {
  const [courses, setCourses] = useState([]);

  // progress for ALL courses (courseId -> {completedLessons, quizScores})
  const [allProgress, setAllProgress] = useState({});

  // currently opened course + lesson
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeCourseTitle, setActiveCourseTitle] = useState("");
  const [lessons, setLessons] = useState([]);

  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeLessonTitle, setActiveLessonTitle] = useState("");

  // Quiz state
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Progress JUST for active course (derived from allProgress)
  const [progress, setProgress] = useState({
    completedLessons: [],
    quizScores: {},
  });

  // --------- LOAD COURSES ----------
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // --------- LOAD ALL PROGRESS (enrolled courses) ----------
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

  // --------- SET ACTIVE COURSE PROGRESS WHEN COURSE CHANGES ----------
  useEffect(() => {
    if (!activeCourseId) {
      setProgress({ completedLessons: [], quizScores: {} });
      return;
    }
    const p = allProgress[activeCourseId] || {
      completedLessons: [],
      quizScores: {},
    };
    setProgress({
      completedLessons: p.completedLessons || [],
      quizScores: p.quizScores || {},
    });
  }, [activeCourseId, allProgress]);

  // --------- LOAD LESSONS FOR ACTIVE COURSE ----------
  useEffect(() => {
    if (!activeCourseId) {
      setLessons([]);
      return;
    }

    const q = query(
      collection(db, "courses", activeCourseId, "lessons"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [activeCourseId]);

  // --------- LOAD QUIZZES FOR ACTIVE LESSON ----------
  useEffect(() => {
    if (!activeCourseId || !activeLessonId) {
      setQuizzes([]);
      return;
    }

    const q = query(
      collection(
        db,
        "courses",
        activeCourseId,
        "lessons",
        activeLessonId,
        "quizzes"
      ),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [activeCourseId, activeLessonId]);

  // --------- HANDLERS ----------

  const handleViewLessons = (course) => {
    setActiveCourseId(course.id);
    setActiveCourseTitle(course.title || "Course");
    setActiveLessonId(null);
    setActiveLessonTitle("");
    setQuizzes([]);
    setAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const openQuiz = (lesson) => {
    setActiveLessonId(lesson.id);
    setActiveLessonTitle(lesson.title || "Lesson");
    setAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleAnswer = (quizId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [quizId]: optionIndex }));
  };

  const submitQuiz = async () => {
    let count = 0;
    quizzes.forEach((q) => {
      if (answers[q.id] === q.correctIndex) count++;
    });

    setScore(count);
    setQuizSubmitted(true);

    if (!activeCourseId || !activeLessonId) return;

    const refProg = doc(db, "users", user.uid, "progress", activeCourseId);
    const snap = await getDoc(refProg);
    const old = snap.exists()
      ? snap.data()
      : { completedLessons: [], quizScores: {} };

    await setDoc(refProg, {
      ...old,
      quizScores: {
        ...old.quizScores,
        [activeLessonId]: { score: count, outOf: quizzes.length },
      },
    });
  };

  const markLessonCompleted = async (lessonId) => {
    if (!activeCourseId) return;

    const refProg = doc(db, "users", user.uid, "progress", activeCourseId);
    const snap = await getDoc(refProg);

    let data = { completedLessons: [], quizScores: {} };
    if (snap.exists()) data = snap.data();

    const list = data.completedLessons || [];
    if (list.includes(lessonId)) return;

    await setDoc(refProg, {
      ...data,
      completedLessons: [...list, lessonId],
    });
  };

  // Helper: is a lesson unlocked?
  const isLessonUnlocked = (index) => {
    const completed = progress.completedLessons || [];
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    if (!prevLesson) return true;
    return completed.includes(prevLesson.id);
  };

  const isLessonCompleted = (lessonId) =>
    (progress.completedLessons || []).includes(lessonId);

  // --------- PROGRESS + CERTIFICATE (active course) ----------
  const completedCount = progress.completedLessons.length;
  const totalLessons = lessons.length;
  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const downloadCertificate = () => {
    if (progressPercent < 100 || !activeCourseId) return;

    const docPdf = new jsPDF();

    docPdf.setFillColor(240, 240, 255);
    docPdf.rect(0, 0, 210, 297, "F");

    docPdf.setFontSize(24);
    docPdf.text("Certificate of Completion", 105, 60, { align: "center" });

    docPdf.setFontSize(14);
    docPdf.text("This is to certify that", 105, 80, { align: "center" });

    docPdf.setFontSize(18);
    docPdf.text(user.email, 105, 95, { align: "center" });

    docPdf.setFontSize(14);
    docPdf.text("has successfully completed the course", 105, 110, {
      align: "center",
    });

    docPdf.setFontSize(18);
    docPdf.text(`"${activeCourseTitle}"`, 105, 125, { align: "center" });

    const dateStr = new Date().toLocaleDateString();
    docPdf.setFontSize(12);
    docPdf.text(`Date: ${dateStr}`, 30, 260);
    docPdf.text("Instructor: ___________________", 130, 260);

    docPdf.save(`${activeCourseTitle}_certificate.pdf`);
  };

  // --------- DERIVED ARRAYS: ENROLLED VS AVAILABLE ----------
  const enrolledCourses = courses.filter((c) => allProgress[c.id]);
  const availableCourses = courses.filter((c) => !allProgress[c.id]);

  const displayName = user.displayName || user.email || "Learner";

  // --------- UI ----------

  return (
    <div style={{ padding: "8px 8px 24px" }}>
      {/* Top welcome banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "999px",
            background: "#0f172a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {displayName
            .split(" ")
            .map((p) => p[0]?.toUpperCase())
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Welcome back, {displayName.split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Continue where you left off and keep building your skills.
          </div>
        </div>
      </div>

      {/* ====== 1. CONTINUE LEARNING (ENROLLED) ====== */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Continue learning</h3>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {enrolledCourses.length === 0
              ? "Start a course to see it here"
              : `${enrolledCourses.length} enrolled course${
                  enrolledCourses.length === 1 ? "" : "s"
                }`}
          </span>
        </div>

        {enrolledCourses.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            You haven&apos;t started any courses yet. Pick one from the list
            below to get going.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {enrolledCourses.map((course) => {
              const p = allProgress[course.id] || {};
              const completed = p.completedLessons?.length || 0;
              return (
                <div
                  key={course.id}
                  style={{
                    background: "#f9fafb",
                    borderRadius: 10,
                    padding: 10,
                    border:
                      activeCourseId === course.id
                        ? "1px solid #2563eb"
                        : "1px solid #e5e7eb",
                    boxShadow:
                      activeCourseId === course.id
                        ? "0 6px 18px rgba(37,99,235,0.18)"
                        : "0 2px 6px rgba(15,23,42,0.05)",
                    cursor: "pointer",
                  }}
                  onClick={() => handleViewLessons(course)}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    {course.title || "Untitled course"}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}
                  >
                    {course.description?.slice(0, 70) ||
                      "No description yet."}
                    {course.description && course.description.length > 70
                      ? "..."
                      : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#4b5563",
                      marginBottom: 6,
                    }}
                  >
                    {completed} lesson{completed === 1 ? "" : "s"} completed
                  </div>
                  <button
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 500,
                      background:
                        activeCourseId === course.id ? "#1d4ed8" : "#2563eb",
                      color: "white",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    {activeCourseId === course.id
                      ? "Viewing course"
                      : "Resume course"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ====== 2. AVAILABLE COURSES ====== */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>All available courses</h3>
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
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {availableCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 10,
                  padding: 10,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  {course.title || "Untitled course"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 8,
                    minHeight: 32,
                  }}
                >
                  {course.description?.slice(0, 80) ||
                    "No description yet."}
                  {course.description && course.description.length > 80
                    ? "..."
                    : ""}
                </div>
                <button
                  onClick={() => handleViewLessons(course)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Start course
                </button>
              </div>
            ))}

            {/* already-enrolled courses also visible but marked */}
            {enrolledCourses.map((course) => (
              <div
                key={course.id + "-enrolled"}
                style={{
                  background: "#f9fafb",
                  borderRadius: 10,
                  padding: 10,
                  border: "1px dashed #9ca3af",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  {course.title}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                  Already enrolled
                </div>
                <button
                  onClick={() => handleViewLessons(course)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Go to course
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ====== 3. ACTIVE COURSE – LESSONS + QUIZ ====== */}
      {activeCourseId && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.3fr)",
            gap: 16,
          }}
        >
          {/* LEFT: Lessons + progress for this course (same as before) */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 14,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 16,
              }}
            >
              Course content · {activeCourseTitle}
            </h3>

            {totalLessons > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#4b5563" }}>
                  Progress: {completedCount} / {totalLessons} (
                  {progressPercent}%)
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#e5e7eb",
                    borderRadius: 999,
                    marginTop: 4,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      width: `${progressPercent}%`,
                      background: "#22c55e",
                      borderRadius: 999,
                      transition: "width 0.2s ease",
                    }}
                  ></div>
                </div>

                {progressPercent === 100 && (
                  <button
                    onClick={downloadCertificate}
                    style={{
                      marginTop: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "#f97316",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🎓 Download course certificate
                  </button>
                )}
              </div>
            )}

            {lessons.length === 0 ? (
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                No lessons added yet.
              </p>
            ) : (
              <div style={{ marginTop: 4 }}>
                {lessons.map((lesson, index) => {
                  const unlocked = isLessonUnlocked(index);
                  const completed = isLessonCompleted(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        marginBottom: 6,
                        background: unlocked ? "#f9fafb" : "#f3f4f6",
                        opacity: unlocked ? 1 : 0.7,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {index + 1}. {lesson.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            {lesson.content?.slice(0, 80) ||
                              "No description for this lesson."}
                            {lesson.content && lesson.content.length > 80
                              ? "..."
                              : ""}
                          </div>
                          {lesson.fileUrl && (
                            <a
                              href={lesson.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 11,
                                display: "inline-block",
                                marginTop: 4,
                              }}
                            >
                              📎 {lesson.fileName || "Open resource"}
                            </a>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 11,
                              marginBottom: 4,
                              color: completed
                                ? "#16a34a"
                                : unlocked
                                ? "#6b7280"
                                : "#9ca3af",
                            }}
                          >
                            {completed
                              ? "Completed ✅"
                              : unlocked
                              ? "In progress"
                              : "Locked 🔒"}
                          </div>

                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              disabled={!unlocked || completed}
                              onClick={() => markLessonCompleted(lesson.id)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "none",
                                fontSize: 11,
                                cursor:
                                  !unlocked || completed
                                    ? "not-allowed"
                                    : "pointer",
                                background: completed
                                  ? "#9ca3af"
                                  : "#22c55e",
                                color: "white",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {completed ? "Completed" : "Mark done"}
                            </button>

                            <button
                              disabled={!unlocked}
                              onClick={() => openQuiz(lesson)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "none",
                                fontSize: 11,
                                cursor: !unlocked
                                  ? "not-allowed"
                                  : "pointer",
                                background: "#2563eb",
                                color: "white",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Quiz
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Quiz panel */}
          {activeLessonId && (
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                Quiz · {activeLessonTitle}
              </h3>

              {quizzes.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  No quiz questions yet.
                </p>
              ) : !quizSubmitted ? (
                <>
                  {quizzes.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        marginBottom: 10,
                        paddingBottom: 6,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Q{idx + 1}. {q.question}
                      </div>
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          style={{
                            display: "block",
                            fontSize: 12,
                            marginBottom: 3,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            style={{ marginRight: 6 }}
                            checked={answers[q.id] === i}
                            onChange={() => handleAnswer(q.id, i)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ))}

                  <button
                    onClick={submitQuiz}
                    style={{
                      marginTop: 6,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "#16a34a",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Submit quiz
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    🎉 Your score: {score} / {quizzes.length}
                  </div>
                  {quizzes.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Q{idx + 1}. {q.question}
                      </div>
                      {q.options.map((opt, i) => {
                        const isCorrect = i === q.correctIndex;
                        const isSelected = answers[q.id] === i;
                        return (
                          <div
                            key={i}
                            style={{
                              fontSize: 12,
                              color: isCorrect
                                ? "#16a34a"
                                : isSelected
                                ? "#b91c1c"
                                : "#111827",
                            }}
                          >
                            {i + 1}. {opt}{" "}
                            {isCorrect ? "✔" : isSelected ? "✖" : ""}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default StudentDashboard;
