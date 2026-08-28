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

    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        course_id,
        teacher_id,
        status
      `)
      
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows = enrollments || [];

    const studentIds = [
      ...new Set(
        rows.map((item) => item.student_id).filter(Boolean)
      ),
    ];

    const teacherIds = [
      ...new Set(
        rows.map((item) => item.teacher_id).filter(Boolean)
      ),
    ];

    const courseIds = [
      ...new Set(
        rows.map((item) => item.course_id).filter(Boolean)
      ),
    ];

    const [studentsResult, teachersResult, coursesResult] =
      await Promise.all([
        studentIds.length
          ? supabase
              .from("students")
              .select("id, profile_id")
              .in("id", studentIds)
          : { data: [], error: null },

        teacherIds.length
          ? supabase
              .from("teachers")
              .select("id, profile_id")
              .in("id", teacherIds)
          : { data: [], error: null },

        courseIds.length
          ? supabase
              .from("courses")
              .select("id, name")
              .in("id", courseIds)
          : { data: [], error: null },
      ]);

    if (studentsResult.error) {
      return NextResponse.json(
        { error: studentsResult.error.message },
        { status: 500 }
      );
    }

    if (teachersResult.error) {
      return NextResponse.json(
        { error: teachersResult.error.message },
        { status: 500 }
      );
    }

    if (coursesResult.error) {
      return NextResponse.json(
        { error: coursesResult.error.message },
        { status: 500 }
      );
    }

    const students = studentsResult.data || [];
    const teachers = teachersResult.data || [];
    const courses = coursesResult.data || [];

    const profileIds = [
      ...new Set(
        [
          ...students.map((item) => item.profile_id),
          ...teachers.map((item) => item.profile_id),
        ].filter(Boolean)
      ),
    ];

    const { data: profiles, error: profilesError } =
      profileIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", profileIds)
        : { data: [], error: null };

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const studentMap = new Map(
      students.map((item) => [item.id, item])
    );

    const teacherMap = new Map(
      teachers.map((item) => [item.id, item])
    );

    const courseMap = new Map(
      courses.map((item) => [item.id, item])
    );

    const profileMap = new Map(
      (profiles || []).map((item) => [
        item.id,
        item.full_name,
      ])
    );

    const result = rows.map((item) => {
      const student = studentMap.get(item.student_id);
      const teacher = teacherMap.get(item.teacher_id);
      const course = courseMap.get(item.course_id);

      return {
        id: item.id,
        student_id: item.student_id,
        teacher_id: item.teacher_id,
        course_id: item.course_id,
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
      enrollments: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load enrollments.",
      },
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
      student_id,
      course_id,
      teacher_id,
    } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: "Student is required." },
        { status: 400 }
      );
    }

    if (!course_id) {
      return NextResponse.json(
        { error: "Course is required." },
        { status: 400 }
      );
    }

    if (!teacher_id) {
      return NextResponse.json(
        { error: "Teacher is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: student, error: studentError } =
      await supabase
        .from("students")
        .select("id")
        .eq("id", student_id)
        .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const { data: course, error: courseError } =
      await supabase
        .from("courses")
        .select("id, name")
        .eq("id", course_id)
        .eq("status", "active")
        .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found or inactive." },
        { status: 404 }
      );
    }

    const { data: teacher, error: teacherError } =
      await supabase
        .from("teachers")
        .select("id")
        .eq("id", teacher_id)
        .eq("status", "active")
        .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: "Teacher not found or inactive." },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", student_id)
      .eq("course_id", course_id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "This student is already enrolled in this course.",
        },
        { status: 409 }
      );
    }

    const { data: enrollment, error } =
      await supabase
        .from("enrollments")
        .insert({
          student_id,
          course_id,
          teacher_id,
          status: "active",
        })
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment,
      course,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to add enrollment.",
      },
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
      student_id,
      course_id,
      teacher_id,
    } = body;

    if (body.action === "restore") {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("enrollments")
        .update({ status: "active" })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        enrollment: data,
        message: "Enrollment restored successfully.",
      });
    }
    if (!id) {
      return NextResponse.json(
        { error: "Enrollment ID is required." },
        { status: 400 }
      );
    }

    if (!student_id || !course_id || !teacher_id) {
      return NextResponse.json(
        {
          error:
            "Student, course and teacher are required.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: enrollment, error: enrollmentError } =
      await supabase
        .from("enrollments")
        .select("id, status")
        .eq("id", id)
        .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found." },
        { status: 404 }
      );
    }

    const { data: duplicate } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", student_id)
      .eq("course_id", course_id)
      .eq("status", "active")
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "This student is already enrolled in this course.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update({
        student_id,
        course_id,
        teacher_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment: data,
      message: "Enrollment updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to update enrollment.",
      },
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
        { error: "Enrollment ID is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: enrollment, error: findError } =
      await supabase
        .from("enrollments")
        .select("id")
        .eq("id", id)
        .single();

    if (findError || !enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found." },
        { status: 404 }
      );
    }

    // Check whether this enrollment is used by scheduled classes.
    const { data: schedules, error: scheduleError } =
      await supabase
        .from("schedule")
        .select("id")
        .eq("enrollment_id", id)
        .limit(1);

    if (scheduleError) {
      return NextResponse.json(
        { error: scheduleError.message },
        { status: 500 }
      );
    }

    // If connected to a schedule, preserve the record.
    if (schedules && schedules.length > 0) {
      const { error: deactivateError } =
        await supabase
          .from("enrollments")
          .update({ status: "inactive" })
          .eq("id", id);

      if (deactivateError) {
        return NextResponse.json(
          { error: deactivateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "Enrollment is connected to scheduled classes and was deactivated instead.",
      });
    }

    // No schedule connection: delete permanently.
    const { error: deleteError } =
      await supabase
        .from("enrollments")
        .delete()
        .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      deactivated: false,
      message: "Enrollment deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to delete enrollment.",
      },
      { status: 500 }
    );
  }
}
