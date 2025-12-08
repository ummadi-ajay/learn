import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

function CoursePage({ user }) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({
    completedLessons: [],
  });

  // Load course info
  useEffect(() => {
    const ref = doc(db, "courses", courseId);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setCourse(snap.data());
    });
  }, [courseId]);

  // Load lessons
  useEffect(() => {
    const q = query(
      collection(db, "courses", courseId, "lessons"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [courseId]);

  // Load progress
  useEffect(() => {
    const ref = doc(db, "users", user.uid, "progress", courseId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProgress(snap.data());
    });
  }, [courseId, user.uid]);

  const completed = progress.completedLessons || [];
  const completedCount = completed.length;
  const totalLessons = lessons.length;
  const percent =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const downloadCertificate = () => {
    if (percent !== 100) return;

    const pdf = new jsPDF();
    pdf.text("Certificate of Completion", 105, 40, { align: "center" });
    pdf.text(`Awarded to: ${user.email}`, 105, 70, { align: "center" });
    pdf.text(`Course: ${course.title}`, 105, 90, { align: "center" });
    pdf.save("certificate.pdf");
  };

  return (
    <div style={{ padding: 20 }}>
      {course && (
        <>
          <h2>{course.title}</h2>
          <p>{course.description}</p>

          {/* Progress */}
          <div style={{ marginTop: 10 }}>
            <b>Progress: </b> {completedCount} / {totalLessons} ({percent}%)
            <div
              style={{
                width: "100%",
                height: 8,
                background: "#ddd",
                marginTop: 5,
                borderRadius: 5,
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: 8,
                  background: "#22c55e",
                  borderRadius: 5,
                }}
              ></div>
            </div>

            {percent === 100 && (
              <button
                onClick={downloadCertificate}
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                🎓 Download Certificate
              </button>
            )}
          </div>

          {/* Lessons */}
          <h3 style={{ marginTop: 20 }}>Lessons</h3>

          {lessons.map((l, index) => (
            <div
              key={l.id}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <b>
                {index + 1}. {l.title}
              </b>
              <br />
              <button
                onClick={() =>
                  navigate(`/courses/${courseId}/lessons/${l.id}`)
                }
                style={{
                  marginTop: 6,
                  padding: "5px 9px",
                  background: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Open Lesson
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default CoursePage;
