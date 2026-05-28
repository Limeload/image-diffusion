import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-gray-700 select-none">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/feed"
        className="mt-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
      >
        Back to feed
      </Link>
    </div>
  );
}
