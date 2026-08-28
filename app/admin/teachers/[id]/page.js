"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export default function TeacherDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [teacher, setTeacher] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [monthlySchedule, setMonthlySchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      if (!params.id) return;

      try {
        const response = await fetch("/api/attendance", {
          cache: "no-store"
        });

        if (!response.ok) {
          setAttendance([]);
          return;
        }

        const result = await response.json();

        const rows = result.attendance || [];

        setAttendance(
          rows.filter(
            (item) => item.teacher_id === params.id
          )
        );
      } catch (err) {
        console.error(err);
        setAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    }

    loadAttendance();
  }, [params.id]);

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

        setTeacher(result.teacher);
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

  useEffect(() => {
  }, [params.id]);

  useEffect(() => {
    async function loadSchedule() {
      if (!params.id) return;

      try {
        const response = await fetch(
          `/api/weekly-schedule?teacher_id=${params.id}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          setSchedule([]);
          return;
        }

        const result = await response.json();

        setSchedule(
          Array.isArray(result)
            ? result
            : result.schedule || result.data || []
        );
      } catch (err) {
        console.error(err);
        setSchedule([]);
      } finally {
        setScheduleLoading(false);
      }
    }

    loadSchedule();
  }, [params.id]);

  useEffect(() => {
  }, [params.id]);

  useEffect(() => {
    async function loadMonthlySchedule() {
      if (!params.id) return;

      try {
        const response = await fetch(
          `/api/schedule?teacher_id=${params.id}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          setMonthlySchedule([]);
          return;
        }

        const result = await response.json();

        setMonthlySchedule(
          Array.isArray(result)
            ? result
            : result.schedules || result.schedule || result.data || []
        );
      } catch (err) {
        console.error(err);
        setMonthlySchedule([]);
      }
    }

    loadMonthlySchedule();
  }, [params.id]);

  if (loading) {
    return (
      <div style={messageStyle}>
        Loading teacher...
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
        {error}
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={messageStyle}>
        Teacher not found.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 14,
        padding: 28,
        maxWidth: 1000,
        margin: "0 auto"
      }}
    >
      <button
        type="button"
        onClick={() =>
          router.push("/admin/teachers")
        }
        style={backButton}
      >
        ← Back to Teachers
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 15,
          marginTop: 24,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#1a202c"
            }}
          >
            {teacher.full_name}
          </h1>

          <p
            style={{
              color: "#718096",
              marginTop: 6
            }}
          >
            {teacher.email || "No email"}
          </p>
        </div>

        <span style={statusStyle}>
          {teacher.status || "active"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 14,
          marginTop: 25
        }}
      >
        <Info
          label="Phone"
          value={teacher.phone}
        />

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

        <Info
          label="Created"
          value={
            teacher.created_at
              ? new Date(
                  teacher.created_at
                ).toLocaleDateString()
              : "—"
          }
        />
      </div>

      <div
        style={{
          marginTop: 18,
          background: "#f8fafc",
          borderRadius: 10,
          padding: 15
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#718096",
            marginBottom: 6
          }}
        >
          Bio
        </div>

        <div
          style={{
            color: "#2d3748",
            lineHeight: 1.6
          }}
        >
          {teacher.bio || "No bio available."}
        </div>
      </div>

      {/* Weekly Schedule */}

      <section
        style={{
          marginTop: 28,
          borderTop: "1px solid #e3e9ef",
          paddingTop: 24
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#16324f",
                fontSize: 24
              }}
            >
              Weekly Schedule
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#718096",
                fontSize: 14
              }}
            >
              All recurring weekly classes for this teacher.
            </p>
          </div>

          <div
            style={{
              background: "#e6f4ea",
              color: "#276749",
              padding: "7px 13px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700
            }}
          >
            {schedule.length} class
            {schedule.length === 1 ? "" : "es"} / week
          </div>
        </div>

        {scheduleLoading ? (
          <div style={emptyStyle}>
            Loading schedule...
          </div>
        ) : schedule.length === 0 ? (
          <div style={emptyStyle}>
            No weekly classes found for this teacher.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e3e9ef",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 650
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc"
                  }}
                >
                  <th style={thStyle}>
                    Day
                  </th>

                  <th style={thStyle}>
                    Time
                  </th>

                  <th style={thStyle}>
                    Student
                  </th>

                  <th style={thStyle}>
                    Course
                  </th>
                </tr>
              </thead>

              <tbody>
                {schedule.map((item) => (
                  <tr
                    key={item.id}
                    style={getScheduleRowStyle(item)}
                  >
                    <td style={tdStyle}>
                      {dayNames[
                        Number(item.day_of_week)
                      ] || "—"}
                    </td>

                    <td style={tdStyle}>
                      {formatTime(item.start_time)}
                      {" - "}
                      {formatTime(item.end_time)}
                    </td>

                    <td style={tdStyle}>
                      {item.studentName || "—"}
                    </td>

                    <td style={tdStyle}>
                      {item.courseName || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly Schedule */}

      <section
        style={{
          marginTop: 28,
          borderTop: "1px solid #e3e9ef",
          paddingTop: 24
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#16324f",
                fontSize: 24
              }}
            >
              Monthly Schedule
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#718096",
                fontSize: 14
              }}
            >
              Scheduled classes for this month.
            </p>
          </div>

          <div
            style={{
              background: "#edf3f8",
              color: "#16324f",
              padding: "7px 13px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700
            }}
          >
            {monthlySchedule.length} class
            {monthlySchedule.length === 1 ? "" : "es"}
          </div>
        </div>

        {monthlySchedule.length === 0 ? (
          <div style={emptyStyle}>
            No monthly classes found for this teacher.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e3e9ef",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {monthlySchedule.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      {item.schedule_date
                        ? new Date(
                            item.schedule_date + "T00:00:00"
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td style={tdStyle}>
                      {formatTime(item.start_time)}
                      {" - "}
                      {formatTime(item.end_time)}
                    </td>

                    <td style={tdStyle}>
                      {item.student_name || "—"}
                    </td>

                    <td style={tdStyle}>
                      {item.course_name || "—"}
                    </td>

                    <td style={getStatusStyle(item)}>
                      {formatStatus(item.status, item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

```jsx
      {/* Attendance */}

      <section
        style={{
          marginTop: 28,
          borderTop: "1px solid #e3e9ef",
          paddingTop: 24
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#16324f",
                fontSize: 24
              }}
            >
              Attendance
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#718096",
                fontSize: 14
              }}
            >
              Attendance records for this teacher.
            </p>
          </div>

          <div
            style={{
              background: "#edf3f8",
              color: "#16324f",
              padding: "7px 13px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700
            }}
          >
            {attendance.length} record
            {attendance.length === 1 ? "" : "s"}
          </div>
        </div>

        {attendanceLoading ? (
          <div style={emptyStyle}>
            Loading attendance...
          </div>
        ) : attendance.length === 0 ? (
          <div style={emptyStyle}>
            No attendance records found for this teacher.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e3e9ef",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 800
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Note</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((item) => (
                  <tr key={item.id || item.schedule_id}>
                    <td style={tdStyle}>
                      {item.schedule_date
                        ? new Date(
                            item.schedule_date + "T00:00:00"
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td style={tdStyle}>
                      {formatTime(item.start_time)}
                      {" - "}
                      {formatTime(item.end_time)}
                    </td>

                    <td style={tdStyle}>
                      {item.student_name || "—"}
                    </td>

                    <td style={tdStyle}>
                      {item.course_name || "—"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 700,
                        color:
                          item.status === "present"
                            ? "#276749"
                            : item.status === "absent"
                            ? "#c53030"
                            : item.status === "late"
                            ? "#c05621"
                            : "#4a5568"
                      }}
                    >
                      {item.status
                        ? item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)
                        : "—"}
                    </td>

                    <td style={tdStyle}>
                      {item.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
```

            <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 22,
          flexWrap: "wrap"
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/teachers/${teacher.id}/edit`
            )
          }
          style={editButton}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/teachers")
          }
          style={backActionButton}
        >
          Back
        </button>
      </div>
    </div>
  );
}
function formatTime(time) {
  if (!time) return "—";

  return String(time).slice(0, 5);
}

function formatStatus(status, item) {
  if (!status) return "—";

  const value = String(status).toLowerCase();

  if (value === "absent") return "Absent";
  if (value === "rescheduled") return "Rescheduled";
  if (value === "cancelled") return "Cancelled";
  if (value === "completed") return "Completed";

  if (value === "scheduled") {
    if (!item?.schedule_date) {
      return "Upcoming";
    }

    const endTime = item.end_time || item.start_time || "23:59";

    const classEnd = new Date(
      `${item.schedule_date}T${String(endTime).slice(0, 5)}:00`
    );

    if (classEnd.getTime() < Date.now()) {
      return "Completed";
    }

    return "Upcoming";
  }

  return status;
}

function getScheduleRowStyle(item) {
  const status = String(item.status || "").toLowerCase();

  if (status === "absent") {
    return {
      background: "#fff5f5"
    };
  }

  if (status === "rescheduled") {
    return {
      background: "#fffaf0"
    };
  }

  if (status === "cancelled") {
    return {
      background: "#f7fafc"
    };
  }

  if (status === "scheduled" && item.schedule_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const classDate = new Date(
      item.schedule_date + "T00:00:00"
    );

    if (classDate >= today) {
      return {
        background: "#f0fff4"
      };
    }
  }

  return {};
}

function getStatusStyle(item) {
  const status = String(item.status || "").toLowerCase();

  let background = "#edf2f7";
  let color = "#4a5568";

  if (status === "scheduled") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const classDate = item.schedule_date
      ? new Date(item.schedule_date + "T00:00:00")
      : null;

    if (classDate && classDate >= today) {
      background = "#c6f6d5";
      color = "#276749";
    }
  }

  if (status === "absent") {
    background = "#fed7d7";
    color = "#c53030";
  }

  if (status === "rescheduled") {
    background = "#feebc8";
    color = "#c05621";
  }

  if (status === "completed") {
    background = "#bee3f8";
    color = "#2b6cb0";
  }

  if (status === "cancelled") {
    background = "#e2e8f0";
    color = "#4a5568";
  }

  return {
    ...tdStyle,
    borderLeft: "1px solid #e2e8f0",
    background,
    color,
    fontWeight: 700,
    whiteSpace: "nowrap"
  };
}

function Info({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 8,
        padding: 12
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#718096",
          marginBottom: 5
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#2d3748",
          wordBreak: "break-word"
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

const messageStyle = {
  padding: 40,
  textAlign: "center",
  color: "#718096",
  background: "#f5f8fb",
  borderRadius: 10
};

const emptyStyle = {
  padding: 30,
  textAlign: "center",
  color: "#718096",
  background: "#f8fafc",
  borderRadius: 10,
  border: "1px solid #e3e9ef"
};

const thStyle = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  color: "#718096",
  borderBottom: "1px solid #e3e9ef",
  borderRight: "1px solid #e2e8f0",
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "13px 14px",
  fontSize: 14,
  color: "#2d3748",
  borderBottom: "1px solid #edf2f7",
  borderRight: "1px solid #e2e8f0"
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#1f7a5a",
  padding: 0,
  cursor: "pointer",
  fontWeight: 600
};

const statusStyle = {
  padding: "5px 10px",
  borderRadius: 20,
  background: "#e6f4ea",
  color: "#276749",
  fontSize: 12,
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

const backActionButton = {
  padding: "9px 18px",
  border: "1px solid #cbd5e0",
  background: "#fff",
  color: "#4a5568",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};
