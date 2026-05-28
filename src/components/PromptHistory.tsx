"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "prompt_history";
const MAX_HISTORY = 10;

export function savePromptToHistory(prompt: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const updated = [prompt, ...existing.filter(p => p !== prompt)].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

interface Props {
  onSelect: (prompt: string) => void;
}

export default function PromptHistory({ onSelect }: Props) {
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {}
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setHistory([]);
    setOpen(false);
  }

  if (history.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1"
      >
        Recent prompts
        <span className="inline-block transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 w-80 rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-neutral-900 shadow-lg z-10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/[.06] dark:border-white/[.08]">
            <span className="text-xs text-gray-400 font-medium">Recent</span>
            <button type="button" onClick={clearAll} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
              Clear all
            </button>
          </div>
          <ul className="max-h-44 overflow-y-auto">
            {history.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06] truncate"
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
