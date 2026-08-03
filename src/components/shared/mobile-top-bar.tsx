"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, Dumbbell } from "lucide-react";

import { mainNavItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MobileTopBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="border-border bg-background sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b px-4 md:hidden">
        {/* Left: Burger menu */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        {/* Center: Logo placeholder */}
        <Link href="/" className="flex items-center gap-2">
          <Dumbbell className="text-primary size-5" />
          <span className="text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/* Right: Notification icon */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
      </header>

      {/* Slide-in menu panel */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="bg-background/80 absolute inset-0 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <nav className="border-border bg-background relative z-10 flex h-full w-full flex-col border-t px-4 py-6 shadow-lg sm:max-w-sm">
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
