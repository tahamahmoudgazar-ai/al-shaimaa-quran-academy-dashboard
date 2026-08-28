"use client";

import { useEffect, useState } from "react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadTeachers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teachers", {
        cache: "no-store"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load teachers."
        );
      }

      setTeachers(result.teachers || []);
    } catch (error) {
      console.error("Teachers error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function deleteTeacher(teacher) {
    const name = teacher.full_name || "this teacher";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/teachers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: teacher.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete teacher."
        );
      }

      alert("Teacher deleted successfully.");
      loadTeachers();
    } catch (error) {
      alert(error.message);
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return true;

    const name =
      teacher.full_name?.toLowerCase() || "";

    const email =
      teacher.email?.toLowerCase() || "";

    const specialization =
      teacher.specialization?.toLowerCase() || "";

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      specialization.includes(searchText)
    );
  });

  if (loading) {
    return (
      <div style={messageStyle}>
        Loading teachers...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          ...messageStyle,
          background: "#fff5f5",
          color: "#c53030"
        }}
      >
        Unable to load teachers.
        <div style={{ marginTop: 8 }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e3e9ef",
          borderRadius: 14,
          padding: 28
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap"
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>
              Teachers
            </h1>

            <p
              style={{
                color: "#718096",
                marginBottom: 0
              }}
            >
              Manage your academy teachers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.assign(
                "/admin/teachers/add"
              );
            }}
            style={addButton}
          >
            + Add Teacher
          </button>
        </div>

        <div
          style={{
            marginBottom: 18,
            position: "relative"
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "#718096",
              pointerEvents: "none"
            }}
          >
            🔍
          </span>

          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              ...searchInput,
              paddingLeft: 44
            }}
          />
        </div>

        {filteredTeachers.length === 0 ? (
          <div style={messageStyle}>
            {teachers.length === 0
              ? "No teachers found."
              : "No teachers match your search."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 14
            }}
          >
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e3e9ef",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#1a202c"
                      }}
                    >
                      {teacher.full_name ||
                        "Teacher"}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 14,
                        color: "#718096"
                      }}
                    >
                      {teacher.email || "—"}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: 20,
                      background: "#e6f4ea",
                      color: "#276749",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {teacher.status || "active"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                    marginTop: 18
                  }}
                >
                  <Info
                    label="Specialization"
                    value={teacher.specialization}
                  />

                  <Info
                    label="Hourly Rate"
                    value={
                      teacher.hourly_rate != null
                        ? `$${teacher.hourly_rate}`
                        : "—"
                    }
                  />
                </div>

                {teacher.bio && (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: 10
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#718096",
                        marginBottom: 4
                      }}
                    >
                      Bio
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#2d3748",
                        wordBreak: "break-word"
                      }}
                    >
                      {teacher.bio}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 18,
                    flexWrap: "wrap"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      window.location.assign(
                        `/admin/teachers/${teacher.id}`
                      );
                    }}
                    style={viewButton}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.assign(
                        `/admin/teachers/${teacher.id}`
                      );
                    }}
                    style={editButton}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteTeacher(teacher)
                    }
                    style={deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 8,
        padding: 10,
        minWidth: 0
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#718096",
          marginBottom: 4
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#2d3748",
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordBreak: "break-word"
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #cbd5e0",
  borderRadius: 9,
  fontSize: 15,
  outline: "none",
  background: "#fff"
};

const messageStyle = {
  padding: 40,
  textAlign: "center",
  color: "#718096",
  background: "#f5f8fb",
  borderRadius: 10,
  marginTop: 20
};

const addButton = {
  padding: "9px 18px",
  border: "1px solid #1f7a5a",
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};


const viewButton = {
  padding: "9px 18px",
  border: "1px solid #1f7a5a",
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};

const editButton = {
  padding: "9px 18px",
  border: "1px solid #3182ce",
  background: "#3182ce",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};

const deleteButton = {
  padding: "9px 18px",
  border: "1px solid #e53e3e",
  background: "#e53e3e",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};
