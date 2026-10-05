import { NextResponse } from "next/server";
import { requireTeacher } from "../../../../lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTeacher(request) {
  const auth = await requireTeacher(request);

  if (auth.response) {
    return { auth, teacher: null };
  }

  const { data: teacher, error } = await supabaseAdmin
    .from("teachers")
    .select("id, profile_id")
    .eq("profile_id", auth.profile.id)
    .single();

  if (error || !teacher) {
    return {
      auth,
      teacher: null,
      response: NextResponse.json(
        { error: "Teacher record not found" },
        { status: 404 }
      ),
    };
  }

  return { auth, teacher, response: null };
}

export async function GET(request) {
  const { auth, teacher, response } = await getTeacher(request);

  if (auth.response) {
    return auth.response;
  }

  if (response) {
    return response;
  }

  const { data: enrollments, error: enrollmentError } =
    await supabaseAdmin
      .from("enrollments")
      .select("student_id, course_id")
      .eq("teacher_id", teacher.id)
      .eq("status", "active");

  if (enrollmentError) {
    return NextResponse.json(
      { error: enrollmentError.message },
      { status: 500 }
    );
  }

  const studentIds = [
    ...new Set(
      (enrollments || [])
        .map((item) => item.student_id)
        .filter(Boolean)
    ),
  ];

  if (studentIds.length === 0) {
    return NextResponse.json({ progress: [] });
  }

  const { data: progress, error: progressError } =
    await supabaseAdmin
      .from("progress")
      .select(
        "id, student_id, course_id, teacher_id, score, level, comment, recorded_at"
      )
      .eq("teacher_id", teacher.id)
      .in("student_id", studentIds)
      .order("recorded_at", { ascending: false });

  if (progressError) {
    return NextResponse.json(
      { error: progressError.message },
      { status: 500 }
    );
  }

  const courseIds = [
    ...new Set(
      (progress || [])
        .map((item) => item.course_id)
        .filter(Boolean)
    ),
  ];

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id, profile_id")
    .in("id", studentIds);

  const profileIds = (students || [])
    .map((student) => student.profile_id)
    .filter(Boolean);

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds);

  const { data: courses } = courseIds.length
    ? await supabaseAdmin
        .from("courses")
        .select("id, name")
        .in("id", courseIds)
    : { data: [] };

  const result = (progress || []).map((item) => {
    const student = (students || []).find(
      (student) => student.id === item.student_id
    );

    const profile = (profiles || []).find(
      (profile) => profile.id === student?.profile_id
    );

    const course = (courses || []).find(
      (course) => course.id === item.course_id
    );

    return {
      ...item,
      student_name: profile?.full_name || "Unknown Student",
      course_name: course?.name || "General",
    };
  });

  return NextResponse.json({
    progress: result,
  });
}

export async function POST(request) {
  const { auth, teacher, response } = await getTeacher(request);

  if (auth.response) {
    return auth.response;
  }

  if (response) {
    return response;
  }

  try {
    const body = await request.json();

    const {
      student_id,
      course_id,
      score,
      level,
      comment,
    } = body;
const normalizedCourseId =
  course_id === "null" || course_id === "" || course_id === null
    ? null
    : course_id;

console.log("PROGRESS DEBUG:", {
  student_id,
  course_id,
  normalizedCourseId,
  teacher_id: teacher.id,
});

    if (!student_id) {
      return NextResponse.json(
        { error: "Student is required." },
        { status: 400 }
      );
    }

    const { data: enrollment, error: enrollmentError } =
      await supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("teacher_id", teacher.id)
        .eq("student_id", student_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

    if (enrollmentError) {
      return NextResponse.json(
        { error: enrollmentError.message },
        { status: 500 }
      );
    }

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not assigned to this student." },
        { status: 403 }
      );
    }

let existingProgressQuery = supabaseAdmin
  .from("progress")
  .select("id")
  .eq("student_id", student_id)
  .eq("teacher_id", teacher.id);

if (normalizedCourseId) {
  existingProgressQuery = existingProgressQuery.eq(
    "course_id",
normalizedCourseId,
  );
} else {
  existingProgressQuery = existingProgressQuery.is(
    "course_id",
    null
  );
}

const { data: existingProgress, error: existingError } =
  await existingProgressQuery
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

console.log("EXISTING PROGRESS DEBUG:", {
  existingProgress,
  existingError,
});

if (existingError) {
  return NextResponse.json(
    { error: existingError.message },
    { status: 500 }
  );
}

let progress;
let saveError;

const progressData = {
  score:
    score === "" || score === null || score === undefined
      ? null
      : Number(score),
  level: level || null,
  comment: comment || null,
};

if (existingProgress?.id) {
  const result = await supabaseAdmin
    .from("progress")
    .update(progressData)
    .eq("id", existingProgress.id)
    .select(
      "id, student_id, course_id, teacher_id, score, level, comment, recorded_at"
    )
    .single();

  progress = result.data;
  saveError = result.error;
} else {
  const result = await supabaseAdmin
    .from("progress")
    .insert({
      student_id,
course_id: normalizedCourseId,
      teacher_id: teacher.id,
      ...progressData,
    })
    .select(
      "id, student_id, course_id, teacher_id, score, level, comment, recorded_at"
    )
    .single();

  progress = result.data;
  saveError = result.error;
}

if (saveError) {
  return NextResponse.json(
    { error: saveError.message },
    { status: 500 }
  );
}

return NextResponse.json({ progress });
  } catch (error) {
    console.error("PROGRESS ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Invalid request data." },
      { status: 400 }
    );
  }
}
