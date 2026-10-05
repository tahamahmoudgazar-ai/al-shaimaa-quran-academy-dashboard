import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function createSupabaseServerClient(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

export async function requireAuth(request) {
  const { supabase } = createSupabaseServerClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      profile: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      user,
      profile: null,
      response: NextResponse.json(
        { error: "Profile not found" },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    profile,
    response: null,
  };
}

export async function requireRole(request, allowedRoles = []) {
  const auth = await requireAuth(request);

  if (auth.response) {
    return auth;
  }

  if (!allowedRoles.includes(auth.profile.role)) {
    return {
      ...auth,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

export async function requireAdmin(request) {
  return requireRole(request, ["admin"]);
}

export async function requireTeacher(request) {
  return requireRole(request, ["teacher"]);
}

export async function requireStudent(request) {
  return requireRole(request, ["student"]);
}
