// src/pages/InstructorDashboard.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment, // NEW
  writeBatch, // NEW (for notifications)
} from "firebase/firestore";

function InstructorDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseImageUrl, setCourseImageUrl] = useState(""); // NEW

  // Edit Course
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState(""); // NEW

  // Lessons
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeCourseTitle, setActiveCourseTitle] = useState("");
  const [lessons, setLessons] = useState([]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSummary, setLessonSummary] = useState(""); // description/overview
  const [lessonContent, setLessonContent] = useState(""); // theory
  const [lessonYoutubeUrl, setLessonYoutubeUrl] = useState("");
  const [lessonPdfUrl, setLessonPdfUrl] = useState("");
  const [lessonImageUrls, setLessonImageUrls] = useState(""); // comma separated text
  const [lessonDuration, setLessonDuration] = useState("");

  // Edit Lesson
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonSummary, setEditLessonSummary] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editLessonYoutubeUrl, setEditLessonYoutubeUrl] = useState("");
  const [editLessonPdfUrl, setEditLessonPdfUrl] = useState("");
  const [editLessonImageUrls, setEditLessonImageUrls] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");

  // Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState("");
  const [editQuizOptions, setEditQuizOptions] = useState(["", "", "", ""]);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);

  // Analytics
  const [analyticsCourse, setAnalyticsCourse] = useState(null);
  const [studentsProgress, setStudentsProgress] = useState([]);

  // Notifications (instructor → students)
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null); // 'ok' | 'error' | 'missing'

  // Newsletters
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsSending, setNewsSending] = useState(false);
  const [newsStatus, setNewsStatus] = useState(null); // 'ok' | 'error' | 'missing'
  const [newsList, setNewsList] = useState([]); // list of newsletters

  const purple = "#6d28d9";
  const purpleLight = "#f5f3ff";

  // =============== LOAD COURSES ===============
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // =============== LOAD LESSONS ===============
  useEffect(() => {
    if (!activeCourseId) return setLessons([]);

    const q = query(
      collection(db, "courses", activeCourseId, "lessons"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [activeCourseId]);

  // =============== LOAD QUIZZES ===============
  useEffect(() => {
    if (!activeCourseId || !editingLessonId) return setQuizzes([]);

    const q = query(
      collection(
        db,
        "courses",
        activeCourseId,
        "lessons",
        editingLessonId,
        "quizzes"
      ),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [activeCourseId, editingLessonId]);

  // =============== LOAD NEWSLETTERS ===============
  useEffect(() => {
    const q = query(
      collection(db, "newsletters"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setNewsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // =============== SELECT COURSE ===============
  const handleSelectCourse = (course) => {
    setActiveCourseId(course.id);
    setActiveCourseTitle(course.title);

    setLessonTitle("");
    setLessonSummary("");
    setLessonContent("");
    setLessonYoutubeUrl("");
    setLessonPdfUrl("");
    setLessonImageUrls("");
    setLessonDuration("");

    setEditingLessonId(null);
    setEditLessonTitle("");
    setEditLessonSummary("");
    setEditLessonContent("");
    setEditLessonYoutubeUrl("");
    setEditLessonPdfUrl("");
    setEditLessonImageUrls("");
    setEditLessonDuration("");

    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setCorrectIndex(0);

    setEditingQuizId(null);
    setEditQuizQuestion("");
    setEditQuizOptions(["", "", "", ""]);
    setEditCorrectIndex(0);
  };

  // =============== COURSE CRUD ===============
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addDoc(collection(db, "courses"), {
      title: title.trim(),
      description: description.trim(),
      imageUrl: courseImageUrl.trim() || null,
      createdBy: user.uid,
      createdByEmail: user.email,
      lessonCount: 0, // start at 0 lessons
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setDescription("");
    setCourseImageUrl("");
  };

  const startEditCourse = (course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditDescription(course.description || "");
    setEditImageUrl(course.imageUrl || "");
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourseId) return;

    await updateDoc(doc(db, "courses", editingCourseId), {
      title: editTitle.trim(),
      description: editDescription.trim(),
      imageUrl: editImageUrl.trim() || null,
    });

    setEditingCourseId(null);
    setEditTitle("");
    setEditDescription("");
    setEditImageUrl("");
  };

  const handleDeleteCourse = async (id) => {
    await deleteDoc(doc(db, "courses", id));
    if (activeCourseId === id) {
      setActiveCourseId(null);
      setLessons([]);
    }
  };

  // =============== LESSON CRUD ===============
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!activeCourseId) return;
    if (!lessonTitle.trim()) return;

    const imageArray = lessonImageUrls
      ? lessonImageUrls
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    await addDoc(collection(db, "courses", activeCourseId, "lessons"), {
      title: lessonTitle.trim(),
      description: lessonSummary.trim(),
      content: lessonContent.trim(),
      youtubeUrl: lessonYoutubeUrl.trim() || null,
      pdfUrl: lessonPdfUrl.trim() || null,
      imageUrls: imageArray,
      duration: lessonDuration.trim() || null,
      createdAt: serverTimestamp(),
    });

    // increment lessonCount on course
    await updateDoc(doc(db, "courses", activeCourseId), {
      lessonCount: increment(1),
    });

    setLessonTitle("");
    setLessonSummary("");
    setLessonContent("");
    setLessonYoutubeUrl("");
    setLessonPdfUrl("");
    setLessonImageUrls("");
    setLessonDuration("");
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonSummary(lesson.description || "");
    setEditLessonContent(lesson.content || "");
    setEditLessonYoutubeUrl(lesson.youtubeUrl || "");
    setEditLessonPdfUrl(lesson.pdfUrl || "");
    setEditLessonDuration(lesson.duration || "");
    setEditLessonImageUrls(
      Array.isArray(lesson.imageUrls) ? lesson.imageUrls.join(", ") : ""
    );
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!activeCourseId || !editingLessonId) return;

    const imageArray = editLessonImageUrls
      ? editLessonImageUrls
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    await updateDoc(
      doc(db, "courses", activeCourseId, "lessons", editingLessonId),
      {
        title: editLessonTitle.trim(),
        description: editLessonSummary.trim(),
        content: editLessonContent.trim(),
        youtubeUrl: editLessonYoutubeUrl.trim() || null,
        pdfUrl: editLessonPdfUrl.trim() || null,
        imageUrls: imageArray,
        duration: editLessonDuration.trim() || null,
      }
    );

    setEditingLessonId(null);
  };

  const handleDeleteLesson = async (id) => {
    if (!activeCourseId) return;
    await deleteDoc(doc(db, "courses", activeCourseId, "lessons", id));

    // decrement lessonCount on course
    await updateDoc(doc(db, "courses", activeCourseId), {
      lessonCount: increment(-1),
    });

    if (editingLessonId === id) setEditingLessonId(null);
  };

  // =============== QUIZ CRUD ===============
  const handleAddQuiz = async (e) => {
    e.preventDefault();
    if (!activeCourseId || !editingLessonId) return;
    if (!quizQuestion.trim()) return;

    await addDoc(
      collection(
        db,
        "courses",
        activeCourseId,
        "lessons",
        editingLessonId,
        "quizzes"
      ),
      {
        question: quizQuestion.trim(),
        options: quizOptions.map((o) => o.trim()),
        correctIndex,
        createdAt: serverTimestamp(),
      }
    );

    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const startEditQuiz = (q) => {
    setEditingQuizId(q.id);
    setEditQuizQuestion(q.question);
    setEditQuizOptions(q.options || ["", "", "", ""]);
    setEditCorrectIndex(q.correctIndex ?? 0);
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    if (!activeCourseId || !editingLessonId || !editingQuizId) return;

    await updateDoc(
      doc(
        db,
        "courses",
        activeCourseId,
        "lessons",
        editingLessonId,
        "quizzes",
        editingQuizId
      ),
      {
        question: editQuizQuestion.trim(),
        options: editQuizOptions.map((o) => o.trim()),
        correctIndex: editCorrectIndex,
      }
    );

    setEditingQuizId(null);
  };

  const handleDeleteQuiz = async (id) => {
    if (!activeCourseId || !editingLessonId) return;

    await deleteDoc(
      doc(
        db,
        "courses",
        activeCourseId,
        "lessons",
        editingLessonId,
        "quizzes",
        id
      )
    );
    if (editingQuizId === id) setEditingQuizId(null);
  };

  // =============== ANALYTICS ===============
  const handleOpenAnalytics = async (course) => {
    setAnalyticsCourse(course);
    setStudentsProgress([]);

    const usersSnap = await getDocs(collection(db, "users"));
    const usersList = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const list = [];
    for (const u of usersList) {
      const progRef = doc(db, "users", u.id, "progress", course.id);
      const progSnap = await getDoc(progRef);
      if (progSnap.exists()) {
        list.push({
          email: u.email,
          ...progSnap.data(),
        });
      }
    }

    setStudentsProgress(list);
  };

  // =============== NOTIFICATIONS (instructor → students) ===============
  const handleSendNotificationAll = async (e) => {
    e.preventDefault();
    setNotifStatus(null);

    if (!notifTitle.trim() || !notifBody.trim()) {
      setNotifStatus("missing");
      return;
    }

    setNotifSending(true);

    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);

      usersSnap.forEach((uDoc) => {
        const data = uDoc.data();
        if (data.role === "student") {
          const notifRef = doc(
            collection(db, "users", uDoc.id, "notifications")
          );
          batch.set(notifRef, {
            title: notifTitle.trim(),
            body: notifBody.trim(),
            createdAt: serverTimestamp(),
            read: false,
            from: user.email || user.uid,
          });
        }
      });

      await batch.commit();
      setNotifStatus("ok");
      setNotifTitle("");
      setNotifBody("");
    } catch (err) {
      console.error("Error sending notifications:", err);
      setNotifStatus("error");
    }

    setNotifSending(false);
  };

  // =============== UI ===============
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
        {/* HEADER */}
        <div
          style={{
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Instructor Studio
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Welcome, {user.email}
            </p>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 2fr)",
            gap: 18,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Create course */}
            <section
              style={{
                background: "white",
                borderRadius: 18,
                padding: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                Create a new course
              </h3>
              <form onSubmit={handleAddCourse}>
                <input
                  placeholder="Course title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                />
                <textarea
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
                <input
                  placeholder="Course image URL (optional)"
                  value={courseImageUrl}
                  onChange={(e) => setCourseImageUrl(e.target.value)}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: purple,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add course
                </button>
              </form>
            </section>

            {/* Course list */}
            <section
              style={{
                background: "white",
                borderRadius: 18,
                padding: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
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
                  Your courses
                </h3>
                <span
                  style={{ fontSize: 12, color: "#6b7280" }}
                >{`${courses.length} total`}</span>
              </div>

              {courses.length === 0 && (
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  No courses yet.
                </p>
              )}

              <div style={{ marginTop: 6 }}>
                {courses.map((c) => {
                  const isActive = activeCourseId === c.id;
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid #eef2ff",
                        marginBottom: 8,
                        background: isActive ? "#eef2ff" : "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginTop: 2,
                        }}
                      >
                        {c.description || "No description."}
                      </div>
                      {typeof c.lessonCount === "number" && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {c.lessonCount} lesson
                          {c.lessonCount === 1 ? "" : "s"}
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => handleSelectCourse(c)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            background: isActive ? purple : "#e5e7eb",
                            color: isActive ? "white" : "#111827",
                            cursor: "pointer",
                          }}
                        >
                          Lessons
                        </button>
                        <button
                          onClick={() => startEditCourse(c)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            background: "white",
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderColor: "#e5e7eb",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            background: "#fee2e2",
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleOpenAnalytics(c)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            background: "#fef9c3",
                            color: "#92400e",
                            cursor: "pointer",
                          }}
                        >
                          Analytics
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edit course inline */}
              {editingCourseId && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Edit course
                  </h4>
                  <form onSubmit={handleUpdateCourse}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        display: "block",
                        marginBottom: 8,
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                      }}
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      style={{
                        display: "block",
                        marginBottom: 8,
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                      }}
                    />
                    <input
                      placeholder="Course image URL (optional)"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      style={{
                        display: "block",
                        marginBottom: 8,
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        background: purple,
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCourseId(null)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        background: "#e5e7eb",
                        fontSize: 12,
                        marginLeft: 8,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}
            </section>

            {/* Analytics */}
            {analyticsCourse && (
              <section
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 14,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 6,
                  }}
                >
                  📊 Analytics: {analyticsCourse.title}
                </h3>
                {studentsProgress.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    No student progress yet.
                  </p>
                ) : (
                  studentsProgress.map((stu, idx) => {
                    const completed = stu.completedLessons?.length || 0;
                    const total = lessons.length || 0;
                    const percent =
                      total === 0
                        ? 0
                        : Math.round((completed / total) * 100);

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          marginTop: 8,
                          background: "#f9fafb",
                        }}
                      >
                        <b style={{ fontSize: 13 }}>{stu.email}</b>
                        <div
                          style={{
                            width: "100%",
                            background: "#e5e7eb",
                            height: 6,
                            borderRadius: 999,
                            marginTop: 4,
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: "#16a34a",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            marginTop: 4,
                            color: "#4b5563",
                          }}
                        >
                          {completed}/{total} lessons ({percent}%)
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  onClick={() => setAnalyticsCourse(null)}
                  style={{
                    marginTop: 10,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: "#e5e7eb",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Close analytics
                </button>
              </section>
            )}

            {/* Notifications to students */}
            <section
              style={{
                background: "white",
                borderRadius: 18,
                padding: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Send notification to all students
              </h3>
              <form onSubmit={handleSendNotificationAll}>
                <input
                  placeholder="Notification title"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <textarea
                  placeholder="Message body"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  rows={3}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  disabled={notifSending}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: notifSending ? "#9ca3af" : "#5b21b6",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: notifSending ? "not-allowed" : "pointer",
                  }}
                >
                  {notifSending ? "Sending..." : "Send to all students"}
                </button>
              </form>

              {notifStatus === "missing" && (
                <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>
                  Please fill both title and message.
                </p>
              )}
              {notifStatus === "ok" && (
                <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>
                  Notification sent to all students.
                </p>
              )}
              {notifStatus === "error" && (
                <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>
                  Something went wrong while sending.
                </p>
              )}
            </section>

            {/* Newsletters section */}
            <section
              style={{
                background: "white",
                borderRadius: 18,
                padding: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Write newsletter / announcement (visible to everyone)
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setNewsStatus(null);

                  if (!newsTitle.trim() || !newsBody.trim()) {
                    setNewsStatus("missing");
                    return;
                  }

                  setNewsSending(true);
                  try {
                    await addDoc(collection(db, "newsletters"), {
                      title: newsTitle.trim(),
                      content: newsBody.trim(), // use "content"
                      createdAt: serverTimestamp(),
                      authorId: user.uid,
                      authorEmail: user.email,
                    });
                    setNewsTitle("");
                    setNewsBody("");
                    setNewsStatus("ok");
                  } catch (err) {
                    console.error("Newsletter error:", err);
                    setNewsStatus("error");
                  }
                  setNewsSending(false);
                }}
              >
                <input
                  placeholder="Title"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <textarea
                  placeholder="Newsletter / announcement content"
                  value={newsBody}
                  onChange={(e) => setNewsBody(e.target.value)}
                  rows={3}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  disabled={newsSending}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: newsSending ? "#9ca3af" : "#6d28d9",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: newsSending ? "not-allowed" : "pointer",
                  }}
                >
                  {newsSending ? "Publishing..." : "Publish newsletter"}
                </button>
              </form>

              {newsStatus === "missing" && (
                <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>
                  Please fill both title and content.
                </p>
              )}
              {newsStatus === "ok" && (
                <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>
                  Newsletter published.
                </p>
              )}
              {newsStatus === "error" && (
                <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>
                  Something went wrong.
                </p>
              )}

              <hr
                style={{
                  margin: "14px 0 10px",
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                }}
              />

              <h4
                style={{
                  margin: "0 0 8px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Recent newsletters
              </h4>

              {newsList.length === 0 ? (
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  No newsletters yet.
                </p>
              ) : (
                newsList.map((n) => {
                  const text = n.content || n.body || n.message || "";
                  const date =
                    n.createdAt && n.createdAt.toDate
                      ? n.createdAt.toDate().toLocaleString()
                      : "Recently";

                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        marginBottom: 8,
                        background: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 2,
                          color: "#111827",
                        }}
                      >
                        {n.title || "Untitled"}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#4b5563",
                          whiteSpace: "pre-wrap",
                          marginBottom: 4,
                        }}
                      >
                        {text}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                        }}
                      >
                        {date} • {n.authorEmail || "Instructor"}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: lessons + quizzes */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {activeCourseId ? (
              <section
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
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
                    Lessons in {activeCourseTitle}
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {lessons.length} lesson
                    {lessons.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Add lesson */}
                <form onSubmit={handleAddLesson} style={{ marginBottom: 12 }}>
                  <input
                    placeholder="Lesson title"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <textarea
                    placeholder="Short summary (Overview tab)"
                    value={lessonSummary}
                    onChange={(e) => setLessonSummary(e.target.value)}
                    rows={2}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <textarea
                    placeholder="Full theory / explanation"
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    rows={3}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <input
                    placeholder="YouTube URL (unlisted / private link)"
                    value={lessonYoutubeUrl}
                    onChange={(e) => setLessonYoutubeUrl(e.target.value)}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <input
                    placeholder="PDF URL (optional)"
                    value={lessonPdfUrl}
                    onChange={(e) => setLessonPdfUrl(e.target.value)}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <textarea
                    placeholder="Image URLs (comma separated)"
                    value={lessonImageUrls}
                    onChange={(e) => setLessonImageUrls(e.target.value)}
                    rows={2}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <input
                    placeholder="Duration in minutes (optional)"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      border: "none",
                      background: purple,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add lesson
                  </button>
                </form>

                {/* Lessons list */}
                <div>
                  {lessons.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        marginTop: 8,
                        background:
                          editingLessonId === l.id ? "#eef2ff" : "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {l.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginTop: 2,
                        }}
                      >
                        {l.description || l.content}
                      </div>
                      {l.duration && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {l.duration} min
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => startEditLesson(l)}
                          style={{
                            padding: "4px 9px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            background: "white",
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderColor: "#e5e7eb",
                            cursor: "pointer",
                          }}
                        >
                          Edit lesson / quiz
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(l.id)}
                          style={{
                            padding: "4px 9px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: 12,
                            background: "#fee2e2",
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit lesson + quizzes */}
                {editingLessonId && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 8px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Edit lesson
                    </h4>
                    <form onSubmit={handleUpdateLesson}>
                      <input
                        value={editLessonTitle}
                        onChange={(e) => setEditLessonTitle(e.target.value)}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                      />

                      <textarea
                        value={editLessonSummary}
                        onChange={(e) => setEditLessonSummary(e.target.value)}
                        rows={2}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="Short summary (Overview)"
                      />

                      <textarea
                        value={editLessonContent}
                        onChange={(e) => setEditLessonContent(e.target.value)}
                        rows={3}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="Full theory"
                      />

                      <input
                        value={editLessonYoutubeUrl}
                        onChange={(e) =>
                          setEditLessonYoutubeUrl(e.target.value)
                        }
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="YouTube URL"
                      />

                      <input
                        value={editLessonPdfUrl}
                        onChange={(e) => setEditLessonPdfUrl(e.target.value)}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="PDF URL"
                      />

                      <textarea
                        value={editLessonImageUrls}
                        onChange={(e) => setEditLessonImageUrls(e.target.value)}
                        rows={2}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="Image URLs (comma separated)"
                      />

                      <input
                        value={editLessonDuration}
                        onChange={(e) =>
                          setEditLessonDuration(e.target.value)
                        }
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                        placeholder="Duration in minutes"
                      />

                      <button
                        type="submit"
                        style={{
                          padding: "6px 11px",
                          borderRadius: 999,
                          border: "none",
                          background: purple,
                          color: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Save lesson
                      </button>
                    </form>

                    {/* Quiz section */}
                    <h4
                      style={{
                        margin: "16px 0 8px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      Quiz questions
                    </h4>

                    <form onSubmit={handleAddQuiz}>
                      <input
                        placeholder="Quiz question"
                        value={quizQuestion}
                        onChange={(e) => setQuizQuestion(e.target.value)}
                        style={{
                          display: "block",
                          marginBottom: 8,
                          width: "100%",
                          padding: "7px 9px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                      />
                      {quizOptions.map((opt, i) => (
                        <input
                          key={i}
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const arr = [...quizOptions];
                            arr[i] = e.target.value;
                            setQuizOptions(arr);
                          }}
                          style={{
                            display: "block",
                            marginBottom: 6,
                            width: "100%",
                            padding: "7px 9px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            fontSize: 13,
                          }}
                        />
                      ))}
                      <label
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                        }}
                      >
                        Correct option:
                      </label>
                      <select
                        value={correctIndex}
                        onChange={(e) =>
                          setCorrectIndex(Number(e.target.value))
                        }
                        style={{
                          display: "block",
                          marginBottom: 8,
                          marginTop: 2,
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                      >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                      <button
                        type="submit"
                        style={{
                          padding: "6px 11px",
                          borderRadius: 999,
                          border: "none",
                          background: "#16a34a",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Add question
                      </button>
                    </form>

                    {quizzes.map((q, idx) => (
                      <div
                        key={q.id}
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                      >
                        <b>
                          Q{idx + 1}: {q.question}
                        </b>
                        {q.options?.map((op, i) => (
                          <div key={i} style={{ fontSize: 12 }}>
                            {i + 1}. {op}{" "}
                            {q.correctIndex === i && (
                              <strong>(correct)</strong>
                            )}
                          </div>
                        ))}
                        <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                          <button
                            onClick={() => startEditQuiz(q)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 999,
                              border: "none",
                              fontSize: 11,
                              background: "#e5e7eb",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(q.id)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 999,
                              border: "none",
                              fontSize: 11,
                              background: "#fee2e2",
                              color: "#b91c1c",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {editingQuizId && (
                      <form
                        onSubmit={handleUpdateQuiz}
                        style={{
                          marginTop: 14,
                          padding: 10,
                          background: "#f3f4f6",
                          borderRadius: 10,
                        }}
                      >
                        <h5
                          style={{
                            margin: "0 0 6px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          Edit quiz question
                        </h5>
                        <input
                          value={editQuizQuestion}
                          onChange={(e) =>
                            setEditQuizQuestion(e.target.value)
                          }
                          style={{
                            display: "block",
                            marginBottom: 8,
                            width: "100%",
                            padding: "7px 9px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            fontSize: 13,
                          }}
                        />
                        {editQuizOptions.map((op, i) => (
                          <input
                            key={i}
                            value={op}
                            onChange={(e) => {
                              const arr = [...editQuizOptions];
                              arr[i] = e.target.value;
                              setEditQuizOptions(arr);
                            }}
                            style={{
                              display: "block",
                              marginBottom: 6,
                              width: "100%",
                              padding: "7px 9px",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              fontSize: 13,
                            }}
                          />
                        ))}
                        <label
                          style={{
                            fontSize: 12,
                            color: "#4b5563",
                          }}
                        >
                          Correct option:
                        </label>
                        <select
                          value={editCorrectIndex}
                          onChange={(e) =>
                            setEditCorrectIndex(Number(e.target.value))
                          }
                          style={{
                            display: "block",
                            marginBottom: 8,
                            marginTop: 2,
                            padding: "6px 8px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            fontSize: 13,
                          }}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                        <button
                          type="submit"
                          style={{
                            padding: "6px 11px",
                            borderRadius: 999,
                            border: "none",
                            background: purple,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Save quiz
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </section>
            ) : (
              <div
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Select a course on the left to manage lessons and quizzes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;
