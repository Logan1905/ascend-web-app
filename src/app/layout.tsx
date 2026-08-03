import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/shared/header";
import { MobileTopBar } from "@/components/shared/mobile-top-bar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Desktop header */}
        <Header />
        {/* Mobile top bar (burger + logo + notification) */}
        <MobileTopBar />
        {/* Page content — add bottom padding on mobile for the bottom nav */}
        <main className="flex flex-1 flex-col pb-24 md:pb-0">{children}</main>
        {/* Mobile bottom tab bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
