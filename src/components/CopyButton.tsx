"use client";

import { useState } from "react";

interface Props {
  text: string;
  label?: string;
  successLabel?: string;
  className?: string;
}

export default function CopyButton({ text, label = "Copy", successLabel = "Copied!", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`transition-colors ${className}`}
      aria-label={copied ? successLabel : label}
    >
      {copied ? successLabel : label}
    </button>
  );
}
