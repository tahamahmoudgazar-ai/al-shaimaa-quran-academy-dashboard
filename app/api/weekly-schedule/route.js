import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../lib/supabase";
import { requireAdmin } from "../../../lib/auth";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const {
      enrollment_id,
      day_of_week,
      start_time,
      end_time
    } = body;

    if (
      !enrollment_id ||
      day_of_week === undefined ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const day = Number(day_of_week);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json(
        { error: "day_of_week must be between 0 and 6." },
        { status: 400 }
      );
    }

    const timePattern =
      /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

    if (
      !timePattern.test(start_time) ||
      !timePattern.test(end_time)
    ) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM." },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: duplicate, error: duplicateError } =
      await supabase
        .from("weekly_schedule")
        .select("id")
        .eq("enrollment_id", enrollment_id)
        .eq("day_of_week", day)
        .eq("start_time", start_time)
        .eq("end_time", end_time)
        .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        { error: duplicateError.message },
        { status: 500 }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        { error: "This weekly class already exists." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("weekly_schedule")
      .insert({
        enrollment_id,
        day_of_week: day,
        start_time,
        end_time
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const now = new Date();

    const currentMonth =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

    let generationResult = null;

    try {
      const generateUrl = new URL(
        "/api/schedule/generate",
        request.url
      );

      const generateResponse = await fetch(
        generateUrl,
        {
          method: "POST",
          headers: {
"Content-Type": "application/json",
"Cookie": request.headers.get("cookie") || ""
          },
          body: JSON.stringify({
            month: currentMonth
          }),
          cache: "no-store"
        }
      );

      generationResult =
        await generateResponse.json();

      if (!generateResponse.ok) {
        return NextResponse.json(
          {
            success: true,
            weekly: data,
            warning:
              generationResult?.error ||
              "Weekly class added, but monthly schedule could not be generated."
          },
          { status: 201 }
        );
      }
    } catch (generationError) {
      return NextResponse.json(
        {
          success: true,
          weekly: data,
          warning:
            generationError?.message ||
            "Weekly class added, but monthly schedule could not be generated."
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        weekly: data,
        monthly: generationResult
      },
      { status: 201 }
    );
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("weekly_schedule")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Weekly class not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Weekly class deleted successfully.",
      deleted: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const {
      id,
      day_of_week,
      start_time,
      end_time
    } = body;

    if (
      !id ||
      day_of_week === undefined ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const day = Number(day_of_week);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json(
        { error: "day_of_week must be between 0 and 6." },
        { status: 400 }
      );
    }

    const timePattern =
      /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

    if (
      !timePattern.test(start_time) ||
      !timePattern.test(end_time)
    ) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM." },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: current, error: currentError } =
      await supabase
        .from("weekly_schedule")
        .select("id, enrollment_id")
        .eq("id", id)
        .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        { error: currentError.message },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { error: "Weekly class not found." },
        { status: 404 }
      );
    }

    const { data: duplicate, error: duplicateError } =
      await supabase
        .from("weekly_schedule")
        .select("id")
        .eq("enrollment_id", current.enrollment_id)
        .eq("day_of_week", day)
        .eq("start_time", start_time)
        .eq("end_time", end_time)
        .neq("id", id)
        .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        { error: duplicateError.message },
        { status: 500 }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        { error: "This weekly class already exists." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("weekly_schedule")
      .update({
        day_of_week: day,
        start_time,
        end_time
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacher_id");

    const supabase = getSupabaseClient();

    let enrollmentQuery = supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        course_id,
        teacher_id
      `);

    if (teacherId) {
      enrollmentQuery = enrollmentQuery.eq(
        "teacher_id",
        teacherId
      );
    }

    const {
      data: enrollments,
      error: enrollmentError
    } = await enrollmentQuery;

    if (enrollmentError) {
      return NextResponse.json(
        { error: enrollmentError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json([]);
    }

    const enrollmentIds = enrollments.map(
      (item) => item.id
    );

    const { data: weeklyRows, error: weeklyError } =
      await supabase
        .from("weekly_schedule")
        .select(`
          id,
          enrollment_id,
          day_of_week,
          start_time,
          end_time
        `)
        .in("enrollment_id", enrollmentIds)
        .order("day_of_week")
        .order("start_time");

    if (weeklyError) {
      return NextResponse.json(
        { error: weeklyError.message },
        { status: 500 }
      );
    }

    if (!weeklyRows || weeklyRows.length === 0) {
      return NextResponse.json([]);
    }

    const studentIds = [
      ...new Set(
        enrollments
          .map((item) => item.student_id)
          .filter(Boolean)
      )
    ];

    const teacherIds = [
      ...new Set(
        enrollments
          .map((item) => item.teacher_id)
          .filter(Boolean)
      )
    ];

    const courseIds = [
      ...new Set(
        enrollments
          .map((item) => item.course_id)
          .filter(Boolean)
      )
    ];

    /*
     * STUDENTS
     */

    const { data: students, error: studentsError } =
      await supabase
        .from("students")
        .select("id, profile_id")
        .in("id", studentIds);

    if (studentsError) {
      return NextResponse.json(
        { error: studentsError.message },
        { status: 500 }
      );
    }

    /*
     * TEACHERS
     */

    const { data: teachers, error: teachersError } =
      await supabase
        .from("teachers")
        .select("id, profile_id")
        .in("id", teacherIds);

    if (teachersError) {
      return NextResponse.json(
        { error: teachersError.message },
        { status: 500 }
      );
    }

    /*
     * COURSES
     */

    const { data: courses, error: coursesError } =
      await supabase
        .from("courses")
        .select("id, name")
        .in("id", courseIds);

    if (coursesError) {
      return NextResponse.json(
        { error: coursesError.message },
        { status: 500 }
      );
    }

    /*
     * PROFILES
     */

    const profileIds = [
      ...new Set([
        ...(students || [])
          .map((student) => student.profile_id)
          .filter(Boolean),

        ...(teachers || [])
          .map((teacher) => teacher.profile_id)
          .filter(Boolean)
      ])
    ];

    const { data: profiles, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id, full_name");

console.log("PROFILE IDS:", profileIds);
console.log("PROFILES FROM SUPABASE:", profiles);
console.log("PROFILES ERROR:", profilesError);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    /*
     * MAPS
     */

    const profileMap = Object.fromEntries(
      (profiles || []).map((profile) => [
        profile.id,
        profile.full_name
      ])
    );

    const studentMap = Object.fromEntries(
      (students || []).map((student) => [
        student.id,
        profileMap[student.profile_id] || "Student"
      ])
    );

    const teacherMap = Object.fromEntries(
      (teachers || []).map((teacher) => [
        teacher.id,
        profileMap[teacher.profile_id] || "Teacher"
      ])
    );

    const courseMap = Object.fromEntries(
      (courses || []).map((course) => [
        course.id,
        course.name || "Course"
      ])
    );

    const enrollmentMap = Object.fromEntries(
      enrollments.map((enrollment) => [
        enrollment.id,
        enrollment
      ])
    );

    /*
     * FINAL RESULT
     */

    const result = weeklyRows.map((row) => {
      const enrollment =
        enrollmentMap[row.enrollment_id];

      return {
        id: row.id,

        enrollment_id:
          row.enrollment_id,

        day_of_week:
          row.day_of_week,

        start_time:
          row.start_time,

        end_time:
          row.end_time,

        studentName:
          studentMap[enrollment?.student_id] ||
          "Student",

        courseName:
          courseMap[enrollment?.course_id] ||
          "Course",

        teacherId:
          enrollment?.teacher_id || "",

        teacherName:
          teacherMap[enrollment?.teacher_id] ||
          "Teacher"
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error(
      "Weekly schedule GET error:",
      error
    );

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
