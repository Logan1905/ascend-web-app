"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { siteConfig } from "@/config/site";
import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/shared/mobile-nav";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Dumbbell className="text-primary size-5" />
          <span className="text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Toggle */}
        <div className="flex flex-1 justify-end md:hidden">
          <MobileNav pathname={pathname} />
        </div>
      </div>
    </header>
  );
}
