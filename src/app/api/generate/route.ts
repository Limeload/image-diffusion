import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { getServiceClient } from "@/lib/supabase";
import { getUserByClerkId, insertPost, updatePostEmbedding } from "@/lib/queries";
import { checkPromptSafety } from "@/lib/safety";
import { generateRatelimit } from "@/lib/ratelimit";

const VALID_MODELS  = ["sdxl-turbo", "sd15"] as const;
const VALID_ASPECTS = ["square", "landscape", "portrait", "wide"] as const;

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ success: false, error: "User not found — try signing out and back in" }, { status: 404 });

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const { success, reset } = await generateRatelimit.limit(user.id);
  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter), "X-RateLimit-Reset": String(reset) } }
    );
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  const body = await request.json();
  const prompt = (body.prompt ?? "").trim();
  const model  = VALID_MODELS.includes(body.model)  ? body.model  : "sdxl-turbo";
  const aspect = VALID_ASPECTS.includes(body.aspect) ? body.aspect : "square";

  if (!prompt) return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });

  // ── Safety ──────────────────────────────────────────────────────────────────
  const safety = await checkPromptSafety(prompt);
  if (!safety.safe) return NextResponse.json({ success: false, error: safety.reason ?? "Prompt not allowed." }, { status: 422 });

  // ── Modal ───────────────────────────────────────────────────────────────────
  const modalController = new AbortController();
  const modalTimeout = setTimeout(() => modalController.abort(), 60_000);
  let modalRes: Response;
  try {
    modalRes = await fetch(process.env.MODAL_ENDPOINT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model, aspect }),
      signal: modalController.signal,
    });
  } catch (err) {
    clearTimeout(modalTimeout);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { success: false, error: isTimeout ? "Image generation timed out" : "Image generation failed" },
      { status: 504 }
    );
  } finally {
    clearTimeout(modalTimeout);
  }

  if (!modalRes.ok) {
    const err = await modalRes.json().catch(() => ({}));
    return NextResponse.json(
      { success: false, error: (err as { error?: string }).error ?? "Image generation failed" },
      { status: modalRes.status }
    );
  }

  const { image: base64 } = await modalRes.json();

  // ── WebP conversion via sharp ────────────────────────────────────────────────
  const pngBuffer  = Buffer.from(base64, "base64");
  const webpBuffer = await sharp(pngBuffer).webp({ quality: 88 }).toBuffer();

  // ── Upload to Supabase Storage ───────────────────────────────────────────────
  const sb = getServiceClient();
  const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await sb.storage
    .from(process.env.STORAGE_BUCKET!)
    .upload(filename, webpBuffer, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
  }

  const { data: urlData } = sb.storage.from(process.env.STORAGE_BUCKET!).getPublicUrl(filename);

  // ── Persist post ─────────────────────────────────────────────────────────────
  const post = await insertPost({ userId: user.id, imageUrl: urlData.publicUrl, prompt });

  // ── Embed prompt async (non-blocking) ────────────────────────────────────────
  generateEmbedding(prompt).then(embedding => {
    if (embedding) updatePostEmbedding(post.id, embedding).catch(console.error);
  });

  return NextResponse.json({ success: true, post });
}
