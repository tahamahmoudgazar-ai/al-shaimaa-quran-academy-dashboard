import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const {
      studentId,
      currentSurah,
      lastMemorized,
      lastRevision,
      progressPercent
    } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: existing } = await supabase
      .from("progress")
      .select("id")
      .eq("student_id", studentId)
      .limit(1)
      .maybeSingle();

    let result;

    if (existing) {
      result = await supabase
        .from("progress")
        .update({
          current_surah: currentSurah || null,
          last_memorized: lastMemorized || null,
          last_revision: lastRevision || null,
          progress_percent:
            progressPercent === ""
              ? null
              : Number(progressPercent)
        })
        .eq("student_id", studentId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("progress")
        .insert({
          student_id: studentId,
          current_surah: currentSurah || null,
          last_memorized: lastMemorized || null,
          last_revision: lastRevision || null,
          progress_percent:
            progressPercent === ""
              ? null
              : Number(progressPercent)
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: result.data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
