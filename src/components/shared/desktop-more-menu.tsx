"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Settings,
  Users,
  Github,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";

export function DesktopMoreMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/profile");
  }

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
        <div className="border-border bg-popover absolute top-full left-0 mt-2 w-52 overflow-hidden rounded-lg border shadow-lg">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          >
            <Settings className="size-4" />
            Settings
          </Link>

          {/* Theme toggle */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-muted-foreground text-sm">Theme</span>
            <div className="border-border ml-auto flex items-center overflow-hidden rounded-full border">
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Light mode"
              >
                <Sun className="size-3.5" />
              </button>
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Dark mode"
              >
                <Moon className="size-3.5" />
              </button>
            </div>
          </div>

          <Link
            href="/friends"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          >
            <Users className="size-4" />
            Friends
          </Link>
          <a
            href="https://github.com/Logan1905/ascend-web-app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          >
            <Github className="size-4" />
            GitHub
          </a>
          {user && (
            <>
              <div className="border-border border-t" />
              <button
                onClick={handleSignOut}
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
