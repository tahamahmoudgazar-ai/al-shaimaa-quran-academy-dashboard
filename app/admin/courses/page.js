"use client";

import { useEffect, useState } from "react";

const courseOptions = [
  "Quran Memorization",
  "Tajweed Course",
  "Online Quran Classes",
  "Noorani Qaida",
  "Arabic Language",
  "Islamic Studies",
];

const levelOptions = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
];

const emptyForm = {
  name: "",
  description: "",
  level: "",
  duration_weeks: "",
  price: "",
  status: "active",
};

export default function CoursesPage() {
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/courses", {
        cache: "no-store",
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Invalid server response (${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to load courses (${res.status})`
        );
      }

      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (err) {
      console.error("Load courses error:", err);
      setError(err.message || "Failed to load courses.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function change(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.name) {
      setError("Please select a course.");
      return;
    }

    if (!form.level) {
      setError("Please select a level.");
      return;
    }

    if (
      form.duration_weeks !== "" &&
      Number(form.duration_weeks) < 1
    ) {
      setError("Duration must be at least 1 week.");
      return;
    }

    if (
      form.price !== "" &&
      Number(form.price) < 0
    ) {
      setError("Price cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/courses", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                ...form,
                id: editingId,
              }
            : form
        ),
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Invalid server response (${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to save course (${res.status})`
        );
      }

      setMessage(
        editingId
          ? "Course updated successfully."
          : "Course added successfully."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadCourses();
    } catch (err) {
      console.error("Save course error:", err);
      setError(err.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  }

  function editCourse(course) {
    setEditingId(course.id);

    setForm({
      name: course.name || "",
      description: course.description || "",
      level: course.level || "",
      duration_weeks:
        course.duration_weeks != null
          ? String(course.duration_weeks)
          : "",
      price:
        course.price != null
          ? String(course.price)
          : "",
      status: course.status || "active",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function deleteCourse(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${course.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch("/api/courses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: course.id,
        }),
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Invalid server response (${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to delete course (${res.status})`
        );
      }

      setMessage(
        data.message || "Course deleted successfully."
      );

      await loadCourses();
    } catch (err) {
      console.error("Delete course error:", err);
      setError(err.message || "Failed to delete course.");
    }
  }

  const filteredCourses = courses.filter((course) => {
    const text = search.toLowerCase().trim();

    if (!text) return true;

    return (
      (course.name || "").toLowerCase().includes(text) ||
      (course.description || "")
        .toLowerCase()
        .includes(text) ||
      (course.level || "").toLowerCase().includes(text) ||
      (course.status || "").toLowerCase().includes(text)
    );
  });

  return (
    <div className="page">

      <div className="pageHeader">
        <div>
          <div className="eyebrow">
            ACADEMY MANAGEMENT
          </div>

          <h1>Courses</h1>

          <p>
            Create and manage academy courses.
          </p>
        </div>

        <div className="courseCount">
          <strong>{courses.length}</strong>
          <span>Total Courses</span>
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
        onSubmit={save}
        className="formCard"
      >
        <div className="sectionTitle">
          <div className="sectionIcon">
            📚
          </div>

          <div>
            <h2>
              {editingId
                ? "Edit Course"
                : "Add New Course"}
            </h2>

            <p>
              {editingId
                ? "Update the course information below."
                : "Select a course and complete its information."}
            </p>
          </div>
        </div>

        <div className="formGrid">

          <div className="field full">
            <label>
              Course Name
              <span className="required">*</span>
            </label>

            <select
              name="name"
              value={form.name}
              onChange={change}
              required
            >
              <option value="">
                Select Course
              </option>

              {courseOptions.map((course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Level
              <span className="required">*</span>
            </label>

            <select
              name="level"
              value={form.level}
              onChange={change}
              required
            >
              <option value="">
                Select Level
              </option>

              {levelOptions.map((level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Duration
            </label>

            <div className="inputWithSuffix">
              <input
                name="duration_weeks"
                type="number"
                min="1"
                step="1"
                value={form.duration_weeks}
                onChange={change}
                placeholder="e.g. 12"
              />

              <span>Weeks</span>
            </div>
          </div>

          <div className="field">
            <label>
              Price
            </label>

            <div className="inputWithPrefix">
              <span>$</span>

              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={change}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <div className="field">
            <label>
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={change}
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

        </div>

        <div className="descriptionField">
          <label>
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={change}
            placeholder="Write a short description of the course..."
          />
        </div>

        <div className="formActions">

          <button
            type="submit"
            disabled={saving}
            className="primaryButton"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Save Changes"
              : "Add Course"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="secondaryButton"
            >
              Cancel
            </button>
          )}

        </div>
      </form>

      <div className="listSection">

        <div className="listHeader">

          <div>
            <h2>
              Existing Courses
            </h2>

            <p>
              All courses currently available
              in the academy.
            </p>
          </div>

          <div className="searchBox">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

        </div>

        {loading ? (
          <div className="emptyState">
            Loading courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="emptyState">
            {courses.length === 0
              ? "No courses found."
              : "No courses match your search."}
          </div>
        ) : (
          <div className="coursesGrid">

            {filteredCourses.map((course) => (

              <div
                key={course.id}
                className="courseCard"
              >

                <div className="courseTop">

                  <div>
                    <h3>
                      {course.name}
                    </h3>

                    <p>
                      {course.description ||
                        "No description available."}
                    </p>
                  </div>

                  <span
                    className={
                      course.status === "inactive"
                        ? "status inactive"
                        : "status active"
                    }
                  >
                    {course.status || "active"}
                  </span>

                </div>

                <div className="infoGrid">

                  <Info
                    label="Level"
                    value={course.level}
                  />

                  <Info
                    label="Duration"
                    value={
                      course.duration_weeks != null
                        ? `${course.duration_weeks} weeks`
                        : "—"
                    }
                  />

                  <Info
                    label="Price"
                    value={
                      course.price != null
                        ? `$${course.price}`
                        : "—"
                    }
                  />

                </div>

                <div className="cardActions">

                  <button
                    type="button"
                    onClick={() =>
                      editCourse(course)
                    }
                    className="editButton"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteCourse(course)
                    }
                    className="deleteButton"
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

        .pageHeader {
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
          letter-spacing: .08em;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          color: #12324d;
          font-size: 30px;
        }

        .pageHeader p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .courseCount {
          min-width: 115px;
          padding: 13px 17px;
          background: #eaf4fb;
          border: 1px solid #d6e8f4;
          border-radius: 12px;
          text-align: center;
        }

        .courseCount strong {
          display: block;
          color: #123b59;
          font-size: 22px;
        }

        .courseCount span {
          color: #638099;
          font-size: 11px;
        }

        .alert {
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .error {
          background: #fff5f5;
          color: #c53030;
          border: 1px solid #fed7d7;
        }

        .success {
          background: #eef8f3;
          color: #176b4c;
          border: 1px solid #ccebdd;
        }

        .formCard {
          background: #fff;
          border: 1px solid #dce8f0;
          border-radius: 15px;
          padding: 22px;
          box-shadow: 0 3px 12px rgba(24,55,80,.04);
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        label {
          display: block;
          color: #334e68;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .required {
          color: #d95353;
          margin-left: 3px;
        }

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbdce8;
          border-radius: 9px;
          background: #fff;
          color: #1a3650;
          padding: 11px 12px;
          font-size: 14px;
          outline: none;
        }

        select {
          cursor: pointer;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #6da8c9;
          box-shadow: 0 0 0 3px rgba(109,168,201,.12);
        }

        .inputWithSuffix,
        .inputWithPrefix {
          display: flex;
          align-items: center;
          width: 100%;
          border: 1px solid #cbdce8;
          border-radius: 9px;
          background: #fff;
          overflow: hidden;
        }

        .inputWithSuffix:focus-within,
        .inputWithPrefix:focus-within {
          border-color: #6da8c9;
          box-shadow: 0 0 0 3px rgba(109,168,201,.12);
        }

        .inputWithSuffix input,
        .inputWithPrefix input {
          border: 0;
          box-shadow: none;
        }

        .inputWithSuffix span {
          padding: 0 12px;
          color: #7890a1;
          font-size: 12px;
          font-weight: 700;
          border-left: 1px solid #e1eaf0;
          white-space: nowrap;
        }

        .inputWithPrefix span {
          padding: 0 12px;
          color: #7890a1;
          font-size: 14px;
          font-weight: 800;
          border-right: 1px solid #e1eaf0;
        }

        .descriptionField {
          margin-top: 16px;
        }

        textarea {
          min-height: 95px;
          resize: vertical;
        }

        .formActions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        button {
          font-family: inherit;
        }

        .primaryButton,
        .secondaryButton,
        .editButton,
        .deleteButton {
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .primaryButton {
          border: 1px solid #1f6f9d;
          background: #1f6f9d;
          color: #fff;
        }

        .primaryButton:hover {
          background: #195d84;
        }

        .primaryButton:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .secondaryButton {
          border: 1px solid #b9cbd8;
          background: #f3f8fb;
          color: #45677f;
        }

        .listSection {
          margin-top: 28px;
        }

        .listHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 17px;
          flex-wrap: wrap;
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

        .searchBox {
          position: relative;
          width: 100%;
          max-width: 340px;
        }

        .searchBox span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c8aa0;
          font-size: 21px;
          pointer-events: none;
        }

        .searchBox input {
          padding-left: 39px;
        }

        .coursesGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .courseCard {
          background: #fff;
          border: 1px solid #dce8f0;
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 9px rgba(24,55,80,.035);
        }

        .courseCard:hover {
          border-color: #bdd8e8;
        }

        .courseTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .courseTop h3 {
          margin: 0;
          color: #173b57;
          font-size: 18px;
        }

        .courseTop p {
          color: #708394;
          font-size: 13px;
          line-height: 1.5;
          margin: 7px 0 0;
        }

        .status {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status.active {
          background: #e8f6ef;
          color: #277653;
        }

        .status.inactive {
          background: #fff1f1;
          color: #c53030;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 16px;
        }

        .info {
          background: #f3f8fb;
          border: 1px solid #e5eef4;
          border-radius: 8px;
          padding: 9px;
        }

        .infoLabel {
          color: #7890a1;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .infoValue {
          color: #294b63;
          font-size: 13px;
          font-weight: 700;
        }

        .cardActions {
          display: flex;
          gap: 9px;
          margin-top: 16px;
        }

        .editButton {
          border: 1px solid #347fae;
          background: #347fae;
          color: #fff;
        }

        .deleteButton {
          border: 1px solid #d95353;
          background: #d95353;
          color: #fff;
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

          .coursesGrid {
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

          .field.full {
            grid-column: auto;
          }

          .courseCount {
            width: 100%;
            box-sizing: border-box;
          }

          .searchBox {
            max-width: none;
          }

          .infoGrid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info">
      <div className="infoLabel">
        {label}
      </div>

      <div className="infoValue">
        {value || "—"}
      </div>
    </div>
  );
}
