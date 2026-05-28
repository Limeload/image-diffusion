"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime, formatDate } from "@/lib/format";

interface Props {
  iso: string;
  className?: string;
}

export default function RelativeTime({ iso, className }: Props) {
  const [label, setLabel] = useState(() => formatRelativeTime(iso));

  useEffect(() => {
    const id = setInterval(() => setLabel(formatRelativeTime(iso)), 60_000);
    return () => clearInterval(id);
  }, [iso]);

  return (
    <time dateTime={iso} title={formatDate(iso)} className={className}>
      {label}
    </time>
  );
}
