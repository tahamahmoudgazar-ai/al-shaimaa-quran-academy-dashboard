"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudent() {
      try {
        const response = await fetch(
          `/api/students/${params.id}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load student."
          );
        }

        const student = result.student;
        const profile = Array.isArray(student.profiles)
          ? student.profiles[0]
          : student.profiles;

        setName(profile?.full_name || "");
        setEmail(profile?.email || "");
        setCountry(student.country || "");
        setParentName(student.parent_name || "");
        setParentPhone(student.parent_phone || "");
        setStatus(student.status || "active");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadStudent();
    }
  }, [params.id]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Student name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/students/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            country,
            parentName,
            parentPhone,
            status
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update student."
        );
      }

      router.push(`/admin/students/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={messageStyle}>
        Loading student...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() =>
          router.push(`/admin/students/${params.id}`)
        }
        style={backButton}
      >
        ← Back to Student
      </button>

      <h1 style={{
        marginTop: 22,
        marginBottom: 6
      }}>
        Edit Student
      </h1>

      <p style={{
        marginTop: 0,
        color: "#718096"
      }}>
        Update student information
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
          marginTop: 25
        }}
      >
        <Field
          label="Student Name"
          value={name}
          onChange={setName}
          required
        />

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />

        <Field
          label="Country"
          value={country}
          onChange={setCountry}
        />

        <Field
          label="Parent Name"
          value={parentName}
          onChange={setParentName}
        />

        <Field
          label="Parent Phone"
          value={parentPhone}
          onChange={setParentPhone}
        />

        <div>
          <label style={labelStyle}>
            Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
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
          style={saveButton}
        >
          {saving ? "Saving..." : "Save Changes"}
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

const containerStyle = {
  background: "#fff",
  border: "1px solid #e3e9ef",
  borderRadius: 14,
  padding: 24,
  maxWidth: 700,
  margin: "0 auto"
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
  fontWeight: 600
};
