import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("students")
      .select(`
        id,
        profile_id,
        country,
        parent_name,
        parent_phone,
        status,
        created_at,
        profiles (
          full_name,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      student: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load student."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data: student, error: findError } =
      await supabase
        .from("students")
        .select("id, profile_id")
        .eq("id", id)
        .single();

    if (findError || !student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const { error: deleteStudentError } =
      await supabase
        .from("students")
        .delete()
        .eq("id", id);

    if (deleteStudentError) {
      return NextResponse.json(
        { error: deleteStudentError.message },
        { status: 400 }
      );
    }

    if (student.profile_id) {
      const { error: deleteProfileError } =
        await supabase
          .from("profiles")
          .delete()
          .eq("id", student.profile_id);

      if (deleteProfileError) {
        return NextResponse.json(
          {
            error:
              "Student deleted, but profile could not be deleted."
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to delete student."
      },
      { status: 500 }
    );
  }
}
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      email,
      country,
      parentName,
      parentPhone,
      status
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Student name is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: student, error: studentError } =
      await supabase
        .from("students")
        .select("id, profile_id")
        .eq("id", id)
        .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        email: email?.trim() || null
      })
      .eq("id", student.profile_id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("students")
      .update({
        country: country?.trim() || null,
        parent_name: parentName?.trim() || null,
        parent_phone: parentPhone?.trim() || null,
        status: status || "active"
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
      student: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to update student."
      },
      { status: 500 }
    );
  }
}
