"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  course_id: "",
  student_id: "",
  teacher_id: "",
  enrollment_id: "",
  schedule_date: "",
  start_time: "18:00",
  end_time: "19:00",
};

async function safeJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text || "Server returned an invalid response.",
    };
  }
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
const [showWeeklyForm, setShowWeeklyForm] = useState(false);
const [weeklySaving, setWeeklySaving] = useState(false);

const [weeklyForm, setWeeklyForm] = useState({
  enrollment_id: "",
  day_of_week: "0",
  start_time: "18:00",
  end_time: "19:00",
});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [search, setSearch] = useState("");
const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
});

const [generatingMonth, setGeneratingMonth] = useState(false); 
 const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  function showError(text) {
    setMessage(text);
    setMessageType("error");
  }

  function showSuccess(text) {
    setMessage(text);
    setMessageType("success");
  }

  async function loadSchedules() {
console.log("LOAD SCHEDULES START");
  try {
      setLoading(true);

      const res = await fetch("/api/schedule", {
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to load schedule (${res.status})`
        );
      }

console.log("SCHEDULE API DATA:", data);
console.log("SCHEDULE COUNT FROM API:", data?.schedules?.length);
setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Load schedules error:", error);

      setSchedules([]);
      showError(
        error.message || "Failed to load schedule."
      );
    } finally {
      setLoading(false);
    }
  }
async function generateMonthlySchedule() {
  if (!selectedMonth) {
    showError("Please select a month.");
    return;
  }

  try {
    setGeneratingMonth(true);
    setMessage("");
    setMessageType("");

    const res = await fetch("/api/schedule/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: selectedMonth,
      }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        data.error ||
          `Failed to generate monthly schedule (${res.status})`
      );
    }

    showSuccess(
      data.message ||
        "Monthly schedule generated successfully."
    );

    await loadSchedules();
  } catch (error) {
    console.error(
      "Generate monthly schedule error:",
      error
    );

    showError(
      error.message ||
        "Failed to generate monthly schedule."
    );
  } finally {
    setGeneratingMonth(false);
  }
}
   async function loadWeeklySchedule(teacherId) {
    if (!teacherId) {
      setWeeklySchedule([]);
      return;
    }

    try {
      setWeeklyLoading(true);

      const res = await fetch(
        `/api/weekly-schedule?teacher_id=${teacherId}`,
        {
          cache: "no-store",
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to load weekly schedule (${res.status})`
        );
      }

      setWeeklySchedule(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Load weekly schedule error:",
        error
      );

      setWeeklySchedule([]);
      showError(
        error.message ||
          "Failed to load weekly schedule."
      );
    } finally {
      setWeeklyLoading(false);
    }
  }
async function saveWeeklyClass(event) {
  event.preventDefault();

  if (!weeklyForm.enrollment_id) {
    showError("Please select a student.");
    return;
  }

  if (weeklyForm.start_time >= weeklyForm.end_time) {
    showError("End time must be later than start time.");
    return;
  }

  try {
    setWeeklySaving(true);
    setMessage("");
    setMessageType("");

    const res = await fetch("/api/weekly-schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enrollment_id: weeklyForm.enrollment_id,
        day_of_week: Number(weeklyForm.day_of_week),
        start_time: weeklyForm.start_time,
        end_time: weeklyForm.end_time,
      }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        data.error ||
          `Failed to save weekly class (${res.status})`
      );
    }

    setShowWeeklyForm(false);

    setWeeklyForm({
      enrollment_id: "",
      day_of_week: "0",
      start_time: "18:00",
      end_time: "19:00",
    });

    showSuccess("Weekly class added successfully.");

    await loadWeeklySchedule(selectedTeacherId);
    await loadSchedules();
  } catch (error) {
    console.error("Save weekly class error:", error);

    showError(
      error.message ||
        "Failed to save weekly class."
    );
  } finally {
    setWeeklySaving(false);
  }
}

