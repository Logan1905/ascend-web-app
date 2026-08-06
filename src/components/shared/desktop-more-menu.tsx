"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Settings, Palette, Users, Github } from "lucide-react";

import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Customization", href: "/settings#customization", icon: Palette },
  { label: "Friends", href: "/friends", icon: Users },
  {
    label: "GitHub",
    href: "https://github.com/Logan1905/ascend-web-app",
    icon: Github,
    external: true,
  },
];

export function DesktopMoreMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="More options"
        onClick={() => setOpen(!open)}
      >
        <LayoutGrid className="size-5" />
      </Button>

      {open && (
        <div className="border-border bg-popover absolute top-full left-0 mt-2 w-48 overflow-hidden rounded-lg border shadow-lg">
          {menuItems.map((item) => {
            const Icon = item.icon;
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                >
                  <Icon className="size-4" />
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
