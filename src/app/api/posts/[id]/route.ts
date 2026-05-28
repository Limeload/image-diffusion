import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

interface Params { params: Promise<{ id: string }> }

async function resolveOwner(postId: string, userId: string) {
  const sb = getServiceClient();
  const { data } = await sb.from("posts").select("user_id").eq("id", postId).single();
  return data?.user_id === userId ? userId : null;
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const owner = await resolveOwner(id, user.id);
  if (!owner) return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });

  const sb = getServiceClient();
  await sb.from("posts").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const owner = await resolveOwner(id, user.id);
  if (!owner) return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });

  const { is_public } = await req.json();
  const sb = getServiceClient();
  const { data, error: dbError } = await sb
    .from("posts")
    .update({ is_public })
    .eq("id", id)
    .select("id, is_public")
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}
