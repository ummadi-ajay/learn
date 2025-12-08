import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { useParams } from "react-router-dom";

function LessonPage({ user }) {
  const { courseId, lessonId } = useParams();

  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Lesson load
  useEffect(() => {
    getDoc(doc(db, "courses", courseId, "lessons", lessonId)).then((snap) => {
      if (snap.exists()) setLesson(snap.data());
    });
  }, [courseId, lessonId]);

  // Quiz load
  useEffect(() => {
    const q = query(
      collection(db, "courses", courseId, "lessons", lessonId, "quizzes"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const markComplete = async () => {
    const progRef = doc(db, "users", user.uid, "progress", courseId);
    const snap = await getDoc(progRef);
    const old = snap.exists() ? snap.data() : { completedLessons: [] };

    await setDoc(progRef, {
      ...old,
      completedLessons: [...old.completedLessons, lessonId],
    });
  };

  const submitQuiz = () => {
    setSubmitted(true);
  };

  return (
    <div style={{ padding: 20 }}>
      {lesson && (
        <>
          <h2>{lesson.title}</h2>
          <p>{lesson.content}</p>

          {lesson.fileUrl && (
            <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
              📄 {lesson.fileName}
            </a>
          )}

          <h3 style={{ marginTop: 20 }}>Quiz</h3>

          {quizzes.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 12 }}>
              <b>
                Q{i + 1}. {q.question}
              </b>

              {q.options.map((opt, index) => (
                <div key={index}>
                  <label>
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted}
                      onChange={() =>
                        setAnswers({ ...answers, [q.id]: index })
                      }
                    />{" "}
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          ))}

          {!submitted && quizzes.length > 0 && (
            <button
              onClick={submitQuiz}
              style={{
                padding: "6px 10px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Submit Quiz
            </button>
          )}

          {submitted && (
            <button
              onClick={markComplete}
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Mark Lesson Complete
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default LessonPage;
