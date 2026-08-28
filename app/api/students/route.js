import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth";
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      students: data || []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load students." },
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
      full_name,
      email,
      country,
      parent_name,
      parent_phone
    } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: "Student name is required." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Student email is required." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Create the authentication user
    const temporaryPassword =
      "Student@" + Math.random().toString(36).slice(-10);

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.trim(),
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role: "student"
        }
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Create the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: full_name.trim(),
        email: email.trim(),
        role: "student"
      })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // 3. Create the student record
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        profile_id: userId,
        country: country || null,
        parent_name: parent_name || null,
        parent_phone: parent_phone || null,
        status: "active"
      })
      .select()
      .single();

    if (studentError) {
      await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: studentError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        student,
        message: "Student created successfully."
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Unexpected server error."
      },
      { status: 500 }
    );
  }
}
