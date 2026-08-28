import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacher_id");
    const studentIdFilter = searchParams.get("student_id");

    const { data: schedules, error } = await supabase
      .from("schedule")
      .select(`
        id,
weekly_schedule_id,
enrollment_id,
schedule_date,
        start_time,
        end_time,
        status,
        enrollments!schedule_enrollment_id_fkey(
          student_id,
          teacher_id,
          course_id
        )
      `)
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Schedule query error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows = schedules || [];

    const enrollmentRows = rows.map((item) => {
      const enrollment = Array.isArray(item.enrollments)
        ? item.enrollments[0]
        : item.enrollments;

      return {
        ...item,
        enrollment,
      };
    });

    const studentIds = [
      ...new Set(
        enrollmentRows
          .map((x) => x.enrollment?.student_id)
          .filter(Boolean)
      ),
    ];

    const teacherIds = [
      ...new Set(
        enrollmentRows
          .map((x) => x.enrollment?.teacher_id)
          .filter(Boolean)
      ),
    ];

    const courseIds = [
      ...new Set(
        enrollmentRows
          .map((x) => x.enrollment?.course_id)
          .filter(Boolean)
      ),
    ];

    const [studentsResult, teachersResult, coursesResult] =
      await Promise.all([
        studentIds.length
          ? supabase
              .from("students")
              .select("id, profile_id")
              .in("id", studentIds)
          : { data: [] },

        teacherIds.length
          ? supabase
              .from("teachers")
              .select("id, profile_id")
              .in("id", teacherIds)
          : { data: [] },

        courseIds.length
          ? supabase
              .from("courses")
              .select("id, name")
              .in("id", courseIds)
          : { data: [] },
      ]);

    const students = studentsResult.data || [];
    const teachers = teachersResult.data || [];
    const courses = coursesResult.data || [];

    const profileIds = [
      ...new Set([
        ...students.map((x) => x.profile_id),
        ...teachers.map((x) => x.profile_id),
      ].filter(Boolean)),
    ];

    const { data: profiles, error: profilesError } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error("Profiles query error:", profilesError);

      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const studentMap = new Map(
      students.map((x) => [x.id, x])
    );

    const teacherMap = new Map(
      teachers.map((x) => [x.id, x])
    );

    const courseMap = new Map(
      courses.map((x) => [x.id, x])
    );

    const profileMap = new Map(
      (profiles || []).map((x) => [x.id, x.full_name])
    );

    const result = enrollmentRows
      .filter((item) => {
        const enrollment = item.enrollment;

        if (!enrollment) return false;

        if (
          teacherId &&
          enrollment.teacher_id !== teacherId
        ) {
          return false;
        }

        if (
          studentIdFilter &&
          enrollment.student_id !== studentIdFilter
        ) {
          return false;
        }

        return true;
      })
      .map((item) => {
        const enrollment = item.enrollment;

        const student = studentMap.get(
          enrollment.student_id
        );

        const teacher = teacherMap.get(
          enrollment.teacher_id
        );

        const course = courseMap.get(
          enrollment.course_id
        );

        return {
          id: item.id,
weekly_schedule_id: item.weekly_schedule_id || null,
          enrollment_id: item.enrollment_id,
          student_id: enrollment.student_id || "",
          teacher_id: enrollment.teacher_id || "",
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
          status: item.status,

          student_name:
            profileMap.get(student?.profile_id) ||
            "Unknown Student",

          teacher_name:
            profileMap.get(teacher?.profile_id) ||
            "Unknown Teacher",

          course_name:
            course?.name ||
            "Unknown Course",
        };
      });

    return NextResponse.json({
      schedules: result,
    });
  } catch (error) {
    console.error("Schedule GET exception:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const {
      enrollment_id,
      schedule_date,
      start_time,
      end_time,
    } = body;

    if (
      !enrollment_id ||
      !schedule_date ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("schedule")
      .insert({
        id: crypto.randomUUID(),
        enrollment_id,
        schedule_date,
        start_time,
        end_time,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { schedule: data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const {
      id,
      schedule_date,
      start_time,
      end_time,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const updates = {};

    if (schedule_date) {
      updates.schedule_date = schedule_date;
    }

    if (start_time) {
      updates.start_time = start_time;
    }

    if (end_time) {
      updates.end_time = end_time;
    }

    if (status) {
      updates.status = status;
    }

    const { data, error } = await supabase
      .from("schedule")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      schedule: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("schedule")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
