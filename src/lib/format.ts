export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s  = Math.floor(diff / 1000);
  const m  = Math.floor(s  / 60);
  const h  = Math.floor(m  / 60);
  const d  = Math.floor(h  / 24);
  const w  = Math.floor(d  / 7);
  const mo = Math.floor(d  / 30);
  const y  = Math.floor(d  / 365);

  if (s  <  60)  return "just now";
  if (m  <  60)  return `${m}m ago`;
  if (h  <  24)  return `${h}h ago`;
  if (d  <   7)  return `${d}d ago`;
  if (w  <   5)  return `${w}w ago`;
  if (mo < 12)   return `${mo}mo ago`;
  return `${y}y ago`;
}
