import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireStudent } from "../../../../lib/auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const auth = await requireStudent(request);

  if (auth.response) {
    return auth.response;
  }

  try {
    const supabase = getSupabase();
    const profileId = auth.profile.id;

    const { data: student, error: studentError } =
      await supabase
        .from("students")
        .select(
          "id, profile_id, date_of_birth, country, parent_name, parent_phone, notes, status"
        )
        .eq("profile_id", profileId)
        .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student record not found." },
        { status: 404 }
      );
    }

    const { data: enrollments, error: enrollmentError } =
      await supabase
        .from("enrollments")
        .select(
          "id, student_id, course_id, teacher_id, start_date, end_date, status"
        )
        .eq("student_id", student.id)
        .eq("status", "active")
        .order("start_date", { ascending: true });

    if (enrollmentError) {
      return NextResponse.json(
        { error: enrollmentError.message },
        { status: 500 }
      );
    }

    const enrollmentRows = enrollments || [];

    const courseIds = [
      ...new Set(
        enrollmentRows
          .map((item) => item.course_id)
          .filter(Boolean)
      ),
    ];

    const teacherIds = [
      ...new Set(
        enrollmentRows
          .map((item) => item.teacher_id)
          .filter(Boolean)
      ),
    ];

    const enrollmentIds = enrollmentRows.map(
      (item) => item.id
    );

    const { data: courses, error: coursesError } =
      courseIds.length
        ? await supabase
            .from("courses")
            .select(
              "id, name, description, status"
            )
            .in("id", courseIds)
        : { data: [], error: null };

    if (coursesError) {
      return NextResponse.json(
        { error: coursesError.message },
        { status: 500 }
      );
    }

    const { data: teachers, error: teachersError } =
      teacherIds.length
        ? await supabase
            .from("teachers")
            .select(
              "id, profile_id, specialization, status"
            )
            .in("id", teacherIds)
        : { data: [], error: null };

    if (teachersError) {
      return NextResponse.json(
        { error: teachersError.message },
        { status: 500 }
      );
    }

    const teacherProfileIds = [
      ...new Set(
        (teachers || [])
          .map((teacher) => teacher.profile_id)
          .filter(Boolean)
      ),
    ];

    const { data: teacherProfiles, error: teacherProfilesError } =
      teacherProfileIds.length
        ? await supabase
            .from("profiles")
            .select(
              "id, full_name, email, avatar_url"
            )
            .in("id", teacherProfileIds)
        : { data: [], error: null };

    if (teacherProfilesError) {
      return NextResponse.json(
        { error: teacherProfilesError.message },
        { status: 500 }
      );
    }

    const { data: schedules, error: schedulesError } =
      enrollmentIds.length
        ? await supabase
            .from("schedule")
            .select(
              "id, enrollment_id, schedule_date, start_time, end_time, status, weekly_schedule_id, zoom_meeting_id, zoom_join_url"
            )
            .in("enrollment_id", enrollmentIds)
            .order("schedule_date", {
              ascending: true,
            })
            .order("start_time", {
              ascending: true,
            })
        : { data: [], error: null };

    if (schedulesError) {
      return NextResponse.json(
        { error: schedulesError.message },
        { status: 500 }
      );
    }

    /*
     * Attendance
     * Read-only for the logged-in student.
     */
    const { data: attendance, error: attendanceError } =
      await supabase
        .from("attendance")
        .select(
          "id, schedule_id, student_id, status, note, recorded_by, created_at"
        )
        .eq("student_id", student.id)
        .order("created_at", {
          ascending: false,
        });

    if (attendanceError) {
      return NextResponse.json(
        { error: attendanceError.message },
        { status: 500 }
      );
    }

    const { data: progress, error: progressError } =
      await supabase
        .from("progress")
        .select(
          "current_surah, last_memorized, last_revision, progress_percent, student_id, course_id, teacher_id, score, level, comment, recorded_at"
        )
        .eq("student_id", student.id)
        .order("recorded_at", {
          ascending: false,
        });

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    const courseMap = new Map(
      (courses || []).map((course) => [
        course.id,
        course,
      ])
    );

    const teacherMap = new Map(
      (teachers || []).map((teacher) => [
        teacher.id,
        teacher,
      ])
    );

    const profileMap = new Map(
      (teacherProfiles || []).map((profile) => [
        profile.id,
        profile,
      ])
    );

    const enrollmentMap = new Map(
      enrollmentRows.map((enrollment) => [
        enrollment.id,
        enrollment,
      ])
    );

    const attendanceMap = new Map(
      (attendance || []).map((item) => [
        item.schedule_id,
        item,
      ])
    );

    const enrollmentResult = enrollmentRows.map(
      (enrollment) => {
        const course = courseMap.get(
          enrollment.course_id
        );

        const teacher = teacherMap.get(
          enrollment.teacher_id
        );

        const teacherProfile = teacher
          ? profileMap.get(teacher.profile_id)
          : null;

        return {
          id: enrollment.id,
          course_id: enrollment.course_id,
          course_name:
            course?.name || "Unknown Course",
          course_description:
            course?.description || null,
          teacher_id: enrollment.teacher_id,
          teacher_name:
            teacherProfile?.full_name ||
            "Unknown Teacher",
          teacher_specialization:
            teacher?.specialization || null,
          start_date: enrollment.start_date,
          end_date: enrollment.end_date,
          status: enrollment.status,
        };
      }
    );

    const scheduleResult = (schedules || []).map(
      (schedule) => {
        const enrollment = enrollmentMap.get(
          schedule.enrollment_id
        );

        const course = enrollment
          ? courseMap.get(enrollment.course_id)
          : null;

        const teacher = enrollment
          ? teacherMap.get(enrollment.teacher_id)
          : null;

        const teacherProfile = teacher
          ? profileMap.get(teacher.profile_id)
          : null;

        const attendanceRecord =
          attendanceMap.get(schedule.id);

        return {
          id: schedule.id,
          enrollment_id:
            schedule.enrollment_id,
          schedule_date:
            schedule.schedule_date,
          start_time:
            schedule.start_time,
          end_time:
            schedule.end_time,
          status:
            schedule.status,

          course_name:
            course?.name || "Unknown Course",

          teacher_name:
            teacherProfile?.full_name ||
            "Unknown Teacher",

          zoom_meeting_id:
            schedule.zoom_meeting_id || null,

          zoom_join_url:
            schedule.zoom_join_url || null,

          attendance_status:
            attendanceRecord?.status || null,

          attendance_note:
            attendanceRecord?.note || null,
        };
      }
    );

    const attendanceResult = (attendance || []).map(
      (item) => {
        const schedule = (schedules || []).find(
          (scheduleItem) =>
            scheduleItem.id === item.schedule_id
        );

        const enrollment = schedule
          ? enrollmentMap.get(
              schedule.enrollment_id
            )
          : null;

        const course = enrollment
          ? courseMap.get(enrollment.course_id)
          : null;

        const teacher = enrollment
          ? teacherMap.get(enrollment.teacher_id)
          : null;

        const teacherProfile = teacher
          ? profileMap.get(teacher.profile_id)
          : null;

        return {
          id: item.id,
          schedule_id: item.schedule_id,
          student_id: item.student_id,
          status: item.status,
          note: item.note || "",
          created_at: item.created_at,

          schedule_date:
            schedule?.schedule_date || "",

          start_time:
            schedule?.start_time || "",

          end_time:
            schedule?.end_time || "",

          course_name:
            course?.name || "Unknown Course",

          teacher_name:
            teacherProfile?.full_name ||
            "Unknown Teacher",
        };
      }
    );

    return NextResponse.json({
      student: {
        id: student.id,
        profile_id: student.profile_id,
        full_name:
          auth.profile.full_name,
        email:
          auth.profile.email,
        avatar_url:
          auth.profile.avatar_url,
        date_of_birth:
          student.date_of_birth,
        country:
          student.country,
        parent_name:
          student.parent_name,
        parent_phone:
          student.parent_phone,
        notes:
          student.notes,
        status:
          student.status,
      },

      enrollments:
        enrollmentResult,

      schedules:
        scheduleResult,

      attendance:
        attendanceResult,

      progress:
        progress || [],
    });
  } catch (error) {
    console.error(
      "Student dashboard error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load student dashboard.",
      },
      { status: 500 }
    );
  }
}
