import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME_ZONE = "Africa/Cairo";
const MINUTES_AHEAD = 15;

function secureEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

function cairoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Convert a Cairo wall-clock date/time into a UTC timestamp.
function cairoLocalToUtc(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute, second = 0] = timeString
    .split(":")
    .map(Number);

  const target = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  let guess = target;

  for (let i = 0; i < 5; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );

    const represented = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second)
    );

    const difference = target - represented;
    guess += difference;

    if (difference === 0) break;
  }

  const result = new Date(guess);

  if (Number.isNaN(result.getTime())) {
    throw new Error("Invalid Cairo date or time");
  }

  return result;
}

async function getZoomToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom OAuth environment variables are missing");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Zoom OAuth failed with HTTP ${response.status}`
    );
  }

  return data.access_token;
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase server environment variables are missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request) {
  const expectedSecret = process.env.ZOOM_CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (
    !expectedSecret ||
    !secureEqual(suppliedSecret, expectedSecret)
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createSupabase();
    const now = new Date();
    const today = cairoDate(now);
    const tomorrow = addDays(today, 1);
    const cutoff = new Date(
      now.getTime() + MINUTES_AHEAD * 60 * 1000
    );

    // Only scheduled classes without an existing Zoom meeting.
    const { data: schedules, error: scheduleError } =
      await supabase
        .from("schedule")
        .select(
          "id, enrollment_id, schedule_date, start_time, end_time, status, zoom_meeting_id"
        )
        .eq("status", "scheduled")
        .is("zoom_meeting_id", null)
        .gte("schedule_date", today)
        .lte("schedule_date", tomorrow)
        .order("schedule_date")
        .order("start_time");

    if (scheduleError) throw scheduleError;

    const due = (schedules || [])
      .map((schedule) => {
        try {
          const start = cairoLocalToUtc(
            schedule.schedule_date,
            schedule.start_time
          );
          const end = cairoLocalToUtc(
            schedule.schedule_date,
            schedule.end_time
          );

          // Handle classes that finish after midnight.
          if (end <= start) {
            end.setUTCDate(end.getUTCDate() + 1);
          }

          return { ...schedule, start, end };
        } catch {
          return null;
        }
      })
      .filter(
        (item) =>
          item &&
          item.end > item.start &&
          item.start > now &&
          item.start <= cutoff &&
          item.enrollment_id
      );

    if (due.length === 0) {
      return NextResponse.json({
        success: true,
        checked: (schedules || []).length,
        created: 0,
        skipped: 0,
        results: [],
      });
    }

    const enrollmentIds = [
      ...new Set(due.map((item) => item.enrollment_id)),
    ];

    const { data: enrollments, error: enrollmentError } =
      await supabase
        .from("enrollments")
        .select("id, student_id, teacher_id, course_id, status")
        .in("id", enrollmentIds)
        .eq("status", "active");

    if (enrollmentError) throw enrollmentError;

    const activeEnrollments = enrollments || [];
    const enrollmentById = new Map(
      activeEnrollments.map((item) => [item.id, item])
    );

    const studentIds = [
      ...new Set(activeEnrollments.map((item) => item.student_id)),
    ];
    const teacherIds = [
      ...new Set(activeEnrollments.map((item) => item.teacher_id)),
    ];
    const courseIds = [
      ...new Set(activeEnrollments.map((item) => item.course_id)),
    ];

    const [studentsResult, teachersResult, coursesResult] =
      await Promise.all([
        studentIds.length
          ? supabase
              .from("students")
              .select("id, profile_id")
              .in("id", studentIds)
          : Promise.resolve({ data: [], error: null }),

        teacherIds.length
          ? supabase
              .from("teachers")
              .select("id, profile_id, status")
              .in("id", teacherIds)
          : Promise.resolve({ data: [], error: null }),

        courseIds.length
          ? supabase
              .from("courses")
              .select("id, name")
              .in("id", courseIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (studentsResult.error) throw studentsResult.error;
    if (teachersResult.error) throw teachersResult.error;
    if (coursesResult.error) throw coursesResult.error;

    const students = studentsResult.data || [];
    const teachers = teachersResult.data || [];
    const courses = coursesResult.data || [];

    const profileIds = [
      ...new Set([
        ...students.map((item) => item.profile_id),
        ...teachers.map((item) => item.profile_id),
      ].filter(Boolean)),
    ];

    const { data: profiles, error: profilesError } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const studentById = new Map(students.map((item) => [item.id, item]));
    const teacherById = new Map(teachers.map((item) => [item.id, item]));
    const courseById = new Map(courses.map((item) => [item.id, item]));
    const profileById = new Map(
      (profiles || []).map((item) => [item.id, item])
    );

    let token = null;
    const results = [];
    let created = 0;
    let skipped = 0;

    for (const schedule of due) {
      const enrollment = enrollmentById.get(schedule.enrollment_id);

      if (!enrollment) {
        skipped++;
        results.push({
          schedule_id: schedule.id,
          result: "skipped",
          reason: "No active enrollment",
        });
        continue;
      }

      const student = studentById.get(enrollment.student_id);
      const teacher = teacherById.get(enrollment.teacher_id);
      const course = courseById.get(enrollment.course_id);

      if (!student || !teacher || !course) {
        skipped++;
        results.push({
          schedule_id: schedule.id,
          result: "skipped",
          reason: "Missing student, teacher, or course",
        });
        continue;
      }

      if (teacher.status && teacher.status !== "active") {
        skipped++;
        results.push({
          schedule_id: schedule.id,
          result: "skipped",
          reason: "Teacher is not active",
        });
        continue;
      }

      const studentName =
        profileById.get(student.profile_id)?.full_name || "Student";
      const teacherName =
        profileById.get(teacher.profile_id)?.full_name || "Teacher";

      const durationMinutes = Math.round(
        (schedule.end.getTime() - schedule.start.getTime()) / 60000
      );

      // Reserve the schedule before calling Zoom.
      // The database's unique active-session index prevents concurrent duplicates.
      const { data: session, error: reserveError } = await supabase
        .from("zoom_class_sessions")
        .insert({
          schedule_id: schedule.id,
          status: "scheduled",
          scheduled_start_at: schedule.start.toISOString(),
          scheduled_end_at: schedule.end.toISOString(),
          attendance_data_complete: false,
          review_status: "pending",
        })
        .select("id")
        .single();

      if (reserveError) {
        skipped++;
        results.push({
          schedule_id: schedule.id,
          result: "skipped",
          reason: "Session already reserved or database reservation failed",
        });
        continue;
      }

      try {
        if (!token) token = await getZoomToken();

        const zoomResponse = await fetch(
          "https://api.zoom.us/v2/users/me/meetings",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              topic: `Al Shaimaa Quran Academy - ${course.name} - ${studentName}`,
              type: 2,
              start_time: schedule.start.toISOString(),
              duration: durationMinutes,
              timezone: TIME_ZONE,
              settings: {
                join_before_host: false,
                waiting_room: true,
                approval_type: 2,
              },
            }),
          }
        );

        const zoomMeeting = await zoomResponse
          .json()
          .catch(() => ({}));

        if (
          !zoomResponse.ok ||
          !zoomMeeting.id ||
          !zoomMeeting.join_url ||
          !zoomMeeting.start_url
        ) {
          await supabase
            .from("zoom_class_sessions")
            .update({
              status: "failed",
              review_status: "manual_review",
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.id);

          skipped++;
          results.push({
            schedule_id: schedule.id,
            result: "failed",
            reason: `Zoom API returned HTTP ${zoomResponse.status}`,
          });
          continue;
        }

        const { error: sessionUpdateError } = await supabase
          .from("zoom_class_sessions")
          .update({
            zoom_meeting_id: String(zoomMeeting.id),
            zoom_meeting_uuid: zoomMeeting.uuid || null,
            zoom_join_url: zoomMeeting.join_url,
            zoom_start_url: zoomMeeting.start_url,
            status: "created",
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        if (sessionUpdateError) {
          // Keep the reservation to avoid silently creating another meeting.
          throw new Error(
            "Zoom meeting created, but saving session details failed"
          );
        }

        const { error: scheduleUpdateError } = await supabase
          .from("schedule")
          .update({
            zoom_meeting_id: String(zoomMeeting.id),
            zoom_join_url: zoomMeeting.join_url,
            zoom_start_url: zoomMeeting.start_url,
          })
          .eq("id", schedule.id)
          .is("zoom_meeting_id", null);

        if (scheduleUpdateError) {
          throw new Error(
            "Zoom meeting created, but updating the schedule failed"
          );
        }

        created++;
        results.push({
          schedule_id: schedule.id,
          result: "created",
          start_at: schedule.start.toISOString(),
          duration_minutes: durationMinutes,
          teacher: teacherName,
        });
      } catch (error) {
        // On an uncertain network failure, keep the reservation active:
        // this is safer than accidentally creating a duplicate meeting.
        console.error(
          "Zoom meeting creation issue:",
          schedule.id,
          error.message
        );

        skipped++;
        results.push({
          schedule_id: schedule.id,
          result: "needs_review",
          reason: "Creation result needs verification before retrying",
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: (schedules || []).length,
      due: due.length,
      created,
      skipped,
      results,
    });
  } catch (error) {
    console.error("Zoom create-due route error:", error.message);

    return NextResponse.json(
      { error: "Could not process due Zoom meetings" },
      { status: 500 }
    );
  }
}
