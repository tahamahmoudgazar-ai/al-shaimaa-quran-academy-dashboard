import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const studentId = String(body.studentId || "").trim();
    const password = String(body.password || "");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (password.length > 72) {
      return NextResponse.json(
        { error: "Password must not exceed 72 characters." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, profile_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student?.profile_id) {
      return NextResponse.json(
        { error: "Student account was not found." },
        { status: 404 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", student.profile_id)
      .single();

    if (profileError || !profile || profile.role !== "student") {
      return NextResponse.json(
        { error: "A valid student profile was not found." },
        { status: 404 }
      );
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(
        student.profile_id,
        { password }
      );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student password updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update student password." },
      { status: 500 }
    );
  }
}
