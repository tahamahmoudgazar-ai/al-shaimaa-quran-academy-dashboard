"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const days = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

export default function WeeklyScheduleForm(props) {
  const router = useRouter();

  const enrollments = Array.isArray(props?.enrollments)
    ? props.enrollments
    : [];

  const [enrollmentId, setEnrollmentId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("6");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedEnrollment =
    enrollments.find(
      (item) => item && item.id === enrollmentId
    ) || null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!enrollmentId) {
      setMessage("Please select a course.");
      return;
    }

    if (startTime >= endTime) {
      setMessage("End time must be after start time.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/weekly-schedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            enrollment_id: enrollmentId,
            day_of_week: Number(dayOfWeek),
            start_time: startTime,
            end_time: endTime
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add class."
        );
      }

      setMessage(
        "Weekly class added successfully."
      );

      setEnrollmentId("");
      setDayOfWeek("6");
      setStartTime("18:00");
      setEndTime("19:00");

      router.refresh();
    } catch (error) {
      setMessage(
        error?.message || "Something went wrong."
      );
    } finally {
      setSaving(false);
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
        Add Weekly Class
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14
        }}
      >
        <label style={labelStyle}>
          Course

          <select
            value={enrollmentId}
            onChange={(e) =>
              setEnrollmentId(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Select course
            </option>

            {enrollments.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.courseName || "Course"}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Teacher

          <input
            value={
              selectedEnrollment?.teacherName || ""
            }
            readOnly
            placeholder="Select course first"
            style={{
              ...inputStyle,
              background: "#f8fafc"
            }}
          />
        </label>

        <label style={labelStyle}>
          Day

          <select
            value={dayOfWeek}
            onChange={(e) =>
              setDayOfWeek(e.target.value)
            }
            style={inputStyle}
          >
            {days.map((day) => (
              <option
                key={day.value}
                value={day.value}
              >
                {day.label}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Start Time

          <input
            type="time"
            value={startTime}
            onChange={(e) =>
              setStartTime(e.target.value)
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          End Time

          <input
            type="time"
            value={endTime}
            onChange={(e) =>
              setEndTime(e.target.value)
            }
            style={inputStyle}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{
          marginTop: 16,
          padding: "10px 18px",
          border: 0,
          borderRadius: 8,
          background: "#1f7a5a",
          color: "#fff",
          fontWeight: 700,
          cursor: saving
            ? "default"
            : "pointer"
        }}
      >
        {saving
          ? "Saving..."
          : "Add Weekly Class"}
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
  boxSizing: "border-box",
  padding: "10px 11px",
  border: "1px solid #d5dce5",
  borderRadius: 8,
  background: "#fff",
  color: "#16324f",
  fontSize: 14
};
