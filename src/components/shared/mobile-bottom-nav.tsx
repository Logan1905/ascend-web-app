"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-3 bottom-4 left-3 z-50 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-full bg-zinc-900 px-2 py-2 shadow-lg dark:bg-zinc-800">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                isActive
                  ? "gap-2 bg-zinc-700 px-4 py-2.5 text-white dark:bg-zinc-600"
                  : "p-2.5 text-zinc-400 hover:text-zinc-200",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {isActive && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
