import styles from "./student.module.css";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProgressEditor from "../../../../components/students/ProgressEditor";
import AddCourse from "../../../../components/students/AddCourse";
import WeeklyScheduleForm from "../../../../components/students/WeeklyScheduleForm";
import WeeklyScheduleActions from "../../../../components/students/WeeklyScheduleActions";

export default async function StudentDetailsPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: student, error } = await supabase
    .from("students")
    .select(`
      id,
      profile_id,
      country,
      parent_name,
      parent_phone,
      status,
      created_at,
      profiles (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !student) {
    notFound();
  }

  const { data: progress } = await supabase
    .from("progress")
    .select(`
      current_surah,
      last_memorized,
      last_revision,
      progress_percent
    `)
    .eq("student_id", student.id)
    .limit(1)
    .maybeSingle();

  /* =========================
     Student Enrollments
  ========================= */

  const { data: enrollmentsData } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      teacher_id
    `)
    .eq("student_id", student.id)
    .eq("status", "active");

  const rawEnrollments = enrollmentsData || [];

  const enrollmentCourseIds = [
    ...new Set(
      rawEnrollments
        .map((item) => item.course_id)
        .filter(Boolean)
    )
  ];

  const enrollmentTeacherIds = [
    ...new Set(
      rawEnrollments
        .map((item) => item.teacher_id)
        .filter(Boolean)
    )
  ];

  let enrollmentCourses = [];
  let enrollmentTeachers = [];
  let enrollmentProfiles = [];

  if (enrollmentCourseIds.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, name")
      .in("id", enrollmentCourseIds);

    enrollmentCourses = data || [];
  }

  if (enrollmentTeacherIds.length > 0) {
    const { data } = await supabase
      .from("teachers")
      .select("id, profile_id")
      .in("id", enrollmentTeacherIds);

    enrollmentTeachers = data || [];
  }

  const enrollmentProfileIds = [
    ...new Set(
      enrollmentTeachers
        .map((item) => item.profile_id)
        .filter(Boolean)
    )
  ];

  if (enrollmentProfileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", enrollmentProfileIds);

    enrollmentProfiles = data || [];
  }

  const enrollmentCourseMap = Object.fromEntries(
    enrollmentCourses.map((course) => [
      course.id,
      course.name
    ])
  );

  const enrollmentTeacherMap = Object.fromEntries(
    enrollmentTeachers.map((teacher) => {
      const profile = enrollmentProfiles.find(
        (item) => item.id === teacher.profile_id
      );

      return [
        teacher.id,
        profile?.full_name || "Teacher"
      ];
    })
  );

  const studentEnrollments = rawEnrollments.map(
    (item) => ({
      id: item.id,
      courseName:
        enrollmentCourseMap[item.course_id] || "Course",
      teacherName:
        enrollmentTeacherMap[item.teacher_id] || "Teacher"
    })
  );

  /* =========================
     Weekly Schedule
  ========================= */

  const { data: weeklyRows } = await supabase
    .from("weekly_schedule")
    .select(`
      id,
      enrollment_id,
      day_of_week,
      start_time,
      end_time
    `)
    .order("day_of_week")
    .order("start_time");

  const weeklyEnrollmentIds = [
    ...new Set(
      (weeklyRows || [])
        .map((row) => row.enrollment_id)
        .filter(Boolean)
    )
  ];

  let weeklyEnrollments = [];

  if (weeklyEnrollmentIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        teacher_id,
        course_id
      `)
      .in("id", weeklyEnrollmentIds);

    weeklyEnrollments = data || [];
  }

  const studentWeeklyRows = (weeklyRows || [])
    .map((row) => {
      const enrollment = weeklyEnrollments.find(
        (item) => item.id === row.enrollment_id
      );

      return {
        ...row,
        enrollment
      };
    })
    .filter(
      (row) =>
        row.enrollment &&
        row.enrollment.student_id === student.id
    );

  const weeklyTeacherIds = [
    ...new Set(
      studentWeeklyRows
        .map((row) => row.enrollment?.teacher_id)
        .filter(Boolean)
    )
  ];

  const weeklyCourseIds = [
    ...new Set(
      studentWeeklyRows
        .map((row) => row.enrollment?.course_id)
        .filter(Boolean)
    )
  ];

  let weeklyTeachers = [];
  let weeklyCourses = [];
  let weeklyProfiles = [];

  if (weeklyTeacherIds.length > 0) {
    const { data } = await supabase
      .from("teachers")
      .select("id, profile_id")
      .in("id", weeklyTeacherIds);

    weeklyTeachers = data || [];
  }

  if (weeklyCourseIds.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, name")
      .in("id", weeklyCourseIds);

    weeklyCourses = data || [];
  }

  const weeklyProfileIds = [
    ...new Set(
      weeklyTeachers
        .map((teacher) => teacher.profile_id)
        .filter(Boolean)
    )
  ];

  if (weeklyProfileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", weeklyProfileIds);

    weeklyProfiles = data || [];
  }

  const weeklyTeacherMap = Object.fromEntries(
    weeklyTeachers.map((teacher) => {
      const profile = weeklyProfiles.find(
        (item) => item.id === teacher.profile_id
      );

      return [
        teacher.id,
        profile?.full_name || "Teacher"
      ];
    })
  );

  const weeklyCourseMap = Object.fromEntries(
    weeklyCourses.map((course) => [
      course.id,
      course.name
    ])
  );

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  /* =========================
     Monthly Schedule
  ========================= */
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const firstDay = firstDayOfMonth.toISOString().slice(0, 10);

  const lastDayOfMonth = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth() + 1,
    0
  );
  const lastDay = lastDayOfMonth.toISOString().slice(0, 10);

  const { data: monthlyRows } = await supabase
    .from("schedule")
    .select("id, enrollment_id, schedule_date, start_time, end_time, status")
    .gte("schedule_date", firstDay)
    .lte("schedule_date", lastDay)
    .order("schedule_date")
    .order("start_time");

  const monthlyEnrollmentIds = [
    ...new Set(
      (monthlyRows || [])
        .map((row) => row.enrollment_id)
        .filter(Boolean)
    )
  ];

  let monthlyEnrollments = [];

  if (monthlyEnrollmentIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("id, student_id, teacher_id, course_id")
      .in("id", monthlyEnrollmentIds);

    monthlyEnrollments = data || [];
  }

  const monthlyStudentRows = (monthlyRows || []).filter((row) => {
    const enrollment = monthlyEnrollments.find(
      (item) => item.id === row.enrollment_id
    );
    return enrollment?.student_id === student.id;
  });

  const monthlyCourseIds = [
    ...new Set(
      monthlyStudentRows
        .map((row) => {
          const enrollment = monthlyEnrollments.find(
            (item) => item.id === row.enrollment_id
          );
          return enrollment?.course_id;
        })
        .filter(Boolean)
    )
  ];

  let monthlyCourses = [];

  if (monthlyCourseIds.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, name")
      .in("id", monthlyCourseIds);

    monthlyCourses = data || [];
  }

  const monthlyCourseMap = Object.fromEntries(
    monthlyCourses.map((course) => [course.id, course.name])
  );

  const monthlyTeacherIds = [
    ...new Set(
      monthlyStudentRows
        .map((row) => {
          const enrollment = monthlyEnrollments.find(
            (item) => item.id === row.enrollment_id
          );
          return enrollment?.teacher_id;
        })
        .filter(Boolean)
    )
  ];

  let monthlyTeachers = [];
  let monthlyProfiles = [];

  if (monthlyTeacherIds.length > 0) {
    const { data } = await supabase
      .from("teachers")
      .select("id, profile_id")
      .in("id", monthlyTeacherIds);

    monthlyTeachers = data || [];
  }

  const monthlyProfileIds = [
    ...new Set(
      monthlyTeachers
        .map((teacher) => teacher.profile_id)
        .filter(Boolean)
    )
  ];

  if (monthlyProfileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", monthlyProfileIds);

    monthlyProfiles = data || [];
  }

  const monthlyTeacherMap = Object.fromEntries(
    monthlyTeachers.map((teacher) => {
      const profile = monthlyProfiles.find(
        (item) => item.id === teacher.profile_id
      );

      return [
        teacher.id,
        profile?.full_name || "Teacher"
      ];
    })
  );

  let studentAttendanceRows = [];

  const studentScheduleIds = (monthlyStudentRows || [])
    .map((row) => row.id)
    .filter(Boolean);

  if (studentScheduleIds.length > 0) {
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("id, schedule_id, student_id, status, note")
      .eq("student_id", student.id)
      .in("schedule_id", studentScheduleIds);

    studentAttendanceRows = (attendanceData || []).map((item) => {
      const scheduleRow = monthlyStudentRows.find(
        (row) => row.id === item.schedule_id
      );

      return {
        ...item,
        schedule_date: scheduleRow?.schedule_date || "",
        start_time: scheduleRow?.start_time || "",
        end_time: scheduleRow?.end_time || "",
        enrollment_id: scheduleRow?.enrollment_id || ""
      };
    });
  }

  const profile = Array.isArray(student.profiles)
    ? student.profiles[0]
    : student.profiles;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e9ef",
        borderRadius: 16,
        padding: "24px",
        maxWidth: 1100,
        margin: "0 auto",
        boxSizing: "border-box"
      }}
    >
      <a
        href="/admin/students"
        style={{
          display: "inline-block",
          color: "#1f7a5a",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 20
        }}
      >
        ← Back to Students
      </a>

      {/* Student Header */}
      <div
        style={{
          paddingBottom: 22,
          borderBottom: "1px solid #e3e9ef"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "#edf3f8",
              color: "#16324f",
              display: "grid",
              placeItems: "center",
              fontSize: 25,
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            {(profile?.full_name || "S").charAt(0).toUpperCase()}
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                color: "#16324f",
                fontSize: "clamp(28px, 6vw, 40px)",
                lineHeight: 1.15
              }}
            >
              {profile?.full_name || "Student"}
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#718096",
                fontSize: 17
              }}
            >
              Student Profile
            </p>
          </div>

          <div
            style={{
              marginLeft: "auto",
              background:
                student.status === "active"
                  ? "#e6f4ea"
                  : "#f1f5f9",
              color:
                student.status === "active"
                  ? "#276749"
                  : "#475569",
              padding: "7px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700
            }}
          >
            {student.status || "active"}
          </div>
        </div>
      </div>

      {/* Student Information */}
      <section style={{ marginTop: 26 }}>
        <h2
          style={{
            margin: "0 0 16px",
            color: "#16324f",
            fontSize: 24
          }}
        >
          Student Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14
          }}
        >
          <InfoCard title="Email" value={profile?.email || "—"} />

          <InfoCard
            title="Country"
            value={student.country || "—"}
          />

          <InfoCard
            title="Parent Name"
            value={student.parent_name || "—"}
          />

          <InfoCard
            title="Parent Phone"
            value={student.parent_phone || "—"}
          />

          <InfoCard
            title="Status"
            value={student.status || "active"}
          />

          <InfoCard
            title="Joined"
            value={
              student.created_at
                ? new Date(
                    student.created_at
                  ).toLocaleDateString()
                : "—"
            }
          />

          <InfoCard
            title="Student ID"
            value={student.id}
          />
        </div>
      </section>

      {/* Weekly Schedule */}
      <section
        style={{
          marginTop: 30,
          padding: 20,
          border: "1px solid #e3e9ef",
          borderRadius: 14,
          background: "#f8fafc"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18
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
              {studentWeeklyRows.length} weekly class
              {studentWeeklyRows.length === 1 ? "" : "es"}
            </p>
          </div>
        </div>

<AddCourse studentId={student.id} />
        <WeeklyScheduleForm
          enrollments={studentEnrollments}
        />

        {studentWeeklyRows.length === 0 ? (
          <div
            style={{
              marginTop: 18,
              padding: 20,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e3e9ef",
              color: "#718096",
              textAlign: "center"
            }}
          >
            No weekly schedule has been added for this student yet.
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              overflowX: "auto",
              background: "#fff",
              border: "1px solid #e3e9ef",
              borderRadius: 10
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: 650,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                overflow: "hidden",
                background: "#fff"
              }}
            >
              <thead>
                <tr style={{ background: "#dbeafe" }}>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      color: "#1e3a5f",
                      fontWeight: 700,
                      borderRight: "1px solid #cbd5e1",
                      borderBottom: "2px solid #94a3b8"
                    }}
                  >
                    Day
                  </th>

                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      color: "#1e3a5f",
                      fontWeight: 700,
                      borderRight: "1px solid #cbd5e1",
                      borderBottom: "2px solid #94a3b8"
                    }}
                  >
                    Time
                  </th>

                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      color: "#1e3a5f",
                      fontWeight: 700,
                      borderRight: "1px solid #cbd5e1",
                      borderBottom: "2px solid #94a3b8"
                    }}
                  >
                    Teacher
                  </th>

                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      color: "#1e3a5f",
                      fontWeight: 700,
                      borderBottom: "2px solid #94a3b8"
                    }}
                  >
                    Course
                  </th>

                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      color: "#1e3a5f",
                      fontWeight: 700,
                      borderBottom: "2px solid #94a3b8"
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {studentWeeklyRows.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{
                      background:
                        index % 2 === 0 ? "#ffffff" : "#f8fafc"
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "#1e40af",
                        borderRight: "1px solid #bfdbfe",
                        borderBottom: "1px solid #e2e8f0"
                      }}
                    >
                      {dayNames[row.day_of_week] || "—"}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#92400e",
                        background: "#fffbeb",
                        borderRight: "1px solid #fde68a",
                        borderBottom: "1px solid #e2e8f0"
                      }}
                    >
                      {formatTime(row.start_time)} -{" "}
                      {formatTime(row.end_time)}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "#7e22ce",
                        background: "#faf5ff",
                        borderRight: "1px solid #e9d5ff",
                        borderBottom: "1px solid #e2e8f0"
                      }}
                    >
                      {weeklyTeacherMap[
                        row.enrollment?.teacher_id
                      ] || "—"}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "#166534",
                        background: "#f0fdf4",
                        borderBottom: "1px solid #bbf7d0"
                      }}
                    >
                      {weeklyCourseMap[
                        row.enrollment?.course_id
                      ] || "—"}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #e2e8f0"
                      }}
                    >
                      <WeeklyScheduleActions
                        id={row.id}
                        dayOfWeek={row.day_of_week}
                        startTime={row.start_time}
                        endTime={row.end_time}
                      />
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
          marginTop: 30,
          padding: 20,
          border: "1px solid #e3e9ef",
          borderRadius: 14,
          background: "#f8fafc"
        }}
      >
        <h2
          style={{
            margin: "0 0 18px",
            color: "#16324f",
            fontSize: 24
          }}
        >
          Monthly Schedule
        </h2>

        <p
          style={{
            margin: "0 0 16px",
            color: "#718096",
            fontSize: 14
          }}
        >
          Schedule sessions generated for this month.
        </p>

        {monthlyStudentRows.length === 0 ? (
          <div
            style={{
              padding: 20,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e3e9ef",
              color: "#718096",
              textAlign: "center"
            }}
          >
            No monthly schedule found for this student.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "#fff",
              border: "1px solid #e3e9ef",
              borderRadius: 10
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
                <tr style={{ background: "#dbeafe" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Teacher</th>
                  <th style={thStyle}>Course</th>
                </tr>
              </thead>

                <tbody>
                  {monthlyStudentRows.map((row) => {
                    const status = row.status || "scheduled";
                    const statusStyle =
                      status === "absent"
                        ? { background: "#fee2e2", color: "#b91c1c" }
                        : status === "late"
                        ? { background: "#ffedd5", color: "#c2410c" }
                        : status === "present"
                        ? { background: "#dcfce7", color: "#166534" }
                        : status === "excused"
                        ? { background: "#f3e8ff", color: "#7e22ce" }
                        : { background: "#dbeafe", color: "#1d4ed8" };

                    return (
                      <tr
                        key={row.id}
                        style={{
                          background: statusStyle.background
                        }}
                      >
                        <td style={{ ...tdStyle, borderRight: "1px solid #cbd5e1" }}>
                          {row.schedule_date
                            ? new Date(
                                row.schedule_date + "T00:00:00"
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td style={{ ...tdStyle, borderRight: "1px solid #cbd5e1" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "5px 10px",
                              borderRadius: 999,
                              fontWeight: 700,
                              fontSize: 12,
                              ...statusStyle
                            }}
                          >
                            {status}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, borderRight: "1px solid #cbd5e1" }}>
                          {formatTime(row.start_time)} -{" "}
                          {formatTime(row.end_time)}
                        </td>

                        <td style={{ ...tdStyle, borderRight: "1px solid #cbd5e1" }}>
                          {monthlyTeacherMap[
                            monthlyEnrollments.find(
                              (item) => item.id === row.enrollment_id
                            )?.teacher_id
                          ] || "—"}
                        </td>

                        <td style={tdStyle}>
                          {monthlyCourseMap[
                            monthlyEnrollments.find(
                              (item) => item.id === row.enrollment_id
                            )?.course_id
                          ] || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
        )}
      </section>

              {/* Attendance */}
        <section
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #e3e9ef",
            borderRadius: 14,
            background: "#f8fafc"
          }}
        >
          <h2
            style={{
              margin: "0 0 18px",
              color: "#16324f",
              fontSize: 24
            }}
          >
            Attendance
          </h2>

          <p
            style={{
              margin: "0 0 16px",
              color: "#718096",
              fontSize: 14
            }}
          >
            Attendance records for this student.
          </p>

          {studentAttendanceRows.length === 0 ? (
            <div
              style={{
                padding: 20,
                borderRadius: 10,
                background: "#fff",
                border: "1px solid #e3e9ef",
                color: "#718096",
                textAlign: "center"
              }}
            >
              No attendance records found for this student.
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                background: "#fff",
                border: "1px solid #e3e9ef",
                borderRadius: 10
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 650,
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10
                }}
              >
                <thead>
                  <tr style={{ background: "#e2e8f0" }}>
                    <th
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        borderRight: "1px solid #cbd5e1",
                        borderBottom: "2px solid #94a3b8"
                      }}
                    >
                      Day
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        borderRight: "1px solid #cbd5e1",
                        borderBottom: "2px solid #94a3b8"
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        borderRight: "1px solid #cbd5e1",
                        borderBottom: "2px solid #94a3b8"
                      }}
                    >
                      Teacher
                    </th>
                    <th
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        borderBottom: "2px solid #94a3b8"
                      }}
                    >
                      Course
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {studentWeeklyRows.map((row, index) => (
                    <tr
                      key={row.id}
                      style={{
                        background: index % 2 === 0 ? "#ffffff" : "#f8fafc"
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 16px",
                          borderRight: "1px solid #e2e8f0",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: 600,
                          color: "#334155"
                        }}
                      >
                        {dayNames[row.day_of_week] || "—"}
                      </td>

                      <td
                        style={{
                          padding: "14px 16px",
                          borderRight: "1px solid #e2e8f0",
                          borderBottom: "1px solid #e2e8f0",
                          color: "#334155"
                        }}
                      >
                        {formatTime(row.start_time)} -{" "}
                        {formatTime(row.end_time)}
                      </td>

                      <td
                        style={{
                          padding: "14px 16px",
                          borderRight: "1px solid #e2e8f0",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: 600,
                          color: "#1e3a5f"
                        }}
                      >
                        {weeklyTeacherMap[
                          row.enrollment?.teacher_id
                        ] || "—"}
                      </td>

                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: 600,
                          color: "#475569"
                        }}
                      >
                        {weeklyCourseMap[
                          row.enrollment?.course_id
                        ] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>



      {/* Quran Progress */}
      <section
        style={{
          marginTop: 30,
          padding: 20,
          border: "1px solid #e3e9ef",
          borderRadius: 14,
          background: "#f8fafc"
        }}
      >
        <h2
          style={{
            margin: "0 0 18px",
            color: "#16324f",
            fontSize: 24
          }}
        >
          Quran Progress
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14
          }}
        >
          <InfoCard
            title="Current Surah"
            value={progress?.current_surah || "—"}
          />

          <InfoCard
            title="Last Memorized"
            value={progress?.last_memorized || "—"}
          />

          <InfoCard
            title="Last Revision"
            value={progress?.last_revision || "—"}
          />

          <InfoCard
            title="Progress"
            value={
              progress?.progress_percent != null
                ? `${progress.progress_percent}%`
                : "—"
            }
          />
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <ProgressEditor
          studentId={student.id}
          progress={progress}
        />
      </div>
    </div>
  );
}

function formatTime(time) {
  if (!time) return "—";

  const parts = time.split(":");
  let hour = Number(parts[0]);
  const minute = parts[1];

  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
}

const thStyle = {
  padding: "13px 14px",
  textAlign: "left",
  fontSize: 13,
  color: "#475569",
  borderBottom: "1px solid #e3e9ef",
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "14px",
  fontSize: 14,
  color: "#16324f",
  borderBottom: "1px solid #edf2f7",
  whiteSpace: "nowrap"
};

function InfoCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e3e9ef",
        borderRadius: 12,
        padding: 17,
        background: "#fff",
        minWidth: 0,
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#718096",
          marginBottom: 8
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#16324f",
          wordBreak: "break-word"
        }}
      >
        {value}
      </div>
    </div>
  );
}
