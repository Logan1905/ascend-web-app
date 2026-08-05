"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/shared/header";
import { MobileTopBar } from "@/components/shared/mobile-top-bar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isRecovery } = useAuth();

  // When in recovery mode, hide all navigation so the user
  // stays locked on the password reset screen.
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
