import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

function PublicNewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "newsletters"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Newsletter load error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f3ff",
        display: "flex",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "white",
          borderRadius: 18,
          padding: 20,
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          News & Announcements
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
          Posted by instructors. This page is public, login not required.
        </p>

        {loading && <p style={{ fontSize: 14 }}>Loading…</p>}

        {!loading && items.length === 0 && (
          <p style={{ fontSize: 14, color: "#6b7280" }}>No news yet.</p>
        )}

        {!loading &&
          items.map((n) => {
            const text = n.body || n.content || n.message || "";
            const date =
              n.createdAt && n.createdAt.toDate
                ? n.createdAt.toDate().toLocaleString()
                : "Recently";

            return (
              <div
                key={n.id}
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {n.title || "Untitled"}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#4b5563",
                    whiteSpace: "pre-wrap",
                    marginBottom: 6,
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
          })}
      </div>
    </div>
  );
}

export default PublicNewsPage;
