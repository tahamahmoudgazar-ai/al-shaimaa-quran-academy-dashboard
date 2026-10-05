import { NextResponse } from "next/server";
import { requireTeacher } from "../../../../lib/auth";
export async function GET(request) {
  const auth = await requireTeacher(request);

  if (auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    profile: auth.profile,
  });
}
