// src/pages/InstructorDashboard.jsx

import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase";
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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function InstructorDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Edit Course
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Lessons
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeCourseTitle, setActiveCourseTitle] = useState("");
  const [lessons, setLessons] = useState([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonFile, setLessonFile] = useState(null);

  // Edit Lesson
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");

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

  // =============== SELECT COURSE ===============
  const handleSelectCourse = (course) => {
    setActiveCourseId(course.id);
    setActiveCourseTitle(course.title);

    setLessonTitle("");
    setLessonContent("");
    setLessonFile(null);

    setEditingLessonId(null);
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
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setDescription("");
  };

  const startEditCourse = (course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditDescription(course.description || "");
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourseId) return;

    await updateDoc(doc(db, "courses", editingCourseId), {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });

    setEditingCourseId(null);
    setEditTitle("");
    setEditDescription("");
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

    let fileUrl = null;
    let fileName = null;

    if (lessonFile) {
      const storageRef = ref(
        storage,
        `courses/${activeCourseId}/lessons/${Date.now()}_${lessonFile.name}`
      );
      await uploadBytes(storageRef, lessonFile);
      fileUrl = await getDownloadURL(storageRef);
      fileName = lessonFile.name;
    }

    await addDoc(collection(db, "courses", activeCourseId, "lessons"), {
      title: lessonTitle.trim(),
      content: lessonContent.trim(),
      fileUrl,
      fileName,
      createdAt: serverTimestamp(),
    });

    setLessonTitle("");
    setLessonContent("");
    setLessonFile(null);
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonContent(lesson.content || "");
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!activeCourseId || !editingLessonId) return;

    await updateDoc(
      doc(db, "courses", activeCourseId, "lessons", editingLessonId),
      {
        title: editLessonTitle.trim(),
        content: editLessonContent.trim(),
      }
    );

    setEditingLessonId(null);
  };

  const handleDeleteLesson = async (id) => {
    if (!activeCourseId) return;
    await deleteDoc(doc(db, "courses", activeCourseId, "lessons", id));
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

    // Get all users
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

  // =============== UI ===============
  return (
    <div style={{ padding: 20 }}>
      <h2>Instructor Dashboard</h2>
      <p>Welcome, {user.email}</p>

      {/* CREATE COURSE */}
      <section style={{ marginTop: 16, marginBottom: 20 }}>
        <h3>Create Course</h3>
        <form onSubmit={handleAddCourse}>
          <input
            placeholder="Course Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", marginBottom: 8, width: "100%" }}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ display: "block", marginBottom: 8, width: "100%" }}
          />
          <button type="submit">Add Course</button>
        </form>
      </section>

      {/* COURSE LIST */}
      <section style={{ marginBottom: 20 }}>
        <h3>Courses</h3>
        {courses.length === 0 && <p>No courses yet.</p>}

        {courses.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 10,
              borderBottom: "1px solid #ddd",
              marginBottom: 8,
            }}
          >
            <b>{c.title}</b>
            <div style={{ fontSize: 13, color: "#666" }}>
              {c.description || "No description"}
            </div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => handleSelectCourse(c)}>Lessons</button>
              <button
                onClick={() => startEditCourse(c)}
                style={{ marginLeft: 6 }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCourse(c.id)}
                style={{ marginLeft: 6 }}
              >
                Delete
              </button>
              <button
                onClick={() => handleOpenAnalytics(c)}
                style={{ marginLeft: 6 }}
              >
                Analytics
              </button>
            </div>
          </div>
        ))}

        {editingCourseId && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            <h4>Edit Course</h4>
            <form onSubmit={handleUpdateCourse}>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ display: "block", marginBottom: 8, width: "100%" }}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                style={{ display: "block", marginBottom: 8, width: "100%" }}
              />
              <button type="submit">Save</button>
              <button
                type="button"
                onClick={() => setEditingCourseId(null)}
                style={{ marginLeft: 8 }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ANALYTICS PANEL */}
      {analyticsCourse && (
        <section
          style={{
            marginBottom: 20,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <h3>📊 Analytics: {analyticsCourse.title}</h3>
          {studentsProgress.length === 0 ? (
            <p>No student progress yet.</p>
          ) : (
            studentsProgress.map((stu, idx) => {
              const completed = stu.completedLessons?.length || 0;
              const total = lessons.length || 0;
              const percent =
                total === 0 ? 0 : Math.round((completed / total) * 100);

              return (
                <div
                  key={idx}
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #eee",
                    marginBottom: 8,
                  }}
                >
                  <b>{stu.email}</b>
                  <div
                    style={{
                      width: "100%",
                      background: "#eee",
                      height: 8,
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: 8,
                        borderRadius: 4,
                        background: "green",
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {completed}/{total} lessons ({percent}%)
                  </div>

                  {stu.quizScores && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <b>Quiz Scores:</b>
                      {Object.entries(stu.quizScores).map(
                        ([lessonId, qs]) => (
                          <div key={lessonId}>
                            • Lesson {lessonId}: {qs.score}/{qs.outOf}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <button onClick={() => setAnalyticsCourse(null)}>Close</button>
        </section>
      )}

      {/* LESSON + QUIZ SECTION */}
      {activeCourseId && (
        <section style={{ marginTop: 10 }}>
          <h3>Lessons in {activeCourseTitle}</h3>

          {/* Add Lesson */}
          <form onSubmit={handleAddLesson}>
            <input
              placeholder="Lesson Title"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            <textarea
              placeholder="Lesson Content"
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              rows={3}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />
            <input
              type="file"
              onChange={(e) => setLessonFile(e.target.files[0] || null)}
              style={{ marginBottom: 8 }}
            />
            <button type="submit">Add Lesson</button>
          </form>

          {/* Lesson list */}
          {lessons.map((l) => (
            <div
              key={l.id}
              style={{
                padding: 10,
                borderBottom: "1px solid #ddd",
                marginTop: 10,
              }}
            >
              <b>{l.title}</b>
              <div style={{ fontSize: 13 }}>{l.content}</div>
              {l.fileUrl && (
                <a
                  href={l.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13 }}
                >
                  📎 {l.fileName || "Resource"}
                </a>
              )}
              <div style={{ marginTop: 6 }}>
                <button onClick={() => startEditLesson(l)}>Edit</button>
                <button
                  onClick={() => handleDeleteLesson(l.id)}
                  style={{ marginLeft: 6 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Edit Lesson + Quizzes */}
          {editingLessonId && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              <h4>Edit Lesson</h4>
              <form onSubmit={handleUpdateLesson}>
                <input
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  style={{ display: "block", marginBottom: 8, width: "100%" }}
                />
                <textarea
                  value={editLessonContent}
                  onChange={(e) => setEditLessonContent(e.target.value)}
                  rows={3}
                  style={{ display: "block", marginBottom: 8, width: "100%" }}
                />
                <button type="submit">Save Lesson</button>
              </form>

              {/* QUIZ SECTION */}
              <h4 style={{ marginTop: 16 }}>Quiz Questions</h4>

              {/* Add Quiz */}
              <form onSubmit={handleAddQuiz}>
                <input
                  placeholder="Quiz Question"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  style={{
                    display: "block",
                    marginBottom: 8,
                    width: "100%",
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
                    }}
                  />
                ))}
                <label style={{ fontSize: 13 }}>Correct Option:</label>
                <select
                  value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                  style={{ display: "block", marginBottom: 8 }}
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
                <button type="submit">Add Question</button>
              </form>

              {/* Existing quizzes */}
              {quizzes.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <b>
                    Q{idx + 1}: {q.question}
                  </b>
                  {q.options?.map((op, i) => (
                    <div key={i} style={{ fontSize: 13 }}>
                      {i + 1}. {op}{" "}
                      {q.correctIndex === i && <strong>(correct)</strong>}
                    </div>
                  ))}
                  <button onClick={() => startEditQuiz(q)}>Edit</button>
                  <button
                    onClick={() => handleDeleteQuiz(q.id)}
                    style={{ marginLeft: 6 }}
                  >
                    Delete
                  </button>
                </div>
              ))}

              {/* Edit quiz form */}
              {editingQuizId && (
                <form
                  onSubmit={handleUpdateQuiz}
                  style={{
                    marginTop: 14,
                    padding: 10,
                    background: "#f7f7f7",
                    borderRadius: 6,
                  }}
                >
                  <h5>Edit Quiz Question</h5>
                  <input
                    value={editQuizQuestion}
                    onChange={(e) => setEditQuizQuestion(e.target.value)}
                    style={{
                      display: "block",
                      marginBottom: 8,
                      width: "100%",
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
                      }}
                    />
                  ))}
                  <label style={{ fontSize: 13 }}>Correct Option:</label>
                  <select
                    value={editCorrectIndex}
                    onChange={(e) =>
                      setEditCorrectIndex(Number(e.target.value))
                    }
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    <option value={0}>Option 1</option>
                    <option value={1}>Option 2</option>
                    <option value={2}>Option 3</option>
                    <option value={3}>Option 4</option>
                  </select>
                  <button type="submit">Save Quiz</button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default InstructorDashboard;
