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

  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from("teachers")
    .select("id, profile_id, specialization, status")
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
        "id, student_id, course_id, start_date, end_date, status"
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
      students: [],
    });
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

  const { data: students, error: studentsError } =
    await supabaseAdmin
      .from("students")
      .select(
        "id, profile_id, date_of_birth, country, parent_name, parent_phone, status"
      )
      .in("id", studentIds);

  if (studentsError) {
    return NextResponse.json(
      { error: studentsError.message },
      { status: 500 }
    );
  }

  const profileIds = (students || [])
    .map((student) => student.profile_id)
    .filter(Boolean);

  const { data: profiles, error: profilesError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", profileIds);

  if (profilesError) {
    return NextResponse.json(
      { error: profilesError.message },
      { status: 500 }
    );
  }

  const { data: courses, error: coursesError } =
    await supabaseAdmin
      .from("courses")
      .select("id, name")
      .in("id", courseIds);

  if (coursesError) {
    return NextResponse.json(
      { error: coursesError.message },
      { status: 500 }
    );
  }

  const result = (students || []).map((student) => {
    const profile = (profiles || []).find(
      (item) => item.id === student.profile_id
    );

    const studentEnrollments = enrollments.filter(
      (enrollment) => enrollment.student_id === student.id
    );

    const coursesForStudent = studentEnrollments
      .map((enrollment) => {
        const course = (courses || []).find(
          (item) => item.id === enrollment.course_id
        );

        return {
          enrollment_id: enrollment.id,
          course_id: enrollment.course_id,
          course_name: course?.name || "Unknown Course",
          start_date: enrollment.start_date,
          end_date: enrollment.end_date,
          status: enrollment.status,
        };
      })
      .filter(Boolean);

    return {
      id: student.id,
      profile_id: student.profile_id,
      full_name: profile?.full_name || "Unknown Student",
      email: profile?.email || null,
      phone: profile?.phone || null,
      avatar_url: profile?.avatar_url || null,
      date_of_birth: student.date_of_birth,
      country: student.country,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      status: student.status,
      courses: coursesForStudent,
    };
  });

  return NextResponse.json({
    students: result,
  });
}
