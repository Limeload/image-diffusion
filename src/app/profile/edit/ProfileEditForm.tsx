"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToast } from "@/hooks/useToast";

export default function ProfileEditForm({ currentUsername }: { currentUsername: string }) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error ?? "Update failed", "error"); return; }
      addToast("Profile updated!", "success");
      router.push(`/profile/${data.username}`);
      router.refresh();
    } catch {
      addToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          required
          className="p-3 rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
        <p className="text-xs text-gray-400">3–30 characters, letters/numbers/underscores only.</p>
      </div>
      <button type="submit" disabled={saving || username === currentUsername}
        className="px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