async function deleteWeeklyClass(id) {
  const confirmed = window.confirm(
    "Are you sure you want to remove this weekly class?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(
      `/api/weekly-schedule?id=${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        data.error ||
          `Failed to remove weekly class (${res.status})`
      );
    }

    showSuccess(
      "Weekly class removed successfully."
    );

    await loadWeeklySchedule(selectedTeacherId);
    await loadSchedules();
  } catch (error) {
    console.error(
      "Delete weekly class error:",
      error
    );

    showError(
      error.message ||
        "Failed to remove weekly class."
    );
  }
}
  async function loadData() {
    try {
      const [coursesRes, enrollmentsRes] =
        await Promise.all([
          fetch("/api/courses", {
            cache: "no-store",
          }),
          fetch("/api/enrollments", {
            cache: "no-store",
          }),
        ]);

      const coursesData = await safeJson(coursesRes);
      const enrollmentsData = await safeJson(enrollmentsRes);

      if (!coursesRes.ok) {
        throw new Error(
          coursesData.error ||
            `Failed to load courses (${coursesRes.status})`
        );
      }

      if (!enrollmentsRes.ok) {
        throw new Error(
          enrollmentsData.error ||
            `Failed to load enrollments (${enrollmentsRes.status})`
        );
      }

      const enrollmentList =
        Array.isArray(enrollmentsData.enrollments)
          ? enrollmentsData.enrollments
          : [];

      const uniqueTeachers = [];

      enrollmentList.forEach((item) => {
        if (
          item.teacher_id &&
          !uniqueTeachers.some(
            (teacher) =>
              teacher.id === item.teacher_id
          )
        ) {
          uniqueTeachers.push({
            id: item.teacher_id,
            name:
              item.teacher_name ||
              "Teacher",
          });
        }
      });

      setTeachers(uniqueTeachers);
      const activeCourses = Array.isArray(
        coursesData.courses
      )
        ? coursesData.courses.filter(
            (course) => course.status === "active"
          )
        : [];

      setCourses(activeCourses);

      setEnrollments(
        Array.isArray(enrollmentsData.enrollments)
          ? enrollmentsData.enrollments
          : []
      );
    } catch (error) {
      console.error("Load schedule data error:", error);

      setCourses([]);
      setEnrollments([]);

      showError(
        error.message || "Failed to load schedule data."
      );
    }
  }

  useEffect(() => {

async function initialize() {
      console.log("INITIALIZE START");

      await Promise.all([
        loadSchedules(),
        loadData(),
      ]);

      console.log("INITIALIZE DONE");
    }

    initialize();
  }, []);

  const selectedCourseEnrollments =
    enrollments.filter(
      (item) => item.course_id === form.course_id
    );

  const studentsForCourse =
    selectedCourseEnrollments.filter(
      (item, index, array) =>
        item.student_id &&
        array.findIndex(
          (x) => x.student_id === item.student_id
        ) === index
    );

  const teachersForCourse =
    selectedCourseEnrollments.filter(
      (item, index, array) =>
        item.teacher_id &&
        array.findIndex(
          (x) => x.teacher_id === item.teacher_id
        ) === index
    );

  const selectedStudent =
    selectedCourseEnrollments.find(
      (item) =>
        item.student_id === form.student_id &&
        (!form.teacher_id ||
          item.teacher_id === form.teacher_id)
    ) ||
    selectedCourseEnrollments.find(
      (item) =>
        item.student_id === form.student_id
    );

const filteredSchedules =
  schedules.filter((item) => {
    if (
      selectedMonth &&
      !item.schedule_date?.startsWith(
        selectedMonth
      )
    ) {
      return false;
    }

    const text = search.toLowerCase().trim();

    if (!text) return true;

    return (
      item.course_name
        ?.toLowerCase()
        .includes(text) ||
      item.student_name
        ?.toLowerCase()
        .includes(text) ||
      item.teacher_name
        ?.toLowerCase()
        .includes(text) ||
      item.schedule_date?.includes(text)
    );
  });
console.log("MONTH DEBUG:", {
  selectedMonth,
  schedulesCount: schedules.length,
  firstSchedule: schedules[0],
  filteredCount: filteredSchedules.length,
});
const monthlySchedule = [...filteredSchedules].sort(
  (a, b) =>
    new Date(a.schedule_date) -
    new Date(b.schedule_date)
);

const [calendarYear, calendarMonth] =
  selectedMonth.split("-").map(Number);

const firstDayOfMonth = new Date(
  calendarYear,
  calendarMonth - 1,
  1
).getDay();

const daysInMonth = new Date(
  calendarYear,
  calendarMonth,
  0
).getDate();

const classesByDay = {};

monthlySchedule.forEach((item) => {
  const day = Number(item.schedule_date?.slice(-2));

  if (!classesByDay[day]) {
    classesByDay[day] = [];
  }

  classesByDay[day].push(item);
});

const calendarCells = Array.from(
  { length: firstDayOfMonth + daysInMonth },
  (_, index) => {
    const day = index - firstDayOfMonth + 1;

    return day > 0 ? day : null;
  }
);

function getCalendarStatusClass(item) {
  if (item.status === "cancelled") {
    return "calendarClassCancelled";
  }

  if (item.attendance_status === "absent") {
    return "calendarClassAbsent";
  }

  if (item.attendance_status === "late") {
    return "calendarClassLate";
  }

  if (item.attendance_status === "excused") {
    return "calendarClassExcused";
  }

  if (
    item.attendance_status === "present" ||
    item.attendance_status === "attended"
  ) {
    return "calendarClassAttended";
  }

  const classEnd = new Date(
    `${item.schedule_date}T${item.end_time || "00:00:00"}`
  );

  if (classEnd < new Date()) {
    return "calendarClassCompleted";
  }

  return "calendarClassScheduled";
}

function goToPreviousMonth() {
  const date = new Date(
    calendarYear,
    calendarMonth - 2,
    1
  );

  setSelectedMonth(
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`
  );
}

