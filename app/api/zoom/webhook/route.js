
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

    if (!secretToken) {
      console.error("Zoom webhook secret token is not configured.");
      return NextResponse.json(
        { error: "Webhook is not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();

    let event;

    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Zoom endpoint URL validation
    if (event.event === "endpoint.url_validation") {
      const plainToken = event.payload?.plainToken;

      if (!plainToken) {
        return NextResponse.json(
          { error: "Missing plainToken" },
          { status: 400 }
        );
      }

      const encryptedToken = crypto
        .createHmac("sha256", secretToken)
        .update(plainToken)
        .digest("hex");

      return NextResponse.json({
        plainToken,
        encryptedToken,
      });
    }

    // Verify Zoom webhook signature and timestamp
    const timestamp = request.headers.get("x-zm-request-timestamp");
    const signature = request.headers.get("x-zm-signature");

    if (!timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing Zoom signature headers" },
        { status: 401 }
      );
    }

    const requestTimestamp = Number(timestamp);

    if (
      !Number.isFinite(requestTimestamp) ||
      Math.abs(Date.now() - requestTimestamp * 1000) > 5 * 60 * 1000
    ) {
      return NextResponse.json(
        { error: "Invalid or expired timestamp" },
        { status: 401 }
      );
    }

    const message = `v0:${timestamp}:${body}`;

    const expectedSignature =
      "v0=" +
      crypto
        .createHmac("sha256", secretToken)
        .update(message)
        .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid Zoom signature" },
        { status: 401 }
      );
    }

    // Configure Supabase only after verifying the request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server configuration is incomplete.");
      return NextResponse.json(
        { error: "Database is not configured" },
        { status: 500 }
      );
    }

    if (typeof event.event !== "string" || !event.event) {
      return NextResponse.json(
        { error: "Missing event type" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Prefer Zoom's event ID; otherwise use a deterministic body hash.
    const eventId =
      typeof event.event_id === "string" && event.event_id
        ? event.event_id
        : crypto.createHash("sha256").update(body).digest("hex");

    const meetingId = event.payload?.object?.id;

    const { error: insertError } = await supabase
      .from("zoom_webhook_events")
      .upsert(
        {
          event_id: eventId,
          event_type: event.event,
          zoom_meeting_id:
            meetingId !== undefined && meetingId !== null
              ? String(meetingId)
              : null,
          payload: event,
          processing_status: "pending",
        },
        {
          onConflict: "event_id",
          ignoreDuplicates: true,
        }
      );

    if (insertError) {
      console.error(
        "Failed to store verified Zoom event:",
        insertError.message
      );

      // A non-2xx response allows Zoom to retry delivery.
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Zoom webhook processing failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
