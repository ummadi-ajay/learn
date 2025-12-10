// src/pages/AdminPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

function AdminPage({ user }) {
  // courses
  const [courses, setCourses] = useState([]);
  const [courseEdits, setCourseEdits] = useState({});
  const [courseSaving, setCourseSaving] = useState({});
  const [courseMsg, setCourseMsg] = useState(null);

  // users
  const [users, setUsers] = useState([]);
  const [userEdits, setUserEdits] = useState({});
  const [userSaving, setUserSaving] = useState({});
  const [userMsg, setUserMsg] = useState(null);

  const purple = "#6d28d9";
  const purpleLight = "#f5f3ff";

  // ---- load courses ----
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourses(arr);

      setCourseEdits((prev) => {
        const copy = { ...prev };
        arr.forEach((c) => {
          if (!copy[c.id]) copy[c.id] = c.imageUrl || "";
        });
        return copy;
      });
    });
  }, []);

  // ---- load users ----
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("email", "asc"));
    return onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(arr);

      setUserEdits((prev) => {
        const copy = { ...prev };
        arr.forEach((u) => {
          if (!copy[u.id]) {
            copy[u.id] = {
              name: u.name || "",
              avatarPath: u.avatarPath || "",
              role: u.role || "student",
              studentId: u.studentId || "",   // ⭐ NEW FIELD
            };
          }
        });
        return copy;
      });
    });
  }, []);

  // ---- save course image url ----
  const handleSaveCourse = async (courseId) => {
    const value = courseEdits[courseId] ?? "";
    setCourseSaving((s) => ({ ...s, [courseId]: true }));
    setCourseMsg(null);

    try {
      await updateDoc(doc(db, "courses", courseId), {
        imageUrl: value.trim() || null,
      });
      setCourseMsg("Saved course image URL.");
    } catch (err) {
      console.error(err);
      setCourseMsg("Error saving course – see console.");
    }
    setCourseSaving((s) => ({ ...s, [courseId]: false }));
  };

  // ---- save user info ----
  const handleSaveUser = async (userId) => {
    const edits =
      userEdits[userId] || {
        name: "",
        avatarPath: "",
        role: "student",
        studentId: "",
      };

    setUserSaving((s) => ({ ...s, [userId]: true }));
    setUserMsg(null);

    try {
      await updateDoc(doc(db, "users", userId), {
        name: edits.name.trim() || null,
        avatarPath: edits.avatarPath.trim() || null,
        role: edits.role || "student",
        studentId: edits.studentId.trim() || null,  // ⭐ SAVE CUSTOM ID
      });
      setUserMsg("Saved user profile.");
    } catch (err) {
      console.error(err);
      setUserMsg("Error saving user – see console.");
    }
    setUserSaving((s) => ({ ...s, [userId]: false }));
  };

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
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Admin Panel
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          Logged in as <b>{user?.email}</b>. You can edit course images and user
          profiles stored in Firestore.
        </p>
        <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>
          ⚠️ Passwords are handled by Firebase Auth and are never visible here.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.4fr)",
            gap: 18,
            alignItems: "flex-start",
          }}
        >
          {/* COURSES SECTION — same as you already have */}

          {/* USERS SECTION */}
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
                marginBottom: 8,
              }}
            >
              Users – name, avatar, role & custom ID
            </h3>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 0 }}>
              All data is from the <code>users</code> collection.
            </p>

            {users.length === 0 && (
              <p style={{ fontSize: 13, color: "#6b7280" }}>No users yet.</p>
            )}

            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {users.map((u) => {
                const edits =
                  userEdits[u.id] || {
                    name: "",
                    avatarPath: "",
                    role: "student",
                    studentId: "",
                  };

                return (
                  <div
                    key={u.id}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {u.email || "(no email field)"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginBottom: 4,
                      }}
                    >
                      ID (auth UID): {u.id}
                    </div>

                    {/* Custom student ID */}
                    <label style={{ fontSize: 11, color: "#6b7280" }}>
                      Custom ID (roll no / student ID)
                    </label>
                    <input
                      value={edits.studentId}
                      onChange={(e) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [u.id]: {
                            ...prev[u.id],
                            studentId: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. STU-001 / 23BA001"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    />

                    <label style={{ fontSize: 11, color: "#6b7280" }}>
                      Display name
                    </label>
                    <input
                      value={edits.name}
                      onChange={(e) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [u.id]: {
                            ...prev[u.id],
                            name: e.target.value,
                          },
                        }))
                      }
                      placeholder="Display name"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    />

                    <label style={{ fontSize: 11, color: "#6b7280" }}>
                      Avatar path or URL
                    </label>
                    <input
                      value={edits.avatarPath}
                      onChange={(e) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [u.id]: {
                            ...prev[u.id],
                            avatarPath: e.target.value,
                          },
                        }))
                      }
                      placeholder="/images/avatars/vinay.jpeg"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "7px 9px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    />

                    <label style={{ fontSize: 11, color: "#6b7280" }}>
                      Role
                    </label>
                    <select
                      value={edits.role}
                      onChange={(e) =>
                        setUserEdits((prev) => ({
                          ...prev,
                          [u.id]: {
                            ...prev[u.id],
                            role: e.target.value,
                          },
                        }))
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      <option value="student">student</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>

                    <button
                      onClick={() => handleSaveUser(u.id)}
                      disabled={userSaving[u.id]}
                      style={{
                        padding: "6px 11px",
                        borderRadius: 999,
                        border: "none",
                        background: userSaving[u.id] ? "#9ca3af" : "#2563eb",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: userSaving[u.id] ? "not-allowed" : "pointer",
                      }}
                    >
                      {userSaving[u.id] ? "Saving..." : "Save user"}
                    </button>
                  </div>
                );
              })}
            </div>

            {userMsg && (
              <p
                style={{
                  fontSize: 12,
                  color: userMsg.startsWith("Error") ? "#b91c1c" : "#16a34a",
                  marginTop: 8,
                }}
              >
                {userMsg}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
