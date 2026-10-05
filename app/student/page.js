"use client";

import { useEffect, useState } from "react";
import styles from "./student.module.css";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentMonth, setCurrentMonth] = useState(
    new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    new Date().getFullYear()
  );
  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/student/dashboard");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load dashboard.");
        }

        setData(result);
      } catch (err) {
        console.error("Student dashboard error:", err);
        setError(err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    const { createBrowserClient } = await import("@supabase/ssr");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className={styles.loading}>Loading student dashboard...</div>;
  }

  if (error) {
    return (
      <div className={styles.loading}>
        <div className={styles.error}>
          <strong>Student Dashboard</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const student = data?.student;
  const enrollments = data?.enrollments || [];
  const schedules = data?.schedules || [];
  const progress = data?.progress || [];
  const attendance = data?.attendance || [];

  const monthlySchedules = schedules.filter((item) => {
    if (!item.schedule_date) return false;

    const date = new Date(
      `${item.schedule_date}T${item.start_time || "00:00:00"}`
    );

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const studentFirstDayOfMonth = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const studentDaysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const studentClassesByDay = {};

  monthlySchedules.forEach((item) => {
    const day = Number(item.schedule_date?.slice(-2));

    if (!studentClassesByDay[day]) {
      studentClassesByDay[day] = [];
    }

    studentClassesByDay[day].push(item);
  });

  const studentCalendarCells = Array.from(
    {
      length:
        studentFirstDayOfMonth +
        studentDaysInMonth,
    },
    (_, index) => {
      const day =
        index -
        studentFirstDayOfMonth +
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

  const monthName = new Date(
    currentYear,
    currentMonth,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const getScheduleStatus = (item) => {
    if (item.status === "cancelled") {
      return {
        label: "Cancelled",
        className: styles.statusCancelled,
      };
    }

    if (item.attendance_status === "absent") {
      return {
        label: "Absent",
        className: styles.statusAbsent,
      };
    }

    if (item.attendance_status === "late") {
      return {
        label: "Late",
        className: styles.statusLate,
      };
    }

    if (
      item.attendance_status === "present" ||
      item.attendance_status === "attended"
    ) {
      return {
        label: "Attended",
        className: styles.statusAttended,
      };
    }

    const classEnd = new Date(
      `${item.schedule_date}T${item.end_time || "00:00:00"}`
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

  const getStudentCalendarStatusClass = (item) => {
    if (item.status === "cancelled") {
      return styles.studentCalendarCancelled;
    }

    if (item.attendance_status === "absent") {
      return styles.studentCalendarAbsent;
    }

    if (item.attendance_status === "late") {
      return styles.studentCalendarLate;
    }

    if (item.attendance_status === "excused") {
      return styles.studentCalendarExcused;
    }

    if (
      item.attendance_status === "present" ||
      item.attendance_status === "attended"
    ) {
      return styles.studentCalendarAttended;
    }

    const classEnd = new Date(
      `${item.schedule_date}T${item.end_time || "00:00:00"}`
    );

    if (classEnd < new Date()) {
      return styles.studentCalendarCompleted;
    }

    return styles.studentCalendarScheduled;
  };

  const attendanceSummary = {
    present: attendance.filter(
      (item) => item.status === "present"
    ).length,

    absent: attendance.filter(
      (item) => item.status === "absent"
    ).length,

    late: attendance.filter(
      (item) => item.status === "late"
    ).length,

    excused: attendance.filter(
      (item) => item.status === "excused"
    ).length,
  };

  const studentName = student?.full_name || "Student";

  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.dashboard}>

      {/* Sidebar */}
      <aside className={styles.sidebar}>

        <div className={styles.logoArea}>
          <div className={styles.logo}>AQ</div>

          <div>
            <div className={styles.logoTitle}>Al Shaimaa</div>
            <div className={styles.logoSubtitle}>
              Quran Academy
            </div>
          </div>
        </div>

        <nav className={styles.nav}>

          <a
            href="#dashboard"
            className={`${styles.navItem} ${styles.activeNav}`}
          >
            <span>⌂</span>
            Dashboard
          </a>

          <a href="#courses" className={styles.navItem}>
            <span>📚</span>
            My Courses
          </a>

          <a href="#schedule" className={styles.navItem}>
            <span>📅</span>
            My Schedule
          </a>

          <a href="#progress" className={styles.navItem}>
            <span>📈</span>
            My Progress
          </a>

          <a href="#profile" className={styles.navItem}>
            <span>👤</span>
            My Profile
          </a>

        </nav>

        <div className={styles.sidebarBottom}>

          <div className={styles.studentMini}>
            <div className={styles.avatar}>
              {initials || "ST"}
            </div>

            <div>
              <div className={styles.miniName}>
                {studentName}
              </div>

              <div className={styles.miniRole}>
                Student
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* Main */}
      <main className={styles.main} id="dashboard">

        <header className={styles.header}>

          <div>
            <h1>Student Dashboard</h1>

            <p>
              Manage your courses, schedule, and learning progress.
            </p>
          </div>

          <div className={styles.profile}>

            <div className={styles.profileAvatar}>
              {initials || "ST"}
            </div>

            <div>
              <div className={styles.profileName}>
                {studentName}
              </div>

              <div className={styles.profileRole}>
                Student
              </div>
            </div>

          </div>

        </header>

        {/* Courses */}
        <section
          className={styles.sectionPanel}
          id="courses"
        >

          <div className={styles.panelHeader}>
            <div>
              <h2>📚 My Courses</h2>
              <p>Your active academy courses.</p>
            </div>

            <span className={styles.count}>
              {enrollments.length} Course
              {enrollments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className={styles.empty}>
              No active courses found.
            </div>
          ) : (
            <div className={styles.courseList}>
              {enrollments.map((course) => (
                <div
                  className={styles.courseCard}
                  key={course.id}
                >
                  <div className={styles.courseIcon}>
                    📚
                  </div>

                  <div className={styles.courseInfo}>
                    <div className={styles.courseTitle}>
                      {course.course_name}
                    </div>

                    {course.course_description && (
                      <div className={styles.courseDescription}>
                        {course.course_description}
                      </div>
                    )}

                    <div className={styles.courseTeacher}>
                      Teacher:{" "}
                      <strong>{course.teacher_name}</strong>
                    </div>

                    {course.teacher_specialization && (
                      <div className={styles.courseMeta}>
                        Specialization:{" "}
                        {course.teacher_specialization}
                      </div>
                    )}

                    <div className={styles.courseMeta}>
                      Start: {course.start_date || "—"}
                    </div>

                    <div className={styles.courseMeta}>
                      End: {course.end_date || "—"}
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

        {/* Monthly Schedule */}
        <section
          className={styles.sectionPanel}
          id="schedule"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>📅 Monthly Schedule</h2>
              <p>Your classes for the selected month.</p>
            </div>

            <span className={styles.count}>
              {monthlySchedules.length} Class
              {monthlySchedules.length !== 1 ? "es" : ""}
            </span>
          </div>

          <div className={styles.monthControls}>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => changeMonth(-1)}
            >
              ← Previous
            </button>

            <div className={styles.monthTitle}>
              {monthName}
            </div>

            <button
              type="button"
              className={styles.monthButton}
              onClick={() => changeMonth(1)}
            >
              Next →
            </button>
          </div>

          {monthlySchedules.length === 0 ? (
            <div className={styles.empty}>
              No classes scheduled for this month.
            </div>
          ) : (
            <div className={styles.studentCalendar}>
              <div className={styles.studentCalendarWeekdays}>
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
                    className={styles.studentCalendarWeekday}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.studentCalendarGrid}>
                {studentCalendarCells.map((day, index) => {
                  const dayClasses = day
                    ? studentClassesByDay[day] || []
                    : [];

                  return (
                    <div
                      key={index}
                      className={`${styles.studentCalendarCell} ${
                        day
                          ? ""
                          : styles.studentCalendarEmpty
                      }`}
                    >
                      {day && (
                        <>
                          <div className={styles.studentCalendarDate}>
                            {day}
                          </div>

                          <div className={styles.studentCalendarClasses}>
                            {dayClasses.map((item) => {
                              const status =
                                getScheduleStatus(item);

                              return (
                                <div
                                  key={item.id}
                                  className={`${styles.studentCalendarClass} ${getStudentCalendarStatusClass(item)}`}
                                >
                                  <strong>
                                    {item.start_time
                                      ? item.start_time.slice(0, 5)
                                      : "—"}{" "}
                                    –{" "}
                                    {item.end_time
                                      ? item.end_time.slice(0, 5)
                                      : "—"}
                                  </strong>

                                  <span>
                                    {item.course_name}
                                  </span>

                                  <span>
                                    {item.teacher_name}
                                  </span>

                                  <span
                                    className={`${styles.scheduleStatus} ${status.className}`}
                                  >
                                    {status.label}
                                  </span>

                                  {item.zoom_join_url ? (
                                    <a
                                      href={item.zoom_join_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.joinButton}
                                    >
                                      Join Zoom
                                    </a>
                                  ) : (
                                    <span className={styles.noZoom}>
                                      No link
                                    </span>
                                  )}
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

        {/* Attendance */}
        <section
          className={styles.sectionPanel}
          id="attendance"
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>📝 Attendance</h2>
              <p>View your class attendance records.</p>
            </div>

            <span className={styles.count}>
              {attendance.length} Record
              {attendance.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles.attendanceSummary}>
            <div className={styles.attendanceCard}>
              <span>Present</span>
              <strong>{attendanceSummary.present}</strong>
            </div>

            <div className={styles.attendanceCard}>
              <span>Absent</span>
              <strong>{attendanceSummary.absent}</strong>
            </div>

            <div className={styles.attendanceCard}>
              <span>Late</span>
              <strong>{attendanceSummary.late}</strong>
            </div>

            <div className={styles.attendanceCard}>
              <span>Excused</span>
              <strong>{attendanceSummary.excused}</strong>
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className={styles.empty}>
              No attendance records yet.
            </div>
          ) : (
            <div className={styles.attendanceList}>
              {attendance.map((item) => {
                const date = item.schedule_date
                  ? new Date(
                      `${item.schedule_date}T00:00:00`
                    )
                  : null;

                const statusClass =
                  item.status === "present"
                    ? styles.statusAttended
                    : item.status === "absent"
                    ? styles.statusAbsent
                    : item.status === "late"
                    ? styles.statusLate
                    : styles.statusExcused;

                return (
                  <div
                    className={styles.attendanceRow}
                    key={item.id}
                  >
                    <div className={styles.attendanceCourse}>
                      <strong>
                        {item.course_name}
                      </strong>

                      <span>
                        Teacher: {item.teacher_name}
                      </span>
                    </div>

                    <div className={styles.attendanceTime}>
                      {date
                        ? date.toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}

                      <span>
                        {item.start_time || "—"} –{" "}
                        {item.end_time || "—"}
                      </span>
                    </div>

                    <span
                      className={`${styles.scheduleStatus} ${statusClass}`}
                    >
                      {item.status}
                    </span>

                    {item.note && (
                      <div className={styles.attendanceNote}>
                        {item.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Progress */}
        <section
          className={styles.sectionPanel}
          id="progress"
        >

          <div className={styles.panelHeader}>
            <div>
              <h2>📈 My Progress</h2>
              <p>Track your Quran learning progress.</p>
            </div>

            <span className={styles.count}>
              {progress.length} Record
              {progress.length !== 1 ? "s" : ""}
            </span>
          </div>

          {progress.length === 0 ? (
            <div className={styles.empty}>
              No progress records yet.
            </div>
          ) : (
            <div className={styles.progressList}>

              {progress.map((item, index) => {

                const progressValue =
                  item.progress_percent == null
                    ? null
                    : Math.min(
                        100,
                        Math.max(
                          0,
                          Number(item.progress_percent)
                        )
                      );

                return (
                  <div
                    className={styles.progressItem}
                    key={`${item.recorded_at}-${index}`}
                  >

                    <div className={styles.progressMain}>

                      <div className={styles.progressTitle}>
                        Progress
                      </div>

                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressValue}
                          style={{
                            width: `${progressValue ?? 0}%`,
                          }}
                        />
                      </div>

                      <div className={styles.progressPercent}>
                        {progressValue == null
                          ? "—"
                          : `${progressValue}%`}
                      </div>

                    </div>

                    <div>
                      <div className={styles.progressLabel}>
                        Score
                      </div>

                      <div className={styles.progressScore}>
                        {item.score ?? "—"}
                      </div>
                    </div>

                    <div>
                      <div className={styles.progressLabel}>
                        Level
                      </div>

                      <div className={styles.progressLevel}>
                        {item.level || "—"}
                      </div>
                    </div>

                    <div className={styles.progressComment}>
                      {item.comment ||
                        "No teacher comment."}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* Profile */}
        <section
          className={styles.sectionPanel}
          id="profile"
        >

          <div className={styles.panelHeader}>
            <div>
              <h2>👤 My Profile</h2>
              <p>Your academy account information.</p>
            </div>
          </div>

          <div className={styles.profileCard}>

            <div className={styles.profileAvatarLarge}>
              {initials || "ST"}
            </div>

            <div className={styles.profileDetails}>

              <div>
                <span>Name</span>
                <strong>{student?.full_name || "—"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{student?.email || "—"}</strong>
              </div>

              <div>
                <span>Country</span>
                <strong>{student?.country || "—"}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{student?.status || "—"}</strong>
              </div>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
