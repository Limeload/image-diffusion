import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { username } = await request.json();
  const clean = username?.trim();
  if (!clean || clean.length < 3 || clean.length > 30 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters and contain only letters, numbers, or underscores." },
      { status: 400 }
    );
  }

  const sb = getServiceClient();
  const { data: existing } = await sb.from("users").select("id").eq("username", clean).neq("id", user.id).single();
  if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 409 });

  const { data, error: dbError } = await sb
    .from("users")
    .update({ username: clean })
    .eq("id", user.id)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