function goToNextMonth() {
  const date = new Date(
    calendarYear,
    calendarMonth,
    1
  );

  setSelectedMonth(
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`
  );
}

function goToCurrentMonth() {
  const date = new Date();

  setSelectedMonth(
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`
  );
}
  function selectCourse(courseId) {
    setForm((current) => ({
      ...current,
      course_id: courseId,
      student_id: "",
      teacher_id: "",
      enrollment_id: "",
    }));

    setMessage("");
    setMessageType("");
  }

  function selectStudent(studentId) {
    const matches =
      selectedCourseEnrollments.filter(
        (item) =>
          item.student_id === studentId
      );

    const match = matches[0];

    setForm((current) => ({
      ...current,
      student_id: studentId,
      teacher_id: match?.teacher_id || "",
      enrollment_id: match?.id || "",
    }));

    setMessage("");
    setMessageType("");
  }

  function selectTeacher(teacherId) {
    const match =
      selectedCourseEnrollments.find(
        (item) =>
          item.teacher_id === teacherId &&
          item.student_id === form.student_id
      );

    setForm((current) => ({
      ...current,
      teacher_id: teacherId,
      enrollment_id:
        match?.id || current.enrollment_id,
    }));

    setMessage("");
    setMessageType("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
    setMessageType("");
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage("");
    setMessageType("");
  }

  async function saveClass(event) {
    event.preventDefault();

    if (!form.schedule_date) {
      showError("Please select a date.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      showError("Please select start and end times.");
      return;
    }

    if (form.start_time >= form.end_time) {
      showError(
        "End time must be later than start time."
      );
      return;
    }

    if (!editingId && !form.course_id) {
      showError("Please select a course.");
      return;
    }

    if (!editingId && !form.student_id) {
      showError("Please select a student.");
      return;
    }

    if (!editingId && !form.teacher_id) {
      showError("Please select a teacher.");
      return;
    }

    if (!editingId && !form.enrollment_id) {
      showError(
        "No active enrollment was found for this student and teacher."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const method = editingId
        ? "PATCH"
        : "POST";

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

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to save class (${res.status})`
        );
      }

      resetForm();

      showSuccess(
        editingId
          ? "Class updated successfully."
          : "Class added successfully."
      );

      await loadSchedules();
    } catch (error) {
      console.error("Save class error:", error);

      showError(
        error.message || "Failed to save class."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    const matchingEnrollment =
      enrollments.find(
        (enrollment) =>
          enrollment.id === item.enrollment_id
      );

    setEditingId(item.id);

    setForm({
      course_id:
        matchingEnrollment?.course_id || "",
      student_id:
        matchingEnrollment?.student_id ||
        item.student_id ||
        "",
      teacher_id:
        matchingEnrollment?.teacher_id ||
        item.teacher_id ||
        "",
      enrollment_id:
        item.enrollment_id || "",
      schedule_date:
        item.schedule_date || "",
      start_time:
        item.start_time?.slice(0, 5) ||
        "18:00",
      end_time:
        item.end_time?.slice(0, 5) ||
        "19:00",
    });

    setShowForm(true);
    setMessage("");
    setMessageType("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteClass(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this class?"
      );

    if (!confirmed) return;

    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(
        "/api/schedule",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to delete class (${res.status})`
        );
      }

      showSuccess(
        "Class deleted successfully."
      );

      await loadSchedules();
    } catch (error) {
      console.error("Delete class error:", error);

      showError(
        error.message ||
          "Failed to delete class."
      );
    }
  }

return (
  <div className="page">

    <div className="weeklySection">
      <div className="sectionHeader">
        <div>
          <h2>Weekly Schedule</h2>
          <p>
            View and manage recurring weekly classes by teacher.
          </p>
        </div>

        <div className="weeklyActions">
          <select
            value={selectedTeacherId}
            onChange={(e) => {
              const teacherId = e.target.value;

              setSelectedTeacherId(teacherId);
              setShowWeeklyForm(false);
              loadWeeklySchedule(teacherId);
            }}
            className="teacherSelect"
          >
            <option value="">
              Select teacher
            </option>

            {teachers.map((teacher) => (
              <option
                key={teacher.id}
                value={teacher.id}
              >
                {teacher.name}
              </option>
            ))}
          </select>

          {selectedTeacherId && (
            <button
              type="button"
              className="addButton"
              onClick={() =>
                setShowWeeklyForm(
                  (current) => !current
                )
              }
            >
              {showWeeklyForm
                ? "Cancel"
                : "+ Add Weekly Class"}
            </button>
          )}
        </div>
      </div>

  {showWeeklyForm && selectedTeacherId && (
    <form
      onSubmit={saveWeeklyClass}
      className="formCard"
      style={{ marginTop: "20px" }}
    >
      <div className="sectionTitle">
        <div className="sectionIcon">
          🔁
        </div>

        <div>
          <h2>Add Weekly Class</h2>
          <p>
            Create a recurring weekly class for this teacher.
          </p>
        </div>
      </div>

      <div className="formGrid">
        <label>
          Student
          <select
            required
            value={weeklyForm.enrollment_id}
            onChange={(e) =>
              setWeeklyForm((current) => ({
                ...current,
                enrollment_id:
                  e.target.value,
              }))
            }
          >
            <option value="">
              Select student
            </option>

            {enrollments
              .filter(
                (item) =>
                  item.teacher_id === selectedTeacherId
              )
              .map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.student_name} —{" "}
                  {item.course_name}
                </option>
              ))}
          </select>
        </label>

        <label>
          Day
          <select
            required
            value={weeklyForm.day_of_week}
            onChange={(e) =>
              setWeeklyForm((current) => ({
                ...current,
                day_of_week:
                  e.target.value,
              }))
            }
          >
            <option value="0">
              Sunday
            </option>
            <option value="1">
              Monday
            </option>
            <option value="2">
              Tuesday
            </option>
            <option value="3">
              Wednesday
            </option>
            <option value="4">
              Thursday
            </option>
            <option value="5">
              Friday
            </option>
            <option value="6">
              Saturday
            </option>
          </select>
        </label>

        <label>
          Start Time
          <input
            type="time"
            required
            value={weeklyForm.start_time}
            onChange={(e) =>
              setWeeklyForm((current) => ({
                ...current,
                start_time:
                  e.target.value,
              }))
            }
          />
        </label>

        <label>
          End Time
          <input
            type="time"
            required
            value={weeklyForm.end_time}
            onChange={(e) =>
              setWeeklyForm((current) => ({
                ...current,
                end_time:
                  e.target.value,
              }))
            }
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "20px",
          gap: "10px",
        }}
      >
        <button
          type="button"
          className="secondaryButton"
          onClick={() =>
            setShowWeeklyForm(false)
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className="addButton"
          disabled={weeklySaving}
        >
          {weeklySaving
            ? "Saving..."
            : "Save Weekly Class"}
        </button>
      </div>
    </form>
  )}

