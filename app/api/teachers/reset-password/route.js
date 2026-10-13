import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { teacherId, password } = await request.json();

    if (!teacherId || typeof teacherId !== "string") {
      return NextResponse.json(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" ||
        password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: teacher, error: teacherError } = await db
      .from("teachers")
      .select("id, profile_id")
      .eq("id", teacherId)
      .single();

    if (teacherError || !teacher?.profile_id) {
      return NextResponse.json(
        { error: "Teacher account was not found." },
        { status: 404 }
      );
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", teacher.profile_id)
      .single();

    if (
      profileError ||
      !profile ||
      String(profile.role || "").toLowerCase() !== "teacher"
    ) {
      return NextResponse.json(
        { error: "A valid teacher profile was not found." },
        { status: 404 }
      );
    }

    const { error: updateError } =
      await db.auth.admin.updateUserById(
        teacher.profile_id,
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
      message: "Teacher password updated successfully."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update teacher password." },
      { status: 500 }
    );
  }
}
