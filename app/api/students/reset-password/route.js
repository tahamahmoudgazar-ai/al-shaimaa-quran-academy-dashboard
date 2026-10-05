import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";

export async function POST(request) {
  const auth = await requireAdmin(request);

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const { student_id, password } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, profile_id")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(
        student.profile_id,
        {
          password
        }
      );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student password updated successfully."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Failed to reset student password."
      },
      { status: 500 }
    );
  }
}
