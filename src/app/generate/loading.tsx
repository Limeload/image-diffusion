export default function GenerateLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <div className="h-8 w-40 rounded bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
      <div className="w-full max-w-lg flex flex-col gap-3">
        <div className="h-10 rounded-lg bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
        <div className="flex gap-2">
          <div className="flex-1 h-12 rounded-lg bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
          <div className="w-28 h-12 rounded-lg bg-black/[.05] dark:bg-white/[.06] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
