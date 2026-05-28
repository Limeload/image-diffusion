import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, searchPosts, semanticSearchPosts } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q       = searchParams.get("q")?.trim() ?? "";
  const mode    = searchParams.get("mode") ?? "text"; // "text" | "semantic"

  if (!q) return NextResponse.json([]);

  const { userId: clerkId } = await auth();
  const viewer = clerkId ? await getUserByClerkId(clerkId) : null;

  if (mode === "semantic") {
    // Generate embedding for the query then search by vector
    const embedRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ text: q }),
    }).catch(() => null);

    if (embedRes?.ok) {
      const { embedding } = await embedRes.json();
      if (embedding) {
        const posts = await semanticSearchPosts(embedding, viewer?.id ?? null);
        return NextResponse.json(posts);
      }
    }
  }

  const posts = await searchPosts(q, viewer?.id ?? null);
  return NextResponse.json(posts, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
