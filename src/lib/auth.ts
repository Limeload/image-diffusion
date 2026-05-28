import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/queries";
import type { User } from "@/types";

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "User not found — try signing out and back in" }, { status: 404 }) };
  }
  return { user, error: null };
}
