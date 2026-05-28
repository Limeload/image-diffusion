import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS — only used server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { text, userId } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 1. Generate image via Modal
    const modalRes = await fetch(process.env.MODAL_ENDPOINT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });

    if (!modalRes.ok) {
      const err = await modalRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.error ?? "Image generation failed" },
        { status: modalRes.status }
      );
    }

    const { image: base64 } = await modalRes.json();

    // 2. Decode base64 PNG and upload to Supabase Storage
    const buffer = Buffer.from(base64, "base64");
    // Namespace by userId so owner-delete RLS policy works
    const folder = userId ?? "anonymous";
    const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET!)
      .upload(filename, buffer, { contentType: "image/png", upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(process.env.STORAGE_BUCKET!)
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;

    // 3. Persist to posts table when a userId is present.
    //    TODO: replace `userId` with the Clerk session user ID once auth is integrated.
    let postId: string | null = null;
    if (userId) {
      const { data: post, error: insertError } = await supabase
        .from("posts")
        .insert({ user_id: userId, image_url: imageUrl, prompt: text })
        .select("id")
        .single();

      if (insertError) throw insertError;
      postId = post.id;
    }

    return NextResponse.json({ success: true, imageUrl, postId });
  } catch (error) {
    console.error("generate-image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
