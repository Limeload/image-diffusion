interface Props {
  aspect?: "square" | "landscape" | "portrait";
}

const ASPECT: Record<NonNullable<Props["aspect"]>, string> = {
  square:    "aspect-square",
  landscape: "aspect-video",
  portrait:  "aspect-[9/16]",
};

export default function SkeletonCard({ aspect = "square" }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading image"
      className={`w-full ${ASPECT[aspect]} rounded-xl overflow-hidden bg-black/[.05] dark:bg-white/[.06] animate-pulse relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.4s_infinite]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
