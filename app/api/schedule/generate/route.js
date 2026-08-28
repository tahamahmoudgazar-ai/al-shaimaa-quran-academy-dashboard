import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const month = body.month;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Month is required in YYYY-MM format." },
        { status: 400 }
      );
    }

    const [year, monthNumber] = month
      .split("-")
      .map(Number);

    const firstDay = new Date(
      Date.UTC(year, monthNumber - 1, 1)
    );

    const lastDay = new Date(
      Date.UTC(year, monthNumber, 0)
    );

    const supabase = getSupabase();

    const { data: weeklyRows, error: weeklyError } =
      await supabase
        .from("weekly_schedule")
        .select(
          "id, enrollment_id, day_of_week, start_time, end_time"
        );

    if (weeklyError) {
      return NextResponse.json(
        { error: weeklyError.message },
        { status: 500 }
      );
    }

    if (!weeklyRows || weeklyRows.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        skipped: 0,
        message: "No weekly schedules found."
      });
    }

    const startDate = firstDay.toISOString().slice(0, 10);
    const endDate = lastDay.toISOString().slice(0, 10);

    const { data: existingRows, error: existingError } =
      await supabase
        .from("schedule")
        .select(
          "enrollment_id, schedule_date, start_time, end_time"
        )
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const existingKeys = new Set(
      (existingRows || []).map(
        (row) =>
          `${row.enrollment_id}|${row.schedule_date}|${row.start_time}|${row.end_time}`
      )
    );

    const rowsToInsert = [];
    let skipped = 0;

    for (const weekly of weeklyRows) {
      const targetDay = Number(weekly.day_of_week);

      for (
        let date = new Date(firstDay);
        date <= lastDay;
        date.setUTCDate(date.getUTCDate() + 1)
      ) {
        if (date.getUTCDay() !== targetDay) {
          continue;
        }

        const scheduleDate =
          date.toISOString().slice(0, 10);

        const key =
          `${weekly.enrollment_id}|${scheduleDate}|${weekly.start_time}|${weekly.end_time}`;

        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }

        rowsToInsert.push({
  id: crypto.randomUUID(),
  weekly_schedule_id: weekly.id,
  enrollment_id: weekly.enrollment_id,
  schedule_date: scheduleDate,
  start_time: weekly.start_time,
  end_time: weekly.end_time,
  status: "scheduled"
});

        existingKeys.add(key);
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } =
        await supabase
          .from("schedule")
          .insert(rowsToInsert);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      month,
      created: rowsToInsert.length,
      skipped,
      message: `Monthly schedule generated successfully. ${rowsToInsert.length} classes created and ${skipped} existing classes skipped.`
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to generate monthly schedule."
      },
      { status: 500 }
    );
  }
}
