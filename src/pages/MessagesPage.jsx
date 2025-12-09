import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function MessagesPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load latest messages in real time
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
    });

    return () => unsub();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) return;

    setSending(true);

    try {
      await addDoc(collection(db, "messages"), {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
      // you can show a toast / small error later
    } finally {
      setSending(false);
    }
  };

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
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Messages</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
        Global chat room for all users. (v1)
      </p>

      {/* Messages list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 4px",
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.userId === user.uid;
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "6px 10px",
                    borderRadius: 12,
                    background: isMe ? "#5b21b6" : "#e5e7eb",
                    color: isMe ? "white" : "#111827",
                    fontSize: 13,
                  }}
                >
                  {/* name */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 2,
                      opacity: 0.9,
                    }}
                  >
                    {isMe ? "You" : m.userName || "User"}
                  </div>
                  {/* text */}
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: sending ? "#9ca3af" : "#5b21b6",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MessagesPage;
