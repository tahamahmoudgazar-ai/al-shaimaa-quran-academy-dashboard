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
      const { data: teacher, error } = await db
        .from("teachers")
        .select(
          "id, profile_id, specialization, bio, hourly_rate, status, created_at"
        )
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      const { data: profile, error: profileError } =
        await db
          .from("profiles")
          .select("id, full_name, email, phone")
          .eq("id", teacher.profile_id)
          .single();

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 404 }
        );
      }

      return NextResponse.json({
        teacher: {
          id: teacher.id,
          full_name: profile?.full_name || "Teacher",
          email: profile?.email || "",
          phone: profile?.phone || "",
          specialization: teacher.specialization || "",
          bio: teacher.bio || "",
          hourly_rate: teacher.hourly_rate,
          status: teacher.status || "",
          created_at: teacher.created_at
        }
      });
    }

    const { data: teachers, error } = await db
      .from("teachers")
      .select(
        "id, profile_id, specialization, bio, hourly_rate, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const profileIds = (teachers || [])
      .map((t) => t.profile_id)
      .filter(Boolean);

    let profiles = [];

    if (profileIds.length > 0) {
      const { data } = await db
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", profileIds);

      profiles = data || [];
    }

    const profileMap = Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        profile
      ])
    );

    const result = (teachers || []).map((teacher) => {
      const profile =
        profileMap[teacher.profile_id];

      return {
        id: teacher.id,
        full_name:
          profile?.full_name || "Teacher",
        email:
          profile?.email || "",
        phone:
          profile?.phone || "",
        specialization:
          teacher.specialization || "",
        bio:
          teacher.bio || "",
        hourly_rate:
          teacher.hourly_rate,
        status:
          teacher.status || "",
        created_at:
          teacher.created_at
      };
    });

    return NextResponse.json({
      teachers: result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to load teachers."
      },
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
      fullName,
      email,
      phone,
      specialization,
      bio,
      hourlyRate,
      status
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        {
          error:
            "Name and email are required"
        },
        { status: 400 }
      );
    }

    const db = supabase();

    const { data: authData, error: authError } =
      await db.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone || null
        }
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } =
      await db
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          email,
          phone: phone || null,
          role: "Teacher"
        });

    if (profileError) {
      await db.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const { error: teacherError } =
      await db
        .from("teachers")
        .insert({
          profile_id: userId,
          specialization:
            specialization || null,
          bio: bio || null,
          hourly_rate:
            hourlyRate === "" ||
            hourlyRate == null
              ? null
              : Number(hourlyRate),
          status: status || "active"
        });

    if (teacherError) {
      await db
        .from("profiles")
        .delete()
        .eq("id", userId);

      await db.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: teacherError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teacherId: userId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message
      },
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
      fullName,
      email,
      phone,
      specialization,
      bio,
      hourlyRate,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Teacher ID is required"
        },
        { status: 400 }
      );
    }

    if (!fullName || !email) {
      return NextResponse.json(
        {
          error:
            "Name and email are required"
        },
        { status: 400 }
      );
    }

    const db = supabase();

    const { data: teacher, error: findError } =
      await db
        .from("teachers")
        .select("id, profile_id")
        .eq("id", id)
        .single();

    if (findError) {
      return NextResponse.json(
        { error: findError.message },
        { status: 404 }
      );
    }

    const { error: profileError } =
      await db
        .from("profiles")
        .update({
          full_name: fullName,
          email,
          phone: phone || null
        })
        .eq("id", teacher.profile_id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const { error: teacherError } =
      await db
        .from("teachers")
        .update({
          specialization:
            specialization || null,
          bio: bio || null,
          hourly_rate:
            hourlyRate === "" ||
            hourlyRate == null
              ? null
              : Number(hourlyRate),
          status: status || "active"
        })
        .eq("id", id);

    if (teacherError) {
      return NextResponse.json(
        { error: teacherError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Teacher updated successfully."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to update teacher."
      },
      { status: 500 }
    );
  }
}
