import SkeletonCard from "@/components/SkeletonCard";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-black/[.05] dark:bg-white/[.06] animate-pulse shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
          <div className="h-4 w-48 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
        </div>
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="break-inside-avoid">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}
