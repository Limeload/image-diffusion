export default function SkeletonCard() {
  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/[.05] dark:bg-white/[.06] animate-pulse relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.4s_infinite]" />
    </div>
  );
}
