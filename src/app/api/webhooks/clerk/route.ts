import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertUser } from "@/lib/queries";

type ClerkUserEvent = {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
};

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(secret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, username, first_name, last_name, image_url } = event.data;
    const resolvedUsername =
      username ??
      [first_name, last_name].filter(Boolean).join("").toLowerCase() ??
      `user_${id.slice(-6)}`;

    await upsertUser({ clerkId: id, username: resolvedUsername, avatarUrl: image_url });
  }

  return NextResponse.json({ received: true });
}
