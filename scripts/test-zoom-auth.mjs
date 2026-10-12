import { readFileSync } from "node:fs";

const text = readFileSync(".env.local", "utf8");

function env(name) {
  const line = text.split(/\r?\n/).find((s) => s.trim().startsWith(name + "="));
  if (!line) return "";
  return line.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
}

const account = env("ZOOM_ACCOUNT_ID");
const client = env("ZOOM_CLIENT_ID");
const secret = env("ZOOM_CLIENT_SECRET");

if (!account || !client || !secret) {
  console.log("إعدادات Zoom ناقصة.");
  process.exit(1);
}

try {
  const auth = Buffer.from(client + ":" + secret).toString("base64");
  const response = await fetch(
    "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + encodeURIComponent(account),
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (response.ok && data.access_token) {
    console.log("نجح الاتصال بـ Zoom OAuth.");
  } else {
    console.log("فشل الاتصال. HTTP " + response.status);
    console.log("راجع إعدادات وصلاحيات تطبيق Zoom.");
  }
} catch {
  console.log("تعذر الاتصال. تحقق من الإنترنت.");
}
