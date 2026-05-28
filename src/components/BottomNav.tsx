"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/feed",     label: "Feed",     icon: "⊞" },
  { href: "/generate", label: "Generate", icon: "✦" },
  { href: "/search",   label: "Search",   icon: "⌕" },
  { href: "/trending", label: "Trending", icon: "↑" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 sm:hidden bg-white dark:bg-neutral-900 border-t border-black/[.08] dark:border-white/[.08] z-40 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium w-14 transition-colors ${active ? "text-foreground" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? "scale-110" : "scale-100"}`}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
