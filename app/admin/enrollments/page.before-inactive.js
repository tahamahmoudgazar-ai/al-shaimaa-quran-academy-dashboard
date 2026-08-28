"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  student_id: "",
  course_id: "",
  teacher_id: "",
};

export default function EnrollmentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [studentsRes, coursesRes, teachersRes, enrollmentsRes] =
        await Promise.all([
          fetch("/api/students", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" }),
          fetch("/api/enrollments", { cache: "no-store" }),
        ]);

      const studentsData = await studentsRes.json();
      const coursesData = await coursesRes.json();
      const teachersData = await teachersRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      if (!studentsRes.ok) {
        throw new Error(
          studentsData.error || "Failed to load students."
        );
      }

      if (!coursesRes.ok) {
        throw new Error(
          coursesData.error || "Failed to load courses."
        );
      }

      if (!teachersRes.ok) {
        throw new Error(
          teachersData.error || "Failed to load teachers."
        );
      }

      if (!enrollmentsRes.ok) {
        throw new Error(
          enrollmentsData.error || "Failed to load enrollments."
        );
      }

      setStudents(
        (studentsData.students || []).filter(
          (student) => student.status === "active"
        )
      );

      setCourses(
        (coursesData.courses || []).filter(
          (course) => course.status === "active"
        )
      );

      setTeachers(
        (teachersData.teachers || []).filter(
          (teacher) => teacher.status === "active"
        )
      );

      setEnrollments(
        enrollmentsData.enrollments || []
      );
    } catch (err) {
      console.error("Load enrollments error:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function change(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

function startEdit(item) {
  setEditingId(item.id);

  setForm({
    student_id: item.student_id || "",
    course_id: item.course_id || "",
    teacher_id: item.teacher_id || "",
  });

  setMessage("");
  setError("");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
  async function saveEnrollment(e) {
    e.preventDefault();

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    if (!form.course_id) {
      setError("Please select a course.");
      return;
    }

    if (!form.teacher_id) {
      setError("Please select a teacher.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/enrollments", {
  method: editingId ? "PUT" : "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(
    editingId
      ? {
          id: editingId,
          ...form,
        }
      : form
  ),
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to add enrollment."
        );
      }

      setMessage(
  editingId
    ? "Enrollment updated successfully."
    : "Enrollment added successfully."
);

setForm(emptyForm);
setEditingId(null);

      await loadData();
    } catch (err) {
      console.error("Add enrollment error:", err);

      setError(
        err.message || "Failed to add enrollment."
      );
    } finally {
      setSaving(false);
    }
  }

async function deleteEnrollment(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this enrollment?"
  );

  if (!confirmed) {
    return;
  }

  setError("");
  setMessage("");

  try {
    const res = await fetch("/api/enrollments", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Failed to delete enrollment."
      );
    }

    setMessage(
      data.deactivated
        ? "Enrollment is connected to a scheduled class and was changed to inactive."
        : "Enrollment deleted successfully."
    );

    await loadData();
  } catch (err) {
    console.error(
      "Delete enrollment error:",
      err
    );

    setError(
      err.message ||
        "Failed to delete enrollment."
    );
  }
}
  return (
    <div className="page">

      <div className="header">
        <div>
          <div className="eyebrow">
            ACADEMY MANAGEMENT
          </div>

          <h1>Enrollments</h1>

          <p>
            Assign students to courses and teachers.
          </p>
        </div>

        <div className="countBox">
          <strong>{enrollments.length}</strong>
          <span>Active Enrollments</span>
        </div>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      <form
        onSubmit={saveEnrollment}
        className="formCard"
      >
        <div className="sectionTitle">
          <div className="sectionIcon">
            🎓
          </div>

          <div>
            {saving
  ? editingId
    ? "Updating..."
    : "Adding..."
  : editingId
    ? "Update Enrollment"
    : "Add Enrollment"}
            <p>
              Connect a student with a course and teacher.
            </p>
          </div>
        </div>

        <div className="formGrid">

          <label>
            Student

            <select
              name="student_id"
              value={form.student_id}
              onChange={change}
              required
            >
              <option value="">
                Select student
              </option>

              {students.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {student.profiles?.full_name ||
                    "Unknown Student"}
                </option>
              ))}
            </select>
          </label>

          <label>
            Course

            <select
              name="course_id"
              value={form.course_id}
              onChange={change}
              required
            >
              <option value="">
                Select course
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Teacher

            <select
              name="teacher_id"
              value={form.teacher_id}
              onChange={change}
              required
            >
              <option value="">
                Select teacher
              </option>

              {teachers.map((teacher) => (
                <option
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.full_name}
                </option>
              ))}
            </select>
          </label>

        </div>

        <div className="formActions">
          <button
            type="submit"
            disabled={saving}
            className="primaryButton"
          >
            {saving
              ? "Adding..."
              : "Add Enrollment"}
          </button>
        </div>
      </form>

      <div className="listSection">

        <div className="listHeader">
          <div>
            <h2>Active Enrollments</h2>
            <p>
              Students currently assigned to courses.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="emptyState">
            Loading enrollments...
          </div>
        ) : enrollments.length === 0 ? (
          <div className="emptyState">
            No active enrollments found.
          </div>
        ) : (
          <div className="enrollmentGrid">

            {enrollments.map((item) => (
              <div
                key={item.id}
                className="enrollmentCard"
              >
                <div className="cardTop">
                  <div>
                    <h3>
                      {item.student_name}
                    </h3>

                    <p>
                      {item.course_name}
                    </p>
                  </div>

                  <span className="status">
                    Active
                  </span>
                </div>

                <div className="teacher">
                  👨‍🏫{" "}
                  <span>Teacher:</span>{" "}
                  <strong>
                    {item.teacher_name}
                  </strong>
                </div>
<div className="cardActions">
  <button
    type="button"
    className="editButton"
    onClick={() => startEdit(item)}
  >
    Edit
  </button>

  <button
    type="button"
    className="deleteButton"
    onClick={() => deleteEnrollment(item.id)}
  >
    Delete
  </button>
</div>
              </div>
            ))}

          </div>
        )}

      </div>

      <style jsx>{`
        .page {
          width: 100%;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .eyebrow {
          color: #3d7fa8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          color: #12324d;
          font-size: 30px;
        }

        .header p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .countBox {
          min-width: 130px;
          padding: 13px 17px;
          background: #eaf4fb;
          border: 1px solid #d6e8f4;
          border-radius: 12px;
          text-align: center;
        }

        .countBox strong {
          display: block;
          color: #123b59;
          font-size: 22px;
        }

        .countBox span {
          color: #638099;
          font-size: 11px;
        }

        .alert {
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .alert.error {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #c53030;
        }

        .alert.success {
          background: #eef8f3;
          border: 1px solid #ccebdd;
          color: #176b4c;
        }

        .formCard {
          background: #fff;
          border: 1px solid #dce8f0;
          border-radius: 15px;
          padding: 22px;
          box-shadow: 0 3px 12px
            rgba(24, 55, 80, 0.04);
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sectionIcon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #eaf4fb;
          font-size: 20px;
        }

        .sectionTitle h2 {
          margin: 0;
          color: #183b57;
          font-size: 19px;
        }

        .sectionTitle p {
          margin: 4px 0 0;
          color: #7a8b99;
          font-size: 12px;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        label {
          display: block;
          color: #334e68;
          font-size: 13px;
          font-weight: 700;
        }

        select {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          border: 1px solid #cbdce8;
          border-radius: 9px;
          background: #fff;
          color: #1a3650;
          padding: 11px 12px;
          font-size: 14px;
          outline: none;
        }

        select:focus {
          border-color: #6da8c9;
          box-shadow: 0 0 0 3px
            rgba(109, 168, 201, 0.12);
        }

        .formActions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .primaryButton {
          border: 1px solid #1f7a5a;
          background: #1f7a5a;
          color: #fff;
          border-radius: 8px;
          padding: 10px 18px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .primaryButton:hover {
          background: #176747;
        }

        .primaryButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .listSection {
          margin-top: 28px;
        }

        .listHeader {
          margin-bottom: 17px;
        }

        .listHeader h2 {
          margin: 0;
          color: #183b57;
          font-size: 20px;
        }

        .listHeader p {
          margin: 5px 0 0;
          color: #7a8b99;
          font-size: 12px;
        }

        .enrollmentGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .enrollmentCard {
          background: #fff;
          border: 1px solid #dce8f0;
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 9px
            rgba(24, 55, 80, 0.035);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .cardTop h3 {
          margin: 0;
          color: #173b57;
          font-size: 18px;
        }

        .cardTop p {
          margin: 6px 0 0;
          color: #708394;
          font-size: 13px;
        }

        .status {
          padding: 5px 10px;
          border-radius: 20px;
          background: #e8f6ef;
          color: #277653;
          font-size: 11px;
          font-weight: 800;
        }

        .teacher {
          margin-top: 15px;
          padding: 10px;
          background: #f3f8fb;
          border: 1px solid #e5eef4;
          border-radius: 8px;
          color: #294b63;
          font-size: 13px;
        }

        .teacher span {
          color: #7890a1;
        }
.cardActions {
  display: flex;
  gap: 9px;
  margin-top: 16px;
}

.cardActions button {
  border-radius: 8px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.editButton {
  border: 1px solid #347fae;
  background: #347fae;
  color: #fff;
}

.editButton:hover {
  background: #286a93;
}

.deleteButton {
  border: 1px solid #d95353;
  background: #d95353;
  color: #fff;
}

.deleteButton:hover {
  background: #c43f3f;
}

        .emptyState {
          padding: 35px;
          text-align: center;
          color: #7890a1;
          background: #f3f8fb;
          border: 1px solid #e1edf4;
          border-radius: 12px;
        }

        @media (max-width: 900px) {
          .formGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .enrollmentGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          h1 {
            font-size: 26px;
          }

          .formCard {
            padding: 16px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .countBox {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
}
