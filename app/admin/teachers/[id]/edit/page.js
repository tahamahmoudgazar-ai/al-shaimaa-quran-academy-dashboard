"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditTeacherPage() {
  const params = useParams();
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeacher() {
      try {
        const response = await fetch(
          `/api/teachers?id=${params.id}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load teacher."
          );
        }

        const teacher = result.teacher;

        setForm({
          fullName: teacher.full_name || "",
          email: teacher.email || "",
          phone: teacher.phone || "",
          specialization: teacher.specialization || "",
          bio: teacher.bio || "",
          hourlyRate:
            teacher.hourly_rate != null
              ? String(teacher.hourly_rate)
              : "",
          status: teacher.status || "active"
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadTeacher();
    }
  }, [params.id]);

  function update(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setError("Teacher name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/teachers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: params.id,
          ...form
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update teacher."
        );
      }

      router.push(`/admin/teachers/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={messageStyle}>
        Loading teacher...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 14,
        padding: 24,
        maxWidth: 700,
        margin: "0 auto"
      }}
    >
      <button
        type="button"
        onClick={() =>
          router.push(`/admin/teachers/${params.id}`)
        }
        style={backButton}
      >
        ← Back to Teacher
      </button>

      <h1 style={{ marginTop: 22, marginBottom: 6 }}>
        Edit Teacher
      </h1>

      <p style={{ color: "#718096", marginTop: 0 }}>
        Update teacher information
      </p>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 16,
          marginTop: 24
        }}
      >
        <Field
          label="Full Name"
          value={form.fullName}
          onChange={(value) =>
            update("fullName", value)
          }
          required
        />

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) =>
            update("email", value)
          }
          required
        />

        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) =>
            update("phone", value)
          }
        />

        <Field
          label="Specialization"
          value={form.specialization}
          onChange={(value) =>
            update("specialization", value)
          }
        />

        <div>
          <label style={labelStyle}>
            Bio
          </label>

          <textarea
            value={form.bio}
            onChange={(e) =>
              update("bio", e.target.value)
            }
            style={{
              ...inputStyle,
              minHeight: 110,
              resize: "vertical"
            }}
          />
        </div>

        <Field
          label="Hourly Rate"
          type="number"
          value={form.hourlyRate}
          onChange={(value) =>
            update("hourlyRate", value)
          }
        />

        <div>
          <label style={labelStyle}>
            Status
          </label>

          <select
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value)
            }
            style={inputStyle}
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            ...saveButton,
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#2d3748",
  marginBottom: 6
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e0",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff"
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#1f7a5a",
  padding: 0,
  cursor: "pointer",
  fontWeight: 600
};

const saveButton = {
  marginTop: 8,
  padding: "12px 18px",
  border: "none",
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 15
};

const messageStyle = {
  padding: 40,
  textAlign: "center",
  color: "#718096",
  background: "#f5f8fb",
  borderRadius: 10
};

const errorStyle = {
  marginTop: 18,
  padding: 12,
  borderRadius: 8,
  background: "#fff5f5",
  color: "#c53030"
};
