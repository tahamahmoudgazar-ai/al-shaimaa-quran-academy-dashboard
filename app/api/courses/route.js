import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const db = supabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { data, error } = await db
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json({ course: data });
    }

    const { data, error } = await db
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      courses: data || []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
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
      name,
      description,
      category,
      level,
      duration_weeks,
      price,
      status
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase()
      .from("courses")
      .insert({
        name: name.trim(),
        description: description || null,
        category: category || null,
        level: level || null,
        duration_weeks:
          duration_weeks === "" || duration_weeks == null
            ? null
            : Number(duration_weeks),
        price:
          price === "" || price == null
            ? null
            : Number(price),
        status: status || "active"
      })
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
      course: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
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
      name,
      description,
      category,
      level,
      duration_weeks,
      price,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase()
      .from("courses")
      .update({
        name: name.trim(),
        description: description || null,
        category: category || null,
        level: level || null,
        duration_weeks:
          duration_weeks === "" || duration_weeks == null
            ? null
            : Number(duration_weeks),
        price:
          price === "" || price == null
            ? null
            : Number(price),
        status: status || "active"
      })
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
      course: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update course." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const db = supabase();

    const { error: deleteError } = await db
      .from("courses")
      .delete()
      .eq("id", id);

    if (!deleteError) {
      return NextResponse.json({
        success: true,
        deleted: true,
        message: "Course deleted successfully."
      });
    }

    // If the course is connected to enrollments,
    // keep the historical data and deactivate the course.
    const { error: deactivateError } = await db
      .from("courses")
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
      message: "Course is connected to existing records and was deactivated instead."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete course." },
      { status: 500 }
    );
  }
}
