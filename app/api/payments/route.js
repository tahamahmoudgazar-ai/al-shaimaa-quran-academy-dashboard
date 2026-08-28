import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../lib/auth";
import crypto from "crypto";

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

    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = [];

    for (const item of payments || []) {
      let studentName = "Unknown Student";

      if (item.student_id) {
        const { data: student } = await supabase
          .from("students")
          .select("profile_id")
          .eq("id", item.student_id)
          .single();

        if (student?.profile_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", student.profile_id)
            .single();

          studentName = profile?.full_name || studentName;
        }
      }

      result.push({
        id: item.id || null,
        student_id: item.student_id,
        student_name: studentName,
        amount: item.amount,
        currency: item.currency || "USD",
        payment_date: item.payment_date,
        method: item.method || "",
        reference: item.reference || "",
        status: item.status || "paid",
        note: item.note || "",
        created_at: item.created_at,
      });
    }

    return NextResponse.json({
      payments: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load payments." },
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
      student_id,
      amount,
      currency,
      payment_date,
      method,
      reference,
      status,
      note,
    } = body;

    if (!student_id || amount === undefined || amount === "") {
      return NextResponse.json(
        { error: "Student and amount are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const newId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        id: newId,
        student_id,
        amount: Number(amount),
        currency: currency || "USD",
        payment_date: payment_date || undefined,
        method: method || null,
        reference: reference || null,
        status: status || "paid",
        note: note || null,
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
      {
        success: true,
        payment: data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create payment." },
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
      reference: incomingReference,
      student_id,
      amount,
      currency,
      payment_date,
      method,
      status,
      note,
    } = body;

    if (!id && !incomingReference) {
      return NextResponse.json(
        { error: "Payment ID or reference is required." },
        { status: 400 }
      );
    }

    const updates = {};

    if (student_id) updates.student_id = student_id;

    if (amount !== undefined && amount !== "") {
      updates.amount = Number(amount);
    }

    if (currency !== undefined) {
      updates.currency = currency;
    }

    if (payment_date !== undefined) {
      updates.payment_date = payment_date;
    }

    if (method !== undefined) {
      updates.method = method || null;
    }

    if (incomingReference !== undefined) {
      updates.reference = incomingReference || null;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (note !== undefined) {
      updates.note = note || null;
    }

    const supabase = getSupabase();

    let query = supabase
      .from("payments")
      .update(updates);

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("reference", incomingReference);
    }

    const { data, error } = await query
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
      payment: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update payment." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const { id, reference } = body;

    if (!id && !reference) {
      return NextResponse.json(
        { error: "Payment ID or reference is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from("payments")
      .delete();

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("reference", reference);
    }

    const { data, error } = await query
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete payment." },
      { status: 500 }
    );
  }
}
