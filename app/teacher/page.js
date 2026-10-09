"use client";

import { useEffect, useState } from "react";
	import styles from "./teacher.module.css";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");
const [currentMonth, setCurrentMonth] = useState(
  new Date().getMonth()
);

const [currentYear, setCurrentYear] = useState(
  new Date().getFullYear()
);

  const [progressForm, setProgressForm] = useState({
    student_id: "",
    course_id: "",
    score: "",
    level: "",
    comment: "",
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          profileResponse,
          scheduleResponse,
          studentsResponse,
          progressResponse,
        ] = await Promise.all([
          fetch("/api/teacher/me"),
          fetch("/api/teacher/schedule"),
          fetch("/api/teacher/students"),
          fetch("/api/teacher/progress"),
        ]);

        const profileData = await profileResponse.json();
        const scheduleData = await scheduleResponse.json();
        const studentsData = await studentsResponse.json();
        const progressData = await progressResponse.json();

if (!profileResponse.ok) {
  window.location.href = "/login";
  return;
}

        if (!scheduleResponse.ok) {
          throw new Error(
            scheduleData.error || "Unable to load teacher schedule."
          );
        }

        if (!studentsResponse.ok) {
          throw new Error(
            studentsData.error || "Unable to load students."
          );
        }

        if (!progressResponse.ok) {
          throw new Error(
            progressData.error || "Unable to load progress."
          );
        }

        setProfile(profileData.profile);
        setSchedules(scheduleData.schedules || []);
        setStudents(studentsData.students || []);
        setProgress(progressData.progress || []);
      } catch (err) {
        console.error("Teacher dashboard error:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleProgressChange = (event) => {
    const { name, value } = event.target;

    setProgressForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

const handleStudentChange = (event) => {
  const studentId = event.target.value;

  const selectedStudent = students.find(
    (student) => student.id === studentId
  );

  const firstCourse = selectedStudent?.courses?.find(
    (course) => course?.course_id
  );

  setProgressForm((current) => ({
    ...current,
    student_id: studentId,
    course_id: firstCourse?.course_id || "",
  }));
};
  const handleProgressSubmit = async (event) => {
    event.preventDefault();
if (
  progressForm.student_id === "null" ||
  progressForm.course_id === "null"
) {
  setError("Please select a valid student and course.");
  return;
}
    setProgressLoading(true);
    setProgressMessage("");
    setError("");

try {
  const response = await fetch("/api/teacher/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(progressForm),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to save progress."
    );
  }
const progressResponse = await fetch("/api/teacher/progress");
const progressData = await progressResponse.json();

if (progressResponse.ok) {
  setProgress(progressData.progress || []);
}

      setProgressMessage("Progress saved successfully.");

      setProgressForm({
        student_id: "",
        course_id: "",
        score: "",
        level: "",
        comment: "",
      });
    } catch (err) {
      console.error("Progress save error:", err);
      setError(err.message || "Unable to save progress.");
    } finally {
      setProgressLoading(false);
    }
  };

const monthName = new Date(
  currentYear,
  currentMonth,
  1
).toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

const monthlySchedules = schedules.filter((schedule) => {
  const date = new Date(
    `${schedule.schedule_date}T${schedule.start_time}`
  );

  return (
    date.getMonth() === currentMonth &&
    date.getFullYear() === currentYear
  );
});

const teacherFirstDayOfMonth = new Date(
  currentYear,
  currentMonth,
  1
).getDay();

const teacherDaysInMonth = new Date(
  currentYear,
  currentMonth + 1,
  0
).getDate();

const teacherClassesByDay = {};

monthlySchedules.forEach((schedule) => {
  const day = Number(
    schedule.schedule_date?.slice(-2)
  );

  if (!teacherClassesByDay[day]) {
    teacherClassesByDay[day] = [];
  }

  teacherClassesByDay[day].push(schedule);
});

const teacherCalendarCells = Array.from(
  {
    length:
      teacherFirstDayOfMonth +
      teacherDaysInMonth,
  },
  (_, index) => {
    const day =
      index -
      teacherFirstDayOfMonth +
      1;

    return day > 0 ? day : null;
  }
);

const changeMonth = (direction) => {
  const date = new Date(
    currentYear,
    currentMonth + direction,
    1
  );

  setCurrentMonth(date.getMonth());
  setCurrentYear(date.getFullYear());
};

const getScheduleStatus = (schedule) => {
  if (schedule.status === "cancelled") {
    return {
      label: "Cancelled",
      className: styles.statusCancelled,
    };
  }

  if (
    schedule.attendance_status === "absent" ||
    schedule.attendance_status === "Absent"
  ) {
    return {
      label: "Absent",
      className: styles.statusAbsent,
    };
  }

  if (
    schedule.attendance_status === "attended" ||
    schedule.attendance_status === "present" ||
    schedule.attendance_status === "Present"
  ) {
    return {
      label: "Attended",
      className: styles.statusAttended,
    };
  }

  if (
    schedule.attendance_status === "late" ||
    schedule.attendance_status === "Late"
  ) {
    return {
      label: "Late",
      className: styles.statusLate,
    };
  }

  if (
    schedule.attendance_status === "excused" ||
    schedule.attendance_status === "Excused"
  ) {
    return {
      label: "Excused",
      className: styles.statusExcused,
    };
  }

  const classEnd = new Date(
    `${schedule.schedule_date}T${schedule.end_time}`
  );

  if (classEnd < new Date()) {
    return {
      label: "Completed",
      className: styles.statusCompleted,
    };
  }

  return {
    label: "Scheduled",
    className: styles.statusScheduled,
  };
};
  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          Loading teacher dashboard...
        </div>
      </main>
    );
  }

  const teacherName = profile?.full_name || "Teacher";

  const initials = teacherName
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>AQ</div>

          <div>
            <div className={styles.logoTitle}>
              Al Shaimaa
            </div>

            <div className={styles.logoSubtitle}>
              Quran Academy
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <a
            href="/teacher"
            className={`${styles.navItem} ${styles.activeNav}`}
          >
            <span>⌂</span>
            Dashboard
          </a>

          <a href="#students" className={styles.navItem}>
            <span>👨‍🎓</span>
            My Students
          </a>

          <a href="#schedule" className={styles.navItem}>
            <span>📅</span>
            My Schedule
          </a>

          <a href="#progress" className={styles.navItem}>
            <span>📈</span>
            Student Progress
          </a>

          <a href="#earnings" className={styles.navItem}>
            <span>💰</span>
            My Earnings
          </a>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.teacherMini}>
            <div className={styles.avatar}>{initials}</div>

            <div>
              <div className={styles.miniName}>
                {teacherName}
              </div>

              <div className={styles.miniRole}>
                Teacher
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={async () => {
              const { createBrowserClient } =
                await import("@supabase/ssr");

              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              );

              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Teacher Dashboard</h1>

            <p>
              Manage your classes, students, and teaching activities.
            </p>
          </div>

          <div className={styles.profile}>
            <div className={styles.avatar}>{initials}</div>

            <div>
              <div className={styles.profileName}>
                {teacherName}
              </div>

              <div className={styles.profileRole}>
                Teacher
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {progressMessage && (
          <div className={styles.success}>
            {progressMessage}
          </div>
        )}

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Upcoming Classes
            </div>

            <div className={styles.statValue}>
              {schedules.length}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              My Students
            </div>

            <div className={styles.statValue}>
              {students.length}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Progress Records
            </div>

            <div className={styles.statValue}>
              {progress.length}
            </div>
          </div>
        </section>

<section
  id="schedule"
  className={`${styles.panel} ${styles.sectionPanel}`}
>
  <div className={styles.panelHeader}>
    <div>
      <h2>My Monthly Schedule</h2>

      <p>
        All your classes and students for the selected month.
      </p>
    </div>

    <div className={styles.monthControls}>
      <button
        type="button"
        className={styles.monthButton}
        onClick={() => changeMonth(-1)}
      >
        ‹
      </button>

      <div className={styles.monthTitle}>
        {monthName}
      </div>

      <button
        type="button"
        className={styles.monthButton}
        onClick={() => changeMonth(1)}
      >
        ›
      </button>
    </div>
  </div>

  <div className={styles.scheduleLegend}>
    <span>
      <i className={styles.legendScheduled}></i>
      Scheduled
    </span>

    <span>
      <i className={styles.legendCompleted}></i>
      Completed
    </span>

    <span>
      <i className={styles.legendAttended}></i>
      Attended
    </span>

    <span>
      <i className={styles.legendAbsent}></i>
      Absent
    </span>

    <span>
      <i className={styles.legendCancelled}></i>
      Cancelled
    </span>
  </div>

  {monthlySchedules.length === 0 ? (
    <div className={styles.empty}>
      No classes scheduled for {monthName}.
    </div>
  ) : (
    <div className={styles.teacherCalendar}>
      <div className={styles.teacherCalendarWeekdays}>
        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (
          <div
            key={day}
            className={styles.teacherCalendarWeekday}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={styles.teacherCalendarGrid}>
        {teacherCalendarCells.map((day, index) => {
          const dayClasses = day
            ? teacherClassesByDay[day] || []
            : [];

          return (
            <div
              key={index}
              className={`${styles.teacherCalendarCell} ${
                day
                  ? ""
                  : styles.teacherCalendarEmpty
              }`}
            >
              {day && (
                <>
                  <div className={styles.teacherCalendarDate}>
                    {day}
                  </div>

                  <div className={styles.teacherCalendarClasses}>
                    {dayClasses.map((schedule) => {
                      const status =
                        getScheduleStatus(schedule);

                      return (
                        <div
                          key={schedule.id}
                          className={`${styles.teacherCalendarClass} ${status.className}`}
                        >
                          <div className={styles.teacherCalendarClassInner}>
                            <div className={styles.teacherCalendarTime}>
                              {schedule.start_time
                                ? schedule.start_time.slice(0, 5)
                                : "—"}
                              <span>–</span>
                              {schedule.end_time
                                ? schedule.end_time.slice(0, 5)
                                : "—"}
                            </div>

                            <div className={styles.teacherCalendarStudent}>
                              {schedule.student_name || "Unknown Student"}
                            </div>

                            <div className={styles.teacherCalendarCourse}>
                              {schedule.course_name || "Unknown Course"}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )}

</section>

        <section
          id="students"
          className={`${styles.panel} ${styles.sectionPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>My Students</h2>

              <p>
                Students currently assigned to you.
              </p>
            </div>

            <div className={styles.count}>
              {students.length} student
              {students.length === 1 ? "" : "s"}
            </div>
          </div>

          {students.length === 0 ? (
            <div className={styles.empty}>
              No students are currently assigned to you.
            </div>
          ) : (
            <div className={styles.studentGrid}>
              {students.map((student) => (
                <div
                  key={student.id}
                  className={styles.studentCard}
                >
                  <div className={styles.studentAvatar}>
                    {student.full_name
                      .split(" ")
                      .map((name) => name[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className={styles.studentDetails}>
                    <div className={styles.studentCardName}>
                      {student.full_name}
                    </div>

                    <div className={styles.studentCountry}>
                      {student.country ||
                        "Country not specified"}
                    </div>

                    <div className={styles.courseList}>
                      {student.courses?.map((course) => (
                        <span
                          key={course.enrollment_id}
                          className={styles.courseBadge}
                        >
                          {course.course_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className={styles.activeBadge}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          id="progress"
          className={`${styles.panel} ${styles.sectionPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>Student Progress</h2>

              <p>
                Track and update Quran learning progress.
              </p>
            </div>

            <div className={styles.count}>
              {progress.length} record
              {progress.length === 1 ? "" : "s"}
            </div>
          </div>

          <form
            onSubmit={handleProgressSubmit}
            className={styles.progressForm}
          >
            <div className={styles.formField}>
              <label>Student</label>

              <select
                name="student_id"
                value={progressForm.student_id}
                onChange={handleStudentChange}
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
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label>Course</label>

              <select
                name="course_id"
                value={progressForm.course_id}
                onChange={handleProgressChange}
                disabled={!progressForm.student_id}
              >
                <option value="">
                  Select course
                </option>

                {students
                  .find(
                    (student) =>
                      student.id ===
                      progressForm.student_id
                  )
                  ?.courses?.map((course) => (
                    <option
                      key={course.course_id}
                      value={course.course_id}
                    >
                      {course.course_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label>Score</label>

              <input
                type="number"
                name="score"
                min="0"
                max="100"
                step="0.01"
                value={progressForm.score}
                onChange={handleProgressChange}
                placeholder="0 - 100"
              />
            </div>

            <div className={styles.formField}>
              <label>Level</label>

              <select
                name="level"
                value={progressForm.level}
                onChange={handleProgressChange}
              >
                <option value="">
                  Select level
                </option>

                <option value="Beginner">
                  Beginner
                </option>

                <option value="Elementary">
                  Elementary
                </option>

                <option value="Intermediate">
                  Intermediate
                </option>

                <option value="Advanced">
                  Advanced
                </option>

                <option value="Excellent">
                  Excellent
                </option>
              </select>
            </div>

            <div className={styles.formFieldWide}>
              <label>Comment</label>

              <textarea
                name="comment"
                value={progressForm.comment}
                onChange={handleProgressChange}
                rows="3"
                placeholder="Write a short progress note..."
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={progressLoading}
              >
                {progressLoading
                  ? "Saving..."
                  : "Save Progress"}
              </button>
            </div>
          </form>

          <div className={styles.progressList}>
            {progress.length === 0 ? (
              <div className={styles.empty}>
                No progress records yet.
              </div>
            ) : (
              progress.map((item, index) => (
                <div
                  key={item.id || `progress-${index}`}
                  className={styles.progressItem}
                >
                  <div>
                    <div className={styles.progressStudent}>
                      {item.student_name}
                    </div>

                    <div className={styles.progressCourse}>
                      {item.course_name}
                    </div>
                  </div>

                  <div className={styles.progressScore}>
                    {item.score !== null &&
                    item.score !== undefined
                      ? `${item.score}%`
                      : "—"}
                  </div>

                  <div className={styles.progressLevel}>
                    {item.level || "—"}
                  </div>

                  <div className={styles.progressComment}>
                    {item.comment || "No comment"}
                  </div>

                  <div className={styles.progressDate}>
                    {new Date(
                      item.recorded_at
                    ).toLocaleDateString("en-US")}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          id="earnings"
          className={`${styles.panel} ${styles.sectionPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>My Earnings</h2>

              <p>
                Teaching earnings and completed classes.
              </p>
            </div>
          </div>

          <div className={styles.empty}>
            Earnings will be connected here.
          </div>
        </section>

        <section
          id="zoom"
          className={`${styles.panel} ${styles.sectionPanel}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>Online Classes</h2>

              <p>
                Zoom classroom integration.
              </p>
            </div>
          </div>

          <div className={styles.empty}>
            Zoom integration will be connected after the
            teacher system is complete.
          </div>
        </section>
      </section>
    </main>
  );
}
