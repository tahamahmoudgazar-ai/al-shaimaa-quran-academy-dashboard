import Link from "next/link";
import { Users, GraduationCap, BookOpen, CalendarDays } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import StatCard from "../../components/StatCard";
import styles from "./admin.module.css";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function formatTime(time) {
  if (!time) return "";

  const [hourString, minute] = time.split(":");
  let hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
}

function formatDate(date) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);

  const todayString = today.toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });

  if (date === todayString) {
    return "Today";
  }

  const tomorrow = new Date(
    today.getTime() + 24 * 60 * 60 * 1000
  );

  const tomorrowString = tomorrow.toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });

  if (date === tomorrowString) {
    return "Tomorrow";
  }

  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboard() {
  const supabase = getSupabase();

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });

  const tomorrowDate = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });

  const [
    studentsResult,
    teachersResult,
    coursesResult,
    todayClassesResult,
    upcomingResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase
      .from("schedule")
      .select("id", { count: "exact", head: true })
      .eq("schedule_date", today),
    supabase
      .from("schedule")
      .select("*")
      .gte("schedule_date", today)
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5),
  ]);

  const totalStudents = studentsResult.count || 0;
  const totalTeachers = teachersResult.count || 0;
  const totalCourses = coursesResult.count || 0;
  const todayClasses = todayClassesResult.count || 0;

  const schedules = upcomingResult.data || [];
  const rows = [];

  for (const item of schedules) {
    let studentName = "Unknown Student";
    let courseName = "Unknown Course";

    if (item.enrollment_id) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("student_id, course_id")
        .eq("id", item.enrollment_id)
        .single();

      if (enrollment) {
        if (enrollment.student_id) {
          const { data: student } = await supabase
            .from("students")
            .select("profile_id")
            .eq("id", enrollment.student_id)
            .single();

          if (student?.profile_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", student.profile_id)
              .single();

            studentName = profile?.full_name || studentName;
          }
        }

        if (enrollment.course_id) {
          const { data: course } = await supabase
            .from("courses")
            .select("name")
            .eq("id", enrollment.course_id)
            .single();

          courseName = course?.name || courseName;
        }
      }
    }

    rows.push([
      studentName,
      courseName,
      `${formatDate(item.schedule_date)}, ${formatTime(item.start_time)}`,
      item.status || "scheduled",
    ]);
  }

  return (
    <>
      <div className={styles.heading}>
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your academy today.</p>
        </div>

        <Link className={styles.primaryButton} href="/admin/students">
          + Add Student
        </Link>
      </div>

      <div className={styles.stats}>
        <StatCard
          title="Total Students"
          value={String(totalStudents)}
          note="From Supabase"
          icon={Users}
        />

        <StatCard
          title="Teachers"
          value={String(totalTeachers)}
          note="From Supabase"
          icon={GraduationCap}
        />

        <StatCard
          title="Courses"
          value={String(totalCourses)}
          note="From Supabase"
          icon={BookOpen}
        />

        <StatCard
          title="Today's Classes"
          value={String(todayClasses)}
          note="Scheduled today"
          icon={CalendarDays}
        />
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Upcoming Classes</h2>
            <Link href="/admin/schedule">View all</Link>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((x, j) => (
                        <td key={j}>
                          {j === 3 ? (
                            <span
                              className={
                                x === "scheduled" || x === "Active"
                                  ? styles.active
                                  : styles.pending
                              }
                            >
                              {x}
                            </span>
                          ) : (
                            x
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No upcoming classes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Quick Actions</h2>
          </div>

          <div className={styles.actions}>
            <Link href="/admin/students">Add Student</Link>
            <Link href="/admin/teachers">Add Teacher</Link>
            <Link href="/admin/courses">Create Course</Link>
            <Link href="/admin/schedule">Create Class</Link>
          </div>
        </section>
      </div>
    </>
  );
}
