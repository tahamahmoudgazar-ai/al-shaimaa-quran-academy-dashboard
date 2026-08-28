"use client";

import { useEffect, useState } from "react";

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/students", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load students.");
      }

      setStudents(result.students || []);
    } catch (error) {
      console.error("Students error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function deleteStudent(student) {
    const profile = Array.isArray(student.profiles)
      ? student.profiles[0]
      : student.profiles;

    const name = profile?.full_name || "this student";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/students/${student.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete student."
        );
      }

      alert("Student deleted successfully.");
      loadStudents();
    } catch (error) {
      alert(error.message);
    }
  }

  const searchText = search.toLowerCase().trim();

  const filteredStudents = students.filter((student) => {
    const profile = Array.isArray(student.profiles)
      ? student.profiles[0]
      : student.profiles;

    if (!searchText) return true;

    const name = profile?.full_name?.toLowerCase() || "";
    const email = profile?.email?.toLowerCase() || "";
    const country = student.country?.toLowerCase() || "";

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      country.includes(searchText)
    );
  });

  if (loading) {
    return (
      <div style={messageStyle}>
        Loading students...
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <strong>Unable to load students.</strong>
        <div style={{ marginTop: 8 }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>

      {/* Search */}
      <div style={searchArea}>
        <div style={searchBox}>
          <span style={searchIcon}>⌕</span>

          <input
            type="text"
            placeholder="Search by name, email or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={clearButton}
            >
              ×
            </button>
          )}
        </div>

        <div style={resultCount}>
          {filteredStudents.length}{" "}
          {filteredStudents.length === 1
            ? "student"
            : "students"}
        </div>
      </div>

      {/* Empty */}
      {filteredStudents.length === 0 ? (
        <div style={emptyCard}>
          <div style={emptyIcon}>👤</div>

          <strong>
            {students.length === 0
              ? "No students yet"
              : "No students found"}
          </strong>

          <p>
            {students.length === 0
              ? "Add your first student to get started."
              : "Try searching with a different name, email or country."}
          </p>
        </div>
      ) : (
        <div style={studentsGrid}>
          {filteredStudents.map((student) => {
            const profile = Array.isArray(student.profiles)
              ? student.profiles[0]
              : student.profiles;

            const name = profile?.full_name || "Student";
            const email = profile?.email || "No email";
            const status = student.status || "active";

            return (
              <div
                key={student.id}
                style={studentCard}
              >
                {/* Header */}
                <div style={studentHeader}>
                  <div style={identity}>
                    <div style={avatar}>
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={studentName}>
                        {name}
                      </div>

                      <div style={studentEmail}>
                        {email}
                      </div>
                    </div>
                  </div>

                  <span style={statusBadge}>
                    {status}
                  </span>
                </div>

                {/* Information */}
                <div style={infoGrid}>
                  <Info
                    label="Country"
                    value={student.country}
                  />

                  <Info
                    label="Parent"
                    value={student.parent_name}
                  />

                  <Info
                    label="Phone"
                    value={student.parent_phone}
                  />
                </div>

                {/* Actions */}
                <div style={actions}>
                  <button
                    type="button"
                    onClick={() =>
                      window.location.assign(
                        `/admin/students/${student.id}`
                      )
                    }
                    style={viewButton}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.assign(
                        `/admin/students/${student.id}/edit`
                      )
                    }
                    style={editButton}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteStudent(student)
                    }
                    style={deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoBox}>
      <div style={infoLabel}>
        {label}
      </div>

      <div style={infoValue}>
        {value || "—"}
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */

const searchArea = {
  marginBottom: 20,
};

const searchBox = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const searchIcon = {
  position: "absolute",
  left: 14,
  fontSize: 22,
  color: "#718096",
  pointerEvents: "none",
  lineHeight: 1,
};

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 42px",
  border: "1px solid #d9e2ea",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#1a202c",
};

const clearButton = {
  position: "absolute",
  right: 10,
  width: 28,
  height: 28,
  border: 0,
  borderRadius: "50%",
  background: "#edf2f7",
  color: "#718096",
  fontSize: 18,
  cursor: "pointer",
};

const resultCount = {
  marginTop: 8,
  fontSize: 12,
  color: "#718096",
};

const studentsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
};

const studentCard = {
  background: "#fff",
  border: "1px solid #e3e9ef",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.035)",
};

const studentHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const identity = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  minWidth: 0,
};

const avatar = {
  width: 42,
  height: 42,
  minWidth: 42,
  borderRadius: 12,
  background: "#edf3f8",
  color: "#17324d",
  display: "grid",
  placeItems: "center",
  fontSize: 17,
  fontWeight: 800,
};

const studentName = {
  fontSize: 16,
  fontWeight: 700,
  color: "#1a202c",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const studentEmail = {
  marginTop: 3,
  fontSize: 12,
  color: "#718096",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const statusBadge = {
  padding: "5px 9px",
  borderRadius: 20,
  background: "#e6f4ea",
  color: "#276749",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 17,
};

const infoBox = {
  background: "#f8fafc",
  borderRadius: 9,
  padding: 10,
  minWidth: 0,
};

const infoLabel = {
  fontSize: 10,
  color: "#718096",
  marginBottom: 4,
};

const infoValue = {
  fontSize: 12,
  fontWeight: 600,
  color: "#2d3748",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actions = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr 1fr",
  gap: 8,
  marginTop: 16,
};

const viewButton = {
  padding: "9px 8px",
  border: 0,
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

const editButton = {
  padding: "9px 8px",
  border: "1px solid #3182ce",
  background: "#fff",
  color: "#3182ce",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

const deleteButton = {
  padding: "9px 8px",
  border: "1px solid #e53e3e",
  background: "#fff",
  color: "#e53e3e",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

const messageStyle = {
  padding: 40,
  textAlign: "center",
  color: "#718096",
  background: "#f5f8fb",
  borderRadius: 10,
  marginTop: 20,
};

const errorStyle = {
  padding: 24,
  textAlign: "center",
  color: "#c53030",
  background: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: 10,
  marginTop: 20,
};

const emptyCard = {
  padding: 45,
  textAlign: "center",
  color: "#718096",
  background: "#f8fafc",
  border: "1px dashed #d9e2ea",
  borderRadius: 12,
};

const emptyIcon = {
  fontSize: 32,
  marginBottom: 10,
};
