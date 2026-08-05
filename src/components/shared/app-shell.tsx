"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/shared/header";
import { MobileTopBar } from "@/components/shared/mobile-top-bar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isRecovery, loading } = useAuth();

  // While auth is loading, don't show navigation yet to prevent flash
  if (loading) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  // When in recovery mode, hide all navigation
  if (isRecovery) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  return (
    <>
      <Header />
      <MobileTopBar />
      <main className="flex flex-1 flex-col pb-24 md:pb-0">{children}</main>
      <MobileBottomNav />
    </>
  );
}
