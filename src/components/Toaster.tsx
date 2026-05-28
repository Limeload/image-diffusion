"use client";

import { useToasts } from "@/hooks/useToast";

const styles: Record<string, string> = {
  success: "bg-green-600 text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-gray-800 dark:bg-gray-700 text-white",
};

export default function Toaster() {
  const toasts = useToasts();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : undefined}
          className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium max-w-xs toast-enter ${styles[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
