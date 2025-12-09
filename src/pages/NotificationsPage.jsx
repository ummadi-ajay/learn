// src/pages/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

function NotificationsPage({ user }) {
  const [notifications, setNotifications] = useState([]);

  // Load notifications for this user in real time
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "notifications");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(list);
    });

    return () => unsub();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    if (!user || !id) return;
    try {
      const ref = doc(db, "users", user.uid, "notifications", id);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          const ref = doc(db, "users", user.uid, "notifications", n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #e5e7eb",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You are all caught up 🎉"}
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "white",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          padding: 8,
        }}
      >
        {notifications.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No notifications yet. New lessons, announcements, and results will
            appear here.
          </p>
        ) : (
          notifications.map((n) => {
            const created =
              n.createdAt?.toDate?.().toLocaleString() ?? "Just now";

            return (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkAsRead(n.id)}
                style={{
                  padding: "10px 12px",
                  marginBottom: 6,
                  borderRadius: 10,
                  background: n.read ? "white" : "#eef2ff",
                  border: n.read
                    ? "1px solid #e5e7eb"
                    : "1px solid #6366f1",
                  cursor: n.read ? "default" : "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 4,
                    gap: 6,
                  }}
                >
                  {!n.read && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4f46e5",
                        display: "inline-block",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {n.title || "Notification"}
                  </span>
                </div>

                {n.body && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#4b5563",
                      marginBottom: 4,
                    }}
                  >
                    {n.body}
                  </p>
                )}

                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  {created}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
