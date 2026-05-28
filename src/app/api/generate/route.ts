import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { getUserByClerkId, insertPost } from "@/lib/queries";
import { checkPromptSafety } from "@/lib/safety";
import { generateRatelimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found — try signing out and back in" },
      { status: 404 }
    );
  }

  // ── Rate limit (5 req / 60 s per user) ───────────────────────────────────
  const { success, reset } = await generateRatelimit.limit(user.id);
  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  const { prompt } = await request.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
  }

  // ── Safety (blocklist + optional OpenAI Moderation) ───────────────────────
  const safety = await checkPromptSafety(prompt.trim());
  if (!safety.safe) {
    return NextResponse.json(
      { success: false, error: safety.reason ?? "Prompt not allowed." },
      { status: 422 }
    );
  }

  // ── Generate via Modal ────────────────────────────────────────────────────
  const modalRes = await fetch(process.env.MODAL_ENDPOINT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!modalRes.ok) {
    const err = await modalRes.json().catch(() => ({}));
    return NextResponse.json(
      { success: false, error: (err as { error?: string }).error ?? "Image generation failed" },
      { status: modalRes.status }
    );
  }

  const { image: base64 } = await modalRes.json();

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const sb = getServiceClient();
  const buffer = Buffer.from(base64, "base64");
  const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.png`;

  const { error: uploadError } = await sb.storage
    .from(process.env.STORAGE_BUCKET!)
    .upload(filename, buffer, { contentType: "image/png", upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
  }

  const { data: urlData } = sb.storage
    .from(process.env.STORAGE_BUCKET!)
    .getPublicUrl(filename);

  // ── Persist post ──────────────────────────────────────────────────────────
  const post = await insertPost({ userId: user.id, imageUrl: urlData.publicUrl, prompt });

  return NextResponse.json({ success: true, post });
}
