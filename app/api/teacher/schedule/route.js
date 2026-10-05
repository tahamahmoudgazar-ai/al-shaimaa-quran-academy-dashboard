import { NextResponse } from "next/server";
import { requireTeacher } from "../../../../lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const auth = await requireTeacher(request);

  if (auth.response) {
    return auth.response;
  }

  const teacherProfileId = auth.profile.id;

  const { data: teacher, error: teacherError } =
    await supabaseAdmin
      .from("teachers")
      .select("id, profile_id")
      .eq("profile_id", teacherProfileId)
      .single();

  if (teacherError || !teacher) {
    return NextResponse.json(
      { error: "Teacher record not found" },
      { status: 404 }
    );
  }

  const { data: enrollments, error: enrollmentError } =
    await supabaseAdmin
      .from("enrollments")
      .select(
        "id, student_id, course_id, teacher_id, status"
      )
      .eq("teacher_id", teacher.id)
      .eq("status", "active");

  if (enrollmentError) {
    return NextResponse.json(
      { error: enrollmentError.message },
      { status: 500 }
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({
      schedules: [],
    });
  }

  const enrollmentIds = enrollments.map(
    (enrollment) => enrollment.id
  );

  const { data: schedules, error: scheduleError } =
    await supabaseAdmin
      .from("schedule")
      .select(
        `
          id,
          enrollment_id,
          weekly_schedule_id,
          schedule_date,
          start_time,
          end_time,
          status,
          zoom_meeting_id,
          zoom_join_url,
          zoom_start_url
        `
      )
      .in("enrollment_id", enrollmentIds)
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true });

  if (scheduleError) {
    return NextResponse.json(
      { error: scheduleError.message },
      { status: 500 }
    );
  }

  const scheduleIds = (schedules || []).map(
    (schedule) => schedule.id
  );

  const { data: attendance, error: attendanceError } =
    await supabaseAdmin
      .from("attendance")
      .select(
        "id, schedule_id, student_id, status, note, recorded_by, created_at"
      )
      .in(
        "schedule_id",
        scheduleIds.length
          ? scheduleIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

  if (attendanceError) {
    return NextResponse.json(
      { error: attendanceError.message },
      { status: 500 }
    );
  }

  const studentIds = [
    ...new Set(
      enrollments
        .map((enrollment) => enrollment.student_id)
        .filter(Boolean)
    ),
  ];

  const courseIds = [
    ...new Set(
      enrollments
        .map((enrollment) => enrollment.course_id)
        .filter(Boolean)
    ),
  ];

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id, profile_id")
    .in(
      "id",
      studentIds.length
        ? studentIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const studentProfileIds = (students || [])
    .map((student) => student.profile_id)
    .filter(Boolean);

  const { data: studentProfiles } =
    await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in(
        "id",
        studentProfileIds.length
          ? studentProfileIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

  const { data: courses } = await supabaseAdmin
    .from("courses")
    .select("id, name")
    .in(
      "id",
      courseIds.length
        ? courseIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const result = (schedules || []).map((schedule) => {
    const enrollment = enrollments.find(
      (item) => item.id === schedule.enrollment_id
    );

    const student = students?.find(
      (item) => item.id === enrollment?.student_id
    );

    const studentProfile = studentProfiles?.find(
      (profile) => profile.id === student?.profile_id
    );

    const course = courses?.find(
      (item) => item.id === enrollment?.course_id
    );

    const attendanceRecord = attendance?.find(
      (item) => item.schedule_id === schedule.id
    );

    return {
      id: schedule.id,
      enrollment_id: schedule.enrollment_id,
      weekly_schedule_id: schedule.weekly_schedule_id,
      schedule_date: schedule.schedule_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,

      status: schedule.status,

      attendance_status:
        attendanceRecord?.status || null,

      attendance_note:
        attendanceRecord?.note || null,

      attendance_id:
        attendanceRecord?.id || null,

      zoom_meeting_id:
        schedule.zoom_meeting_id || null,

      zoom_join_url:
        schedule.zoom_join_url || null,

      zoom_start_url:
        schedule.zoom_start_url || null,

      student_id:
        enrollment?.student_id || null,

      student_name:
        studentProfile?.full_name ||
        "Unknown Student",

      course_id:
        enrollment?.course_id || null,

      course_name:
        course?.name || "Unknown Course",
    };
  });

  return NextResponse.json({
    schedules: result,
  });
}
