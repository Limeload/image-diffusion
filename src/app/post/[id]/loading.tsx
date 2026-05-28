export default function PostLoading() {
  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="h-8 w-32 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
      <div className="aspect-square w-full rounded-xl bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
      </div>
    </div>
  );
}
