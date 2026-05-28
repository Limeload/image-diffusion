"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PromptHistory, { savePromptToHistory } from "./PromptHistory";
import SkeletonCard from "./SkeletonCard";
import { BLUR_DATA_URL, MAX_PROMPT_LENGTH } from "@/lib/constants";
import type { Post } from "@/types";

const MODELS  = [{ value: "sdxl-turbo", label: "SDXL-Turbo (fast ~0.8s)" }, { value: "sd15", label: "SD 1.5 (quality)" }];
const ASPECTS = [{ value: "square", label: "1:1" }, { value: "landscape", label: "16:9" }, { value: "portrait", label: "9:16" }, { value: "wide", label: "Wide" }];

export default function GenerateForm() {
  const [input,      setInput]      = useState("");
  const [model,      setModel]      = useState("sdxl-turbo");
  const [aspect,     setAspect]     = useState("square");
  const [loading,    setLoading]    = useState(false);
  const [post,       setPost]       = useState<Post | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    if (!retryAfter) return;
    const id = setInterval(() => {
      setRetryAfter(prev => (prev === null || prev <= 1) ? (clearInterval(id), null) : prev - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || retryAfter) return;
    setLoading(true); setError(null); setPost(null);

    try {
      const res  = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, aspect }),
      });
      const data = await res.json();

      if (res.status === 429) { setRetryAfter(data.retryAfter ?? 60); return; }
      if (!res.ok || !data.success) { setError(data.error ?? "Generation failed."); return; }

      savePromptToHistory(prompt);
      setPost(data.post);
      setInput("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!post) return;
    const res  = await fetch(post.image_url);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `pentagram-${post.id}.webp` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      {/* Rate-limit countdown */}
      {retryAfter !== null && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-3">
          <span>⏳</span>
          <span>Limit reached (5/min). <strong className="tabular-nums">Try again in {retryAfter}s</strong></span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{error}</div>
      )}

      {/* Result / skeleton */}
      {(loading || post) && (
        <div className="w-full">
          {loading ? <SkeletonCard /> : post ? (
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-black/[.08] dark:border-white/[.145]">
              <Image src={post.image_url} alt={post.prompt} fill placeholder="blur" blurDataURL={BLUR_DATA_URL}
                className="object-cover" sizes="(max-width: 512px) 100vw, 512px" priority />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs line-clamp-2">{post.prompt}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {post && (
        <div className="flex gap-2 flex-wrap text-sm">
          <Link href={`/post/${post.id}`} className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors">
            View post
          </Link>
          <Link href="/feed" className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors">
            Feed
          </Link>
          <button onClick={download} className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors">
            ↓ Download
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <select value={model} onChange={e => setModel(e.target.value)} disabled={loading}
          className="flex-1 p-2 text-sm rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none disabled:opacity-50">
          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={aspect} onChange={e => setAspect(e.target.value)} disabled={loading}
          className="p-2 text-sm rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none disabled:opacity-50">
          {ASPECTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input type="text" value={input} onChange={e => setInput(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
              placeholder="Describe the image you want to generate…"
              disabled={loading || !!retryAfter}
              className="w-full p-3 rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50" />
            {input.length > 0 && (
              <span className={`absolute right-2 bottom-1.5 text-[10px] tabular-nums ${input.length >= MAX_PROMPT_LENGTH ? "text-red-400" : "text-gray-400"}`}>
                {input.length}/{MAX_PROMPT_LENGTH}
              </span>
            )}
          </div>
          <button type="submit" disabled={loading || !input.trim() || !!retryAfter}
            className="min-w-[110px] px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 tabular-nums text-sm">
            {retryAfter !== null ? `Wait ${retryAfter}s` : loading ? "Generating…" : "Generate"}
          </button>
        </form>
        <PromptHistory onSelect={setInput} />
      </div>
    </div>
  );
}
