"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Dumbbell,
  User,
  Settings,
  Users,
  Github,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";

export function MobileTopBar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when tapping outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="border-border bg-background sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b px-4 md:hidden">
      {/* Left: More menu (dropdown) */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <LayoutGrid className="size-5" />
        </Button>

        {menuOpen && (
          <div className="border-border bg-popover absolute top-full left-0 mt-2 w-52 overflow-hidden rounded-lg border shadow-lg">
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            >
              <Settings className="size-4" />
              Settings
            </Link>
            {/* Theme toggle */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground text-sm">Theme</span>
              <div className="border-border ml-auto flex items-center overflow-hidden rounded-full border">
                <button
                  onClick={toggleTheme}
                  className={`flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Sun className="size-3.5" />
                </button>
                <button
                  onClick={toggleTheme}
                  className={`flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Moon className="size-3.5" />
                </button>
              </div>
            </div>
            <Link
              href="/friends"
              onClick={() => setMenuOpen(false)}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            >
              <Users className="size-4" />
              Friends
            </Link>
            <a
              href="https://github.com/Logan1905/ascend-web-app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            >
              <Github className="size-4" />
              GitHub
            </a>
            {user && (
              <>
                <div className="border-border border-t" />
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                    router.push("/profile");
                  }}
                  className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Dumbbell className="text-primary size-5" />
        <span className="text-lg font-bold tracking-tight">
          {siteConfig.name}
        </span>
      </Link>

      {/* Right: Notification + Profile */}
      <div className="flex items-center gap-1">
        <NotificationDropdown />
        <Link href="/profile">
          <Button variant="ghost" size="icon" aria-label="Profile">
            <User className="size-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
