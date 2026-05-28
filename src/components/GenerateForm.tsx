"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PromptHistory, { savePromptToHistory } from "./PromptHistory";
import SkeletonCard from "./SkeletonCard";
import type { Post } from "@/types";

export default function GenerateForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Count down the rate-limit timer every second
  useEffect(() => {
    if (!retryAfter) return;
    const id = setInterval(() => {
      setRetryAfter(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || retryAfter) return;

    setLoading(true);
    setError(null);
    setPost(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (res.status === 429) {
        const wait = data.retryAfter ?? 60;
        setRetryAfter(wait);
        setError(null); // countdown banner replaces generic error
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }

      savePromptToHistory(prompt);
      setPost(data.post);
      setInput("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const buttonDisabled = loading || !input.trim() || !!retryAfter;

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      {/* Rate-limit countdown */}
      {retryAfter !== null && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-3">
          <span className="text-lg">⏳</span>
          <span>
            You&apos;ve hit the limit (5 generations / min).{" "}
            <span className="font-semibold tabular-nums">Try again in {retryAfter}s</span>
          </span>
        </div>
      )}

      {/* Generic error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Result / skeleton */}
      {(loading || post) && (
        <div className="w-full">
          {loading ? (
            <SkeletonCard />
          ) : post ? (
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-black/[.08] dark:border-white/[.145]">
              <Image
                src={post.image_url}
                alt={post.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
                priority
              />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs line-clamp-2">{post.prompt}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {post && (
        <div className="flex gap-3 text-sm">
          <Link
            href={`/post/${post.id}`}
            className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
          >
            View post
          </Link>
          <Link
            href="/feed"
            className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
          >
            See feed
          </Link>
        </div>
      )}

      {/* Input */}
      <div className="flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe the image you want to generate…"
            disabled={loading || !!retryAfter}
            className="flex-1 p-3 rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={buttonDisabled}
            className="min-w-[110px] px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 tabular-nums text-sm"
          >
            {retryAfter !== null
              ? `Wait ${retryAfter}s`
              : loading
              ? "Generating…"
              : "Generate"}
          </button>
        </form>
        <PromptHistory onSelect={setInput} />
      </div>
    </div>
  );
}
