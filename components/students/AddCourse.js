"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCourse({ studentId }) {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoadingData(true);

      const [coursesResponse, teachersResponse] =
        await Promise.all([
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/teachers", { cache: "no-store" })
        ]);

      const coursesData = await coursesResponse.json();
      const teachersData = await teachersResponse.json();

      setCourses(
  (coursesData.courses ||
    coursesData.data ||
    []
  ).filter((course) => course.status === "active")
);

      setTeachers(
        teachersData.teachers ||
        teachersData.data ||
        []
      );
    } catch {
      setMessage("Failed to load courses.");
    } finally {
      setLoadingData(false);
    }
  }

  // Load when component mounts
  useState(() => {
    loadData();
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!courseId) {
      setMessage("Please select a course.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/enrollments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            student_id: studentId,
            course_id: courseId,
            teacher_id: teacherId || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add course."
        );
      }

      setMessage(
        "Course added successfully."
      );

      setCourseId("");
      setTeacherId("");

      router.refresh();
    } catch (error) {
      setMessage(
        error?.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 18,
        padding: 18,
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 12
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          color: "#16324f"
        }}
      >
        Add Course
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14
        }}
      >
        <label style={labelStyle}>
          Course

          <select
            value={courseId}
            onChange={(e) =>
              setCourseId(e.target.value)
            }
            disabled={loadingData || loading}
            style={inputStyle}
          >
            <option value="">
              {loadingData
                ? "Loading courses..."
                : "Select course"}
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

        <label style={labelStyle}>
          Teacher

          <select
            value={teacherId}
            onChange={(e) =>
              setTeacherId(e.target.value)
            }
            disabled={loadingData || loading}
            style={inputStyle}
          >
            <option value="">
              Select teacher
            </option>

            {teachers.map((teacher) => (
              <option
                key={teacher.id}
                value={teacher.id}
              >
                {teacher.full_name ||
                  teacher.name ||
                  "Teacher"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || loadingData}
        style={{
          marginTop: 16,
          padding: "10px 18px",
          border: 0,
          borderRadius: 8,
          background: "#1f7a5a",
          color: "#fff",
          fontWeight: 700,
          cursor:
            loading || loadingData
              ? "default"
              : "pointer"
        }}
      >
        {loading
          ? "Adding..."
          : "Add Course"}
      </button>

      {message && (
        <div
          style={{
            marginTop: 12,
            color: message.includes("success")
              ? "#276749"
              : "#c53030",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  fontSize: 13,
  color: "#475569",
  fontWeight: 600
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d8e0e8",
  borderRadius: 8,
  background: "#fff",
  fontSize: 14,
  color: "#1a202c"
};
