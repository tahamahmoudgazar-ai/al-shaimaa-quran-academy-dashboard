"use client";

import { useEffect, useState } from "react";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    course_id: "",
    student_id: "",
    teacher_id: "",
    enrollment_id: "",
    schedule_date: "",
    start_time: "18:00",
    end_time: "19:00",
  };

  const [form, setForm] = useState(emptyForm);

  async function loadSchedules() {
    try {
      const res = await fetch("/api/schedule", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to load schedule");
        return;
      }

      setSchedules(data.schedules || []);
    } catch (error) {
      setMessage(error.message || "Failed to load schedule");
    }
  }

  async function loadData() {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/enrollments"),
      ]);

      const coursesData = await coursesRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      if (!coursesRes.ok) {
        setMessage(coursesData.error || "Failed to load courses");
        return;
      }

      if (!enrollmentsRes.ok) {
        setMessage(
          enrollmentsData.error || "Failed to load enrollments"
        );
        return;
      }

      setCourses(
        (coursesData.courses || []).filter(
          (course) => course.status === "active"
        )
      );

      setEnrollments(enrollmentsData.enrollments || []);
    } catch (error) {
      setMessage(error.message || "Failed to load data");
    }
  }

  useEffect(() => {
    loadSchedules();
    loadData();
  }, []);

  const selectedCourseEnrollments = enrollments.filter(
    (item) => item.course_id === form.course_id
  );

  const studentsForCourse = selectedCourseEnrollments.filter(
    (item, index, array) =>
      array.findIndex(
        (x) => x.student_id === item.student_id
      ) === index
  );

  const teachersForCourse = selectedCourseEnrollments.filter(
    (item, index, array) =>
      array.findIndex(
        (x) => x.teacher_id === item.teacher_id
      ) === index
  );

  const selectedStudent = selectedCourseEnrollments.find(
    (item) => item.student_id === form.student_id
  );

  const filteredSchedules = schedules.filter((item) => {
    const text = search.toLowerCase().trim();

    if (!text) return true;

    return (
      item.course_name?.toLowerCase().includes(text) ||
      item.student_name?.toLowerCase().includes(text) ||
      item.teacher_name?.toLowerCase().includes(text) ||
      item.schedule_date?.includes(text)
    );
  });

  function selectCourse(courseId) {
    setForm({
      ...form,
      course_id: courseId,
      student_id: "",
      teacher_id: "",
      enrollment_id: "",
    });
  }

  function selectStudent(studentId) {
    const match = selectedCourseEnrollments.find(
      (item) => item.student_id === studentId
    );

    setForm({
      ...form,
      student_id: studentId,
      teacher_id: match?.teacher_id || "",
      enrollment_id: match?.id || "",
    });
  }

  function selectTeacher(teacherId) {
    const match = selectedCourseEnrollments.find(
      (item) =>
        item.teacher_id === teacherId &&
        item.student_id === form.student_id
    );

    setForm({
      ...form,
      teacher_id: teacherId,
      enrollment_id:
        match?.id || form.enrollment_id,
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
  }

  async function saveClass(event) {
    event.preventDefault();

    if (!editingId && !form.enrollment_id) {
      setMessage(
        "Please select a course, student and teacher with an active enrollment."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const method = editingId ? "PATCH" : "POST";

      const body = editingId
        ? {
            id: editingId,
            schedule_date: form.schedule_date,
            start_time: form.start_time,
            end_time: form.end_time,
          }
        : {
            enrollment_id: form.enrollment_id,
            schedule_date: form.schedule_date,
            start_time: form.start_time,
            end_time: form.end_time,
          };

      const res = await fetch("/api/schedule", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to save class");
        return;
      }

      resetForm();
      await loadSchedules();
    } catch (error) {
      setMessage(error.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    const matchingEnrollment = enrollments.find(
      (enrollment) => enrollment.id === item.enrollment_id
    );

    setEditingId(item.id);

    setForm({
      course_id: matchingEnrollment?.course_id || "",
      student_id: matchingEnrollment?.student_id || "",
      teacher_id: matchingEnrollment?.teacher_id || "",
      enrollment_id: item.enrollment_id || "",
      schedule_date: item.schedule_date || "",
      start_time: item.start_time?.slice(0, 5) || "18:00",
      end_time: item.end_time?.slice(0, 5) || "19:00",
    });

    setShowForm(true);
    setMessage("");
  }

  async function deleteClass(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this class?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const res = await fetch("/api/schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to delete class");
        return;
      }

      await loadSchedules();
    } catch (error) {
      setMessage(error.message || "Failed to delete class");
    }
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "30px auto",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e3e9ef",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Schedule</h1>

            <p
              style={{
                color: "#718096",
                marginBottom: 0,
              }}
            >
              Manage academy classes and lessons.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
                setMessage("");
              }
            }}
            style={addButton}
          >
            {showForm ? "Cancel" : "+ Add Class"}
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: 14,
              marginTop: 18,
              borderRadius: 9,
              background: "#fff5f5",
              color: "#c53030",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={saveClass}
            style={{
              marginTop: 22,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              background: "#f8fafc",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Class" : "Add New Class"}
            </h2>

            <label style={labelStyle}>
              Course
              <select
                required
                disabled={!!editingId}
                value={form.course_id}
                onChange={(e) => selectCourse(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select course</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name.trim()}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Student
              <select
                required
                disabled={!form.course_id || !!editingId}
                value={form.student_id}
                onChange={(e) => selectStudent(e.target.value)}
                style={inputStyle}
              >
                <option value="">
                  {!form.course_id
                    ? "Select course first"
                    : studentsForCourse.length === 0
                    ? "No students enrolled"
                    : "Select student"}
                </option>

                {studentsForCourse.map((item) => (
                  <option
                    key={item.student_id}
                    value={item.student_id}
                  >
                    {item.student_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Teacher
              <select
                required
                disabled={!form.student_id || !!editingId}
                value={form.teacher_id}
                onChange={(e) => selectTeacher(e.target.value)}
                style={inputStyle}
              >
                <option value="">
                  {!form.student_id
                    ? "Select student first"
                    : teachersForCourse.length === 0
                    ? "No teachers assigned"
                    : "Select teacher"}
                </option>

                {teachersForCourse.map((item) => (
                  <option
                    key={item.teacher_id}
                    value={item.teacher_id}
                  >
                    {item.teacher_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedStudent && form.teacher_id && (
              <div
                style={{
                  marginTop: 15,
                  padding: 14,
                  borderRadius: 10,
                  background: "#eaf7f1",
                  color: "#276749",
                }}
              >
                <strong>Selected:</strong>{" "}
                {selectedStudent.student_name} →{" "}
                {
                  teachersForCourse.find(
                    (item) =>
                      item.teacher_id === form.teacher_id
                  )?.teacher_name
                }{" "}
                → {selectedStudent.course_name}
              </div>
            )}

            <label style={labelStyle}>
              Date
              <input
                type="date"
                required
                value={form.schedule_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schedule_date: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <label style={labelStyle}>
                Start Time
                <input
                  type="time"
                  required
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_time: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                End Time
                <input
                  type="time"
                  required
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_time: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={saveButton}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Class"
                  : "Save Class"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            marginTop: 25,
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>

          <input
            type="text"
            placeholder="Search schedule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...searchInput,
              paddingLeft: 44,
            }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          {filteredSchedules.length === 0 ? (
            <div style={messageStyle}>
              {schedules.length === 0
                ? "No scheduled classes found."
                : "No classes match your search."}
            </div>
          ) : (
            filteredSchedules.map((item) => (
              <div
                key={item.id}
                style={courseCard}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#1a202c",
                      }}
                    >
                      {item.course_name}
                    </div>

                    <div
                      style={{
                        marginTop: 7,
                        color: "#4a5568",
                      }}
                    >
                      👩‍🎓 Student:{" "}
                      <strong>{item.student_name}</strong>
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        color: "#4a5568",
                      }}
                    >
                      👨‍🏫 Teacher:{" "}
                      <strong>{item.teacher_name}</strong>
                    </div>
                  </div>

                  <span style={statusBadge}>
                    {item.status || "scheduled"}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div style={infoRow}>
                    📅 <strong>{item.schedule_date}</strong>
                  </div>

                  <div style={infoRow}>
                    🕐{" "}
                    <strong>
                      {item.start_time?.slice(0, 5)} -{" "}
                      {item.end_time?.slice(0, 5)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    style={editButton}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteClass(item.id)}
                    style={deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const addButton = {
  padding: "10px 18px",
  border: "1px solid #1f7a5a",
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const saveButton = {
  padding: "10px 20px",
  border: "1px solid #1f7a5a",
  background: "#1f7a5a",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const cancelButton = {
  padding: "10px 18px",
  border: "1px solid #718096",
  background: "#718096",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const editButton = {
  padding: "10px 22px",
  border: "1px solid #3182ce",
  background: "#3182ce",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const deleteButton = {
  padding: "10px 22px",
  border: "1px solid #e53e3e",
  background: "#e53e3e",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const labelStyle = {
  display: "block",
  marginTop: 15,
  fontSize: 14,
  fontWeight: 600,
  color: "#2d3748",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 11,
  border: "1px solid #cbd5e0",
  borderRadius: 8,
  boxSizing: "border-box",
  background: "#fff",
  fontSize: 14,
};

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #cbd5e0",
  borderRadius: 9,
  fontSize: 15,
  outline: "none",
  background: "#fff",
};

const courseCard = {
  padding: 20,
  marginBottom: 15,
  border: "1px solid #e3e9ef",
  borderRadius: 14,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const statusBadge = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: 20,
  background: "#e6f4ea",
  color: "#276749",
  fontSize: 12,
  fontWeight: 700,
};

const infoRow = {
  marginTop: 6,
  color: "#4a5568",
};

const messageStyle = {
  padding: 35,
  textAlign: "center",
  color: "#718096",
  background: "#f5f8fb",
  borderRadius: 10,
};
