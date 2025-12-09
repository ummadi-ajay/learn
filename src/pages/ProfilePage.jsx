import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function ProfilePage({ user }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    photoURL: "",
  });

  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const refUser = doc(db, "users", user.uid);
        const snap = await getDoc(refUser);

        if (snap.exists()) {
          const data = snap.data();
          const loaded = {
            name: data.name || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            dob: data.dob || "",
            photoURL: data.photoURL || "", // only display
          };
          setForm(loaded);
          setInitialForm(loaded);
        } else {
          const fallback = {
            name: "",
            email: user.email || "",
            phone: "",
            dob: "",
            photoURL: "",
          };
          setForm(fallback);
          setInitialForm(fallback);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    if (initialForm) setForm(initialForm);
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const refUser = doc(db, "users", user.uid);

      await setDoc(
        refUser,
        {
          name: form.name,
          email: form.email || user.email || "",
          phone: form.phone,
          dob: form.dob,
          // ❌ DO NOT change photoURL here – only admin updates it in Firestore
        },
        { merge: true }
      );

      setInitialForm({ ...form });
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Loading profile...</div>;
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #e5e7eb",
        maxWidth: 480,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>My Profile</h2>

      {/* Status messages */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: 8,
            borderRadius: 8,
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: 8,
            borderRadius: 8,
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Photo (view only) */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: "block",
              marginBottom: 6,
            }}
          >
            Profile Photo
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "No photo"
              )}
            </div>

            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Your photo is set by the admin.
            </p>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: "block",
              marginBottom: 4,
            }}
          >
            Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={!editing}
            placeholder="Enter your full name"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: editing ? "white" : "#f9fafb",
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: "block",
              marginBottom: 4,
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            disabled={true}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              fontSize: 14,
              color: "#6b7280",
            }}
          />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Email is linked to your login.
          </p>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: "block",
              marginBottom: 4,
            }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            disabled={!editing}
            placeholder="Enter your phone number"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: editing ? "white" : "#f9fafb",
            }}
          />
        </div>

        {/* DOB */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: "block",
              marginBottom: 4,
            }}
          >
            Date of Birth
          </label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            disabled={!editing}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: editing ? "white" : "#f9fafb",
            }}
          />
        </div>

        {/* UID info */}
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          UID: {user?.uid}
        </p>

        {/* Buttons */}
        {!editing ? (
          <button
            type="button"
            onClick={handleEdit}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              background: "#2563eb",
              color: "white",
            }}
          >
            Edit Profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                background: saving ? "#9ca3af" : "#16a34a",
                color: "white",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                background: "white",
                color: "#374151",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default ProfilePage;
