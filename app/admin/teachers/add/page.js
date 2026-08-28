"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTeacherPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    bio: "",
    hourlyRate: "",
    status: "active"
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value
    }));
  }

  async function saveTeacher() {
    setSaving(true);
    setMessage("Saving...");

    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add teacher");
      }

      setMessage("Teacher added successfully.");

      setTimeout(() => {
        router.push("/admin/teachers");
      }, 700);
    } catch (error) {
      setMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <div style={{
      maxWidth: 650,
      background: "#fff",
      padding: 24,
      borderRadius: 14,
      border: "1px solid #e3e9ef"
    }}>
      <h1 style={{ marginTop: 0 }}>Add Teacher</h1>

      <div style={{ display: "grid", gap: 16 }}>

        <label>
          Full Name
          <input
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Specialization
          <input
            placeholder="Quran & Tajweed"
            value={form.specialization}
            onChange={(e) => update("specialization", e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Bio
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: "vertical"
            }}
          />
        </label>

        <label>
          Hourly Rate
          <input
            type="number"
            min="0"
            value={form.hourlyRate}
            onChange={(e) => update("hourlyRate", e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <button
          type="button"
          onClick={saveTeacher}
          disabled={saving}
          style={{
            background: saving ? "#8ab9a8" : "#1f7a5a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: 14,
            fontSize: 16,
            fontWeight: 600
          }}
        >
          {saving ? "Saving..." : "Save Teacher"}
        </button>

        {message && (
          <div style={{
            padding: 10,
            borderRadius: 8,
            background: "#f3f7f5",
            color: "#1f7a5a",
            fontWeight: 600
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "1px solid #d5dce5",
  borderRadius: 8,
  boxSizing: "border-box",
  fontSize: 16
};
