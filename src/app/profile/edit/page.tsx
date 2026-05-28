import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/queries";
import ProfileEditForm from "./ProfileEditForm";

export default async function EditProfilePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit profile</h1>
      <ProfileEditForm currentUsername={user.username} />
    </div>
  );
}
