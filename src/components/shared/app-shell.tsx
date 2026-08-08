"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/shared/header";
import { MobileTopBar } from "@/components/shared/mobile-top-bar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { DateBar } from "@/components/shared/date-bar";
import { mainNavItems } from "@/config/navigation";

/** The five main tabs share the global date strip. */
const DATE_BAR_ROUTES: readonly string[] = mainNavItems.map(
  (item) => item.href,
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isRecovery, loading, user } = useAuth();
  const pathname = usePathname();

  // While auth is loading, don't show navigation yet to prevent flash
  if (loading) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  // When in recovery mode, hide all navigation
  if (isRecovery) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  // Only signed-in users on a main tab get the date strip.
  const showDateBar = !!user && DATE_BAR_ROUTES.includes(pathname);

  return (
    <>
      <Header />
      <MobileTopBar />
      {showDateBar && <DateBar />}
      <main className="flex flex-1 flex-col pb-24 md:pb-0">{children}</main>
      <MobileBottomNav />
    </>
  );
}
