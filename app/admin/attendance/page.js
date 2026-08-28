"use client";

import { useEffect, useState } from "react";

const colors = {
  present: { bg: "#2563eb", light: "#eff6ff", text: "#1d4ed8" },
  absent: { bg: "#dc2626", light: "#fef2f2", text: "#b91c1c" },
  late: { bg: "#d97706", light: "#fffbeb", text: "#b45309" },
  excused: { bg: "#64748b", light: "#f1f5f9", text: "#475569" },
};

export default function AttendancePage() {
  const [schedules, setSchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("present");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [scheduleRes, attendanceRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/attendance"),
      ]);

      const scheduleData = await scheduleRes.json();
      const attendanceData = await attendanceRes.json();

      if (!scheduleRes.ok) {
        setMessage(scheduleData.error || "Failed to load classes");
        return;
      }

      if (!attendanceRes.ok) {
        setMessage(
          attendanceData.error || "Failed to load attendance"
        );
        return;
      }

      setSchedules(scheduleData.schedules || []);
      setAttendance(attendanceData.attendance || []);
    } catch (error) {
      setMessage(error.message || "Failed to load data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedSchedule = schedules.find(
    (item) => item.id === selectedId
  );

  function resetForm() {
    setSelectedId("");
    setStatus("present");
    setNote("");
    setEditingId(null);
    setMessage("");
  }

  async function saveAttendance(e) {
    e.preventDefault();

    if (!selectedSchedule) {
      setMessage("Please select a class.");
      return;
    }

    const studentId = selectedSchedule.student_id;

    if (!studentId) {
      setMessage(
        "Student ID is not available in the schedule data."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/attendance", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                status,
                note,
              }
            : {
                schedule_id: selectedSchedule.id,
                student_id: studentId,
                status,
                note,
              }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data.error || "Failed to save attendance"
        );
        return;
      }

      setMessage(
        editingId
          ? "Attendance updated successfully."
          : "Attendance recorded successfully."
      );

      resetForm();
      await loadData();
    } catch (error) {
      setMessage(
        error.message || "Failed to save attendance"
      );
    } finally {
      setSaving(false);
    }
  }

  function editAttendance(item) {
    setEditingId(item.id);
    setSelectedId(item.schedule_id);
    setStatus(item.status);
    setNote(item.note || "");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteAttendance(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this attendance record?"
      )
    ) {
      return;
    }

    const res = await fetch("/api/attendance", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(
        data.error || "Failed to delete attendance"
      );
      return;
    }

    setMessage("Attendance deleted successfully.");
    await loadData();
  }

  return (
    <div className="attendancePage">

      <div className="pageHeader">
        <div>
          <h1>Attendance</h1>
          <p>
            Track student attendance, absences and late arrivals.
          </p>
        </div>
      </div>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <form
        onSubmit={saveAttendance}
        className="attendanceForm"
      >
        <div className="formTitle">
          <div>
            <h2>
              {editingId
                ? "Edit Attendance"
                : "Record Attendance"}
            </h2>
            <p>
              Select a scheduled class and record the student's
              attendance.
            </p>
          </div>
        </div>

        <label>
          Class

          <select
            required
            disabled={!!editingId}
            value={selectedId}
            onChange={(e) =>
              setSelectedId(e.target.value)
            }
          >
            <option value="">
              Select class
            </option>

            {schedules.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.course_name} —{" "}
                {item.student_name} —{" "}
                {item.schedule_date} —{" "}
                {item.start_time?.slice(0, 5)}
              </option>
            ))}
          </select>
        </label>

        {selectedSchedule && (
          <div className="classInfo">
            <div className="infoTitle">
              Selected Class
            </div>

            <div className="infoGrid">
              <div>
                <span>Student</span>
                <strong>
                  {selectedSchedule.student_name}
                </strong>
              </div>

              <div>
                <span>Teacher</span>
                <strong>
                  {selectedSchedule.teacher_name}
                </strong>
              </div>

              <div>
                <span>Course</span>
                <strong>
                  {selectedSchedule.course_name}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {selectedSchedule.schedule_date}
                </strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  {selectedSchedule.start_time?.slice(0, 5)}
                  {" - "}
                  {selectedSchedule.end_time?.slice(0, 5)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="statusSection">
          <label className="statusLabel">
            Attendance Status
          </label>

          <div className="statusButtons">
            {[
              ["present", "Present"],
              ["absent", "Absent"],
              ["late", "Late"],
              ["excused", "Excused"],
            ].map(([value, label]) => {
              const c = colors[value];

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className="statusButton"
                  style={{
                    borderColor: c.bg,
                    background:
                      status === value
                        ? c.bg
                        : c.light,
                    color:
                      status === value
                        ? "#fff"
                        : c.text,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="noteLabel">
          Note

          <textarea
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
            placeholder="Optional note..."
            rows={3}
          />
        </label>

        <div className="formButtons">
          <button
            type="submit"
            disabled={saving}
            className="saveButton"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Attendance"
              : "Save Attendance"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cancelButton"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="recordsSection">
        <div className="sectionHeader">
          <div>
            <h2>Attendance Records</h2>
            <p>
              Review and manage recorded attendance.
            </p>
          </div>

          <div className="recordCount">
            {attendance.length} Records
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="emptyState">
            No attendance records found.
          </div>
        ) : (
          <div className="recordsGrid">
            {attendance.map((item) => {
              const c =
                colors[item.status] ||
                colors.present;

              return (
                <div
                  key={item.id}
                  className="recordCard"
                >
                  <div className="recordTop">
                    <div>
                      <h3>
                        {item.student_name}
                      </h3>

                      <div className="recordCourse">
                        {item.course_name || "Course"}
                      </div>
                    </div>

                    <span
                      className="recordStatus"
                      style={{
                        background: c.light,
                        color: c.text,
                        borderColor: c.bg,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="recordDetails">
                    <div>
                      <span>Date</span>
                      <strong>
                        {item.schedule_date}
                      </strong>
                    </div>

                    <div>
                      <span>Time</span>
                      <strong>
                        {item.start_time?.slice(0, 5)}
                        {" - "}
                        {item.end_time?.slice(0, 5)}
                      </strong>
                    </div>
                  </div>

                  {item.note && (
                    <div className="recordNote">
                      <strong>Note</strong>
                      <span>{item.note}</span>
                    </div>
                  )}

                  <div className="recordActions">
                    <button
                      onClick={() =>
                        editAttendance(item)
                      }
                      className="editButton"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteAttendance(item.id)
                      }
                      className="deleteButton"
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

      <style jsx>{`
        .attendancePage {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pageHeader {
          margin-bottom: 24px;
        }

        h1 {
          margin: 0;
          color: #19324d;
          font-size: 34px;
          line-height: 1.2;
        }

        .pageHeader p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-weight: 600;
        }

        .attendanceForm {
          background: #fff;
          border: 1px solid #dbe5ef;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 3px 12px rgba(25, 50, 77, 0.05);
        }

        .formTitle {
          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5edf5;
        }

        .formTitle h2,
        .sectionHeader h2 {
          margin: 0;
          color: #19324d;
          font-size: 20px;
        }

        .formTitle p,
        .sectionHeader p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 13px;
        }

        label {
          display: block;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        select,
        textarea {
          display: block;
          width: 100%;
          margin-top: 7px;
          padding: 11px 12px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #1e293b;
          font-size: 14px;
          outline: none;
        }

        select:focus,
        textarea:focus {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .classInfo {
          margin-top: 18px;
          padding: 17px;
          border-radius: 10px;
          background: #f8fbff;
          border: 1px solid #dbeafe;
        }

        .infoTitle {
          color: #19324d;
          font-weight: 800;
          margin-bottom: 13px;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .infoGrid div {
          padding: 10px 12px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e5edf5;
        }

        .infoGrid span,
        .recordDetails span {
          display: block;
          color: #718096;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .infoGrid strong,
        .recordDetails strong {
          color: #2d3748;
          font-size: 13px;
        }

        .statusSection {
          margin-top: 20px;
        }

        .statusLabel {
          margin-bottom: 10px;
        }

        .statusButtons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .statusButton {
          padding: 10px 19px;
          border-width: 2px;
          border-style: solid;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .noteLabel {
          margin-top: 20px;
        }

        textarea {
          resize: vertical;
        }

        .formButtons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .saveButton,
        .cancelButton,
        .editButton,
        .deleteButton {
          border-radius: 8px;
          padding: 10px 19px;
          font-weight: 700;
          cursor: pointer;
        }

        .saveButton {
          border: 1px solid #19324d;
          background: #19324d;
          color: #fff;
        }

        .saveButton:hover {
          background: #244866;
        }

        .cancelButton {
          border: 1px solid #94a3b8;
          background: #fff;
          color: #64748b;
        }

        .recordsSection {
          margin-top: 30px;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 16px;
        }

        .recordCount {
          padding: 7px 12px;
          border-radius: 20px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 12px;
          font-weight: 700;
        }

        .recordsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .recordCard {
          padding: 19px;
          background: #fff;
          border: 1px solid #dbe5ef;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(25, 50, 77, 0.04);
        }

        .recordTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .recordTop h3 {
          margin: 0;
          color: #19324d;
          font-size: 18px;
        }

        .recordCourse {
          margin-top: 5px;
          color: #718096;
          font-size: 12px;
        }

        .recordStatus {
          padding: 5px 10px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .recordDetails {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 17px;
          padding-top: 14px;
          border-top: 1px solid #e5edf5;
        }

        .recordDetails div {
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .recordNote {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 12px;
          padding: 11px;
          border-radius: 8px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
        }

        .recordNote strong {
          color: #19324d;
        }

        .recordActions {
          display: flex;
          gap: 9px;
          margin-top: 16px;
        }

        .editButton {
          border: 1px solid #3182ce;
          background: #3182ce;
          color: #fff;
        }

        .deleteButton {
          border: 1px solid #dc2626;
          background: #dc2626;
          color: #fff;
        }

        .emptyState {
          padding: 35px;
          text-align: center;
          color: #718096;
          background: #fff;
          border: 1px solid #dbe5ef;
          border-radius: 12px;
        }

        @media (max-width: 700px) {
          .attendanceForm {
            padding: 17px;
          }

          h1 {
            font-size: 29px;
          }

          .infoGrid,
          .recordsGrid {
            grid-template-columns: 1fr;
          }

          .sectionHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .recordTop {
            flex-direction: column;
          }

          .recordStatus {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
