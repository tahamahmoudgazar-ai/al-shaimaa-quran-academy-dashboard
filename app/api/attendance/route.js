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

    const { data: attendance, error: attendanceError } =
      await supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false });

    if (attendanceError) {
      return NextResponse.json(
        { error: attendanceError.message },
        { status: 500 }
      );
    }

    const { data: schedules, error: scheduleError } =
      await supabase
        .from("schedule")
        .select("id, schedule_date, start_time, end_time, enrollment_id");

    if (scheduleError) {
      return NextResponse.json(
        { error: scheduleError.message },
        { status: 500 }
      );
    }

    const scheduleMap = new Map(
      (schedules || []).map((item) => [item.id, item])
    );

    const result = [];

    for (const item of attendance || []) {
      let studentName = "Unknown Student";

      const { data: student } = await supabase
        .from("students")
        .select("profile_id")
        .eq("id", item.student_id)
        .maybeSingle();

      if (student?.profile_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", student.profile_id)
          .maybeSingle();

        studentName = profile?.full_name || studentName;
      }

      const schedule = scheduleMap.get(item.schedule_id);

      let teacherId = "";
      let courseName = "";
      let teacherName = "";

      if (schedule?.enrollment_id) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("teacher_id, course_id")
          .eq("id", schedule.enrollment_id)
          .maybeSingle();

        teacherId = enrollment?.teacher_id || "";

        if (enrollment?.course_id) {
          const { data: course } = await supabase
            .from("courses")
            .select("name")
            .eq("id", enrollment.course_id)
            .maybeSingle();

          courseName = course?.name || "";
        }

        if (teacherId) {
          const { data: teacher } = await supabase
            .from("teachers")
            .select("profile_id")
            .eq("id", teacherId)
            .maybeSingle();

          if (teacher?.profile_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", teacher.profile_id)
              .maybeSingle();

            teacherName = profile?.full_name || "";
          }
        }
      }

      result.push({
        id: item.id,
        schedule_id: item.schedule_id,
        student_id: item.student_id,
        student_name: studentName,
        course_name: courseName,
        status: item.status,
        note: item.note || "",
        recorded_by: item.recorded_by,
        created_at: item.created_at,
        schedule_date: schedule?.schedule_date || "",
        start_time: schedule?.start_time || "",
        end_time: schedule?.end_time || "",
        enrollment_id: schedule?.enrollment_id || "",
        teacher_id: teacherId,
        teacher_name: teacherName,
      });
    }

    return NextResponse.json({
      attendance: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message || "Failed to load attendance."
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
      schedule_id,
      student_id,
      status,
      note,
      recorded_by,
    } = body;

    if (!schedule_id || !student_id || !status) {
      return NextResponse.json(
        {
          error:
            "Schedule, student and attendance status are required.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "present",
      "absent",
      "late",
      "excused",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("schedule_id", schedule_id)
      .eq("student_id", student_id)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      const result = await supabase
        .from("attendance")
        .update({
          status,
          note: note || null,
          recorded_by: recorded_by || null,
        })
        .eq("schedule_id", schedule_id)
        .eq("student_id", student_id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("attendance")
        .insert({
          schedule_id,
          student_id,
          status,
          note: note || null,
          recorded_by: recorded_by || null,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendance: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message || "Failed to record attendance."
      },
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
      status,
      note,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Attendance ID is required." },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "present",
      "absent",
      "late",
      "excused",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 }
      );
    }

    const updates = {};

    if (status) updates.status = status;
    if (note !== undefined) updates.note = note || null;

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("attendance")
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
      success: true,
      attendance: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message || "Failed to update attendance."
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
        { error: "Attendance ID is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("attendance")
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
      message: "Attendance deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message || "Failed to delete attendance."
      },
      { status: 500 }
    );
  }
}