{weeklyLoading ? (
  <div className="emptyState">
    Loading weekly schedule...
  </div>
) : !selectedTeacherId ? (
  <div className="emptyState">
    Select a teacher to view weekly classes.
  </div>
) : weeklySchedule.length === 0 ? (
  <div className="emptyState">
    No weekly classes found for this teacher.
  </div>
) : (
  <div className="weeklyClasses">
    {weeklySchedule.map((item) => (
      <div key={item.id} className="classCard">
        <div>
          <strong>{item.day_of_week}</strong>
        </div>

        <div>
          {item.start_time?.slice(0, 5)} -{" "}
          {item.end_time?.slice(0, 5)}
        </div>

        <button
          type="button"
          onClick={() => deleteWeeklyClass(item.id)}
        >
          Remove
        </button>
      </div>
    ))}
  </div>
)}
      </div>
      <div className="header">
        <div>
          <div className="eyebrow">
            ACADEMY MANAGEMENT
          </div>

          <h1>Schedule</h1>

          <p>
            Manage academy classes and lessons.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            showForm
              ? resetForm()
              : openAddForm()
          }
          className="addButton"
        >
          {showForm
            ? "Cancel"
            : "+ Add Class"}
        </button>
      </div>

      {message && (
        <div
          className={`alert ${
            messageType === "success"
              ? "success"
              : "error"
          }`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveClass}
          className="formCard"
        >
          <div className="sectionTitle">
            <div className="sectionIcon">
              📅
            </div>

            <div>
              <h2>
                {editingId
                  ? "Edit Class"
                  : "Add New Class"}
              </h2>

              <p>
                {editingId
                  ? "Update the class date and time."
                  : "Create a new scheduled class."}
              </p>
            </div>
          </div>

          <div className="formGrid">
            <label>
              Course
              <select
                required
                disabled={!!editingId}
                value={form.course_id}
                onChange={(e) =>
                  selectCourse(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select course
                </option>

                {courses.map((course) => (
                  <option
                    key={course.id}
                    value={course.id}
                  >
                    {course.name?.trim()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Student
              <select
                required
                disabled={
                  !form.course_id ||
                  !!editingId
                }
                value={form.student_id}
                onChange={(e) =>
                  selectStudent(
                    e.target.value
                  )
                }
              >
                <option value="">
                  {!form.course_id
                    ? "Select course first"
                    : studentsForCourse.length ===
                      0
                    ? "No students enrolled"
                    : "Select student"}
                </option>

                {studentsForCourse.map(
                  (item) => (
                    <option
                      key={item.student_id}
                      value={item.student_id}
                    >
                      {item.student_name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Teacher
              <select
                required
                disabled={
                  !form.student_id ||
                  !!editingId
                }
                value={form.teacher_id}
                onChange={(e) =>
                  selectTeacher(
                    e.target.value
                  )
                }
              >
                <option value="">
                  {!form.student_id
                    ? "Select student first"
                    : teachersForCourse.length ===
                      0
                    ? "No teachers assigned"
                    : "Select teacher"}
                </option>

                {teachersForCourse.map(
                  (item) => (
                    <option
                      key={item.teacher_id}
                      value={item.teacher_id}
                    >
                      {item.teacher_name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                required
                value={form.schedule_date}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    schedule_date:
                      e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    start_time:
                      e.target.value,
                  }))
                }
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    end_time:
                      e.target.value,
                  }))
                }
              />
            </label>
          </div>

          {selectedStudent &&
            form.teacher_id && (
              <div className="selectedBox">
                <strong>
                  Selected:
                </strong>{" "}
                {selectedStudent.student_name}
                {" → "}
                {teachersForCourse.find(
                  (item) =>
                    item.teacher_id ===
                    form.teacher_id
                )?.teacher_name ||
                  "Teacher"}
                {" → "}
                {selectedStudent.course_name}
              </div>
            )}

          <div className="formActions">
            <button
              type="submit"
              disabled={saving}
              className="primaryButton"
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
              className="secondaryButton"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="listSection">
        <div className="listHeader">
          <div>
            <h2>Scheduled Classes</h2>
            <p>
              All classes currently scheduled
              in the academy.
            </p>
          </div>

<div className="calendarToolbar">
  <div className="calendarNavigation">
    <button
      type="button"
      className="secondaryButton"
      onClick={goToPreviousMonth}
    >
      Previous
    </button>

    <button
      type="button"
      className="secondaryButton"
      onClick={goToCurrentMonth}
    >
      Today
    </button>

    <button
      type="button"
      className="secondaryButton"
      onClick={goToNextMonth}
    >
      Next
    </button>
  </div>

  <div className="calendarTitle">
    {new Date(
      calendarYear,
      calendarMonth - 1,
      1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}
  </div>

  <input
    type="month"
    value={selectedMonth}
    onChange={(e) =>
      setSelectedMonth(e.target.value)
    }
  />

  <button
    type="button"
    className="addButton"
    onClick={generateMonthlySchedule}
    disabled={generatingMonth}
  >
    {generatingMonth
      ? "Generating..."
      : "Generate Month"}
  </button>

  <div className="searchBox">
    <span>⌕</span>

    <input
      type="text"
      placeholder="Search schedule..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />
  </div>
</div>
</div>

{loading ? (
          <div className="emptyState">
            Loading schedule...
          </div>
        ) : filteredSchedules.length ===
          0 ? (
          <div className="emptyState">
            {schedules.length === 0
              ? "No scheduled classes found."
              : "No classes match your search."}
          </div>
        ) : (
          <div className="monthlyCalendar">
            <div className="calendarWeekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div key={day} className="calendarWeekday">
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="calendarGrid">
              {calendarCells.map((day, index) => {
                const dayClasses = day
                  ? classesByDay[day] || []
                  : [];

                return (
                  <div
                    key={index}
                    className={`calendarCell ${
                      day ? "" : "calendarEmpty"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="calendarDate">
                          {day}
                        </div>

                        <div className="calendarClasses">
                          {dayClasses.map((item) => (
                            <div
                              className={`calendarClass ${getCalendarStatusClass(item)}`}
                              key={item.id}
                            >
                              <strong>
                                {item.start_time?.slice(0, 5)} -{" "}
                                {item.end_time?.slice(0, 5)}
                              </strong>

                              <span>
                                {item.student_name}
                              </span>

                              <span>
                                {item.teacher_name}
                              </span>

                              <span>
                                {item.course_name}
                              </span>

                              <div className="calendarActions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(item)
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteClass(item.id)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

        .addButton,
        .primaryButton,
        .secondaryButton,
        .editButton,
        .deleteButton {
          border-radius: 8px;
          padding: 10px 18px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .addButton,
        .primaryButton {
          border: 1px solid #1f7a5a;
          background: #1f7a5a;
          color: #fff;
        }

        .addButton:hover,
        .primaryButton:hover {
          background: #176747;
        }

        .secondaryButton {
          border: 1px solid #b9cbd8;
          background: #f3f8fb;
          color: #45677f;
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
          margin-bottom: 28px;
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

        input,
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

        input:focus,
        select:focus {
          border-color: #6da8c9;
          box-shadow: 0 0 0 3px
            rgba(109, 168, 201, 0.12);
        }

        select:disabled {
          background: #edf2f7;
          cursor: not-allowed;
        }

        .selectedBox {
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          background: #eaf7f1;
          border: 1px solid #ccebdd;
          color: #276749;
          font-size: 14px;
        }

        .formActions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .listSection {
          margin-top: 10px;
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
          margin-top: 0;
          padding-left: 39px;
        }

        .scheduleGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .classCard {
          background: #fff;
          border: 1px solid #dce8f0;
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 9px
            rgba(24, 55, 80, 0.035);
        }

        .classCard:hover {
          border-color: #bdd8e8;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .cardTop h3 {
          margin: 0 0 10px;
          color: #173b57;
          font-size: 18px;
        }

        .person {
          margin-top: 6px;
          color: #4a5568;
          font-size: 13px;
        }

        .person span {
          color: #718096;
        }

        .status {
          padding: 5px 10px;
          border-radius: 20px;
          background: #e8f6ef;
          color: #277653;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .infoGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
          margin-top: 16px;
        }

        .info {
          background: #f3f8fb;
          border: 1px solid #e5eef4;
          border-radius: 8px;
          padding: 10px;
        }

        .info span {
          display: block;
          color: #7890a1;
          font-size: 10px;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .info strong {
          color: #294b63;
          font-size: 13px;
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

        .monthlyCalendar {
          width: 100%;
          background: #fff;
          border: 1px solid #e1edf4;
          border-radius: 14px;
          overflow: hidden;
        }

        .calendarWeekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background: #f3f8fb;
          border-bottom: 1px solid #dfeaf1;
        }

        .calendarWeekday {
          padding: 13px 10px;
          text-align: center;
          color: #456579;
          font-size: 12px;
          font-weight: 800;
        }

        .calendarGrid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }

        .calendarCell {
          min-height: 150px;
          padding: 10px;
          border-right: 1px solid #e8eff4;
          border-bottom: 1px solid #e8eff4;
          background: #fff;
        }

        .calendarCell:nth-child(7n) {
          border-right: none;
        }

        .calendarEmpty {
          background: #fafcfd;
        }

        .calendarDate {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          border-radius: 50%;
          color: #294b63;
          background: #f3f8fb;
          font-size: 12px;
          font-weight: 800;
        }

        .calendarClasses {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .calendarClass {
          padding: 8px;
          border: 1px solid #dceaf2;
          border-left: 3px solid #347fae;
          border-radius: 8px;
          background: #f8fbfd;
        }

        .calendarClassScheduled {
          background: #d9f0ff;
          border-color: #75bce8;
          border-left: 5px solid #1688c7;
          color: #07527d;
        }

        .calendarClassCompleted {
          background: #e9ecef;
          border-color: #b8c0c8;
          border-left: 5px solid #697681;
          color: #39434c;
        }

        .calendarClassAttended {
          background: #d9f7e6;
          border-color: #7bd5a2;
          border-left: 5px solid #149447;
          color: #096331;
        }

        .calendarClassAbsent {
          background: #ffe0e0;
          border-color: #ef8b8b;
          border-left: 5px solid #d62828;
          color: #9b1515;
        }

        .calendarClassLate {
          background: #fff0cc;
          border-color: #e5b84f;
          border-left: 5px solid #e08a00;
          color: #8a5200;
        }

        .calendarClassExcused {
          background: #eadcff;
          border-color: #b991eb;
          border-left: 5px solid #7b3fc6;
          color: #54258b;
        }

        .calendarClassCancelled {
          background: #ffd6df;
          border-color: #df7892;
          border-left: 5px solid #a61e46;
          color: #761331;
        }

        .calendarClassScheduled strong,
        .calendarClassScheduled span,
        .calendarClassCompleted strong,
        .calendarClassCompleted span,
        .calendarClassAttended strong,
        .calendarClassAttended span,
        .calendarClassAbsent strong,
        .calendarClassAbsent span,
        .calendarClassLate strong,
        .calendarClassLate span,
        .calendarClassExcused strong,
        .calendarClassExcused span,
        .calendarClassCancelled strong,
        .calendarClassCancelled span {
          color: inherit;
        }

        .calendarClass strong,
        .calendarClass span {
          display: block;
        }

        .calendarClass strong {
          margin-bottom: 4px;
          color: #24506c;
          font-size: 11px;
        }

        .calendarClass span {
          margin-top: 2px;
          color: #667f90;
          font-size: 10px;
        }

        .calendarActions {
          display: flex;
          gap: 5px;
          margin-top: 7px;
        }

        .calendarActions button {
          padding: 4px 7px;
          border: 1px solid #d4e2ea;
          border-radius: 6px;
          background: #fff;
          color: #315d77;
          font-family: inherit;
          font-size: 9px;
          cursor: pointer;
        }

        .calendarActions button:hover {
          background: #f1f7fa;
        }

        @media (max-width: 900px) {
          .calendarCell {
            min-height: 130px;
            padding: 7px;
          }

          .calendarClass {
            padding: 6px;
          }

          .calendarClass span {
            font-size: 9px;
          }
        }

        @media (max-width: 600px) {
          .calendarWeekday {
            padding: 10px 4px;
            font-size: 10px;
          }

          .calendarCell {
            min-height: 105px;
            padding: 5px;
          }

          .calendarDate {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .calendarClass {
            border-left-width: 2px;
          }

          .calendarClass strong {
            font-size: 9px;
          }

          .calendarClass span {
            font-size: 8px;
          }

          .calendarActions {
            flex-direction: column;
          }

          .calendarActions button {
            width: 100%;
          }
        }

        .emptyState {
          padding: 35px;
          text-align: center;
          color: #7890a1;
          background: #f3f8fb;
          border: 1px solid #e1edf4;
          border-radius: 12px;
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .formGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .scheduleGrid {
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
