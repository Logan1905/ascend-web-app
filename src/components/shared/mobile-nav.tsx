"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Dumbbell } from "lucide-react";

import { mainNavItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  pathname: string;
}

export function MobileNav({ pathname }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Overlay + Slide-in panel */}
      {open && (
        <div className="fixed inset-0 top-14 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="bg-background/80 absolute inset-0 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <nav className="border-border bg-background relative z-10 flex h-full w-full flex-col border-t px-4 py-6 shadow-lg sm:max-w-sm">
            {/* Brand in panel */}
            <div className="mb-6 flex items-center gap-2 px-2">
              <Dumbbell className="text-primary size-5" />
              <span className="text-lg font-bold tracking-tight">
                {siteConfig.name}
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
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
