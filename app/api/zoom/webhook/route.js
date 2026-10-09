
import { NextResponse } from "next/server";
import crypto from "crypto";

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

    // Zoom URL validation challenge
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

    // Verify the authenticity of Zoom webhook notifications
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

    // Acknowledge verified events.
    // Event processing and attendance updates will be added next.
    console.log("Verified Zoom event:", event.event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Zoom webhook processing failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
