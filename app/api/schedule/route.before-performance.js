import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacher_id");
    const studentIdFilter = searchParams.get("student_id");

    const { data: schedules, error } = await supabase
      .from("schedule")
      .select("*")
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = [];

    for (const item of schedules || []) {
      let studentId = "";
      let teacherIdValue = "";
      let studentName = "Unknown Student";
      let teacherName = "Unknown Teacher";
      let courseName = "Unknown Course";

      if (item.enrollment_id) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("student_id, teacher_id, course_id")
          .eq("id", item.enrollment_id)
          .single();

        if (enrollment) {
          studentId = enrollment.student_id || "";
          teacherIdValue = enrollment.teacher_id || "";

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

              studentName =
                profile?.full_name || studentName;
            }
          }

          if (enrollment.teacher_id) {
            const { data: teacher } = await supabase
              .from("teachers")
              .select("profile_id")
              .eq("id", enrollment.teacher_id)
              .single();

            if (teacher?.profile_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", teacher.profile_id)
                .single();

              teacherName =
                profile?.full_name || teacherName;
            }
          }

          if (enrollment.course_id) {
            const { data: course } = await supabase
              .from("courses")
              .select("name")
              .eq("id", enrollment.course_id)
              .single();

            courseName =
              course?.name || courseName;
          }
        }
      }

      if (
        teacherId &&
        teacherIdValue !== teacherId
      ) {
        continue;
      }

      if (
        studentIdFilter &&
        studentId !== studentIdFilter
      ) {
        continue;
      }

      result.push({
        id: item.id,
        enrollment_id: item.enrollment_id,
        student_id: studentId,
        teacher_id: teacherIdValue,
        schedule_date: item.schedule_date,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status,
        student_name: studentName,
        teacher_name: teacherName,
        course_name: courseName,
      });
    }

    return NextResponse.json({
      schedules: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
