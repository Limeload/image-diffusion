import SkeletonCard from "@/components/SkeletonCard";

export default function TrendingLoading() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="h-8 w-32 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse mb-2" />
      <div className="h-4 w-56 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse mb-8" />
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="break-inside-avoid">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}
