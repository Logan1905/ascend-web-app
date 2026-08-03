/**
 * Main navigation items used in the header.
 * Links are defined here so they can be reused across desktop and mobile nav.
 */
export const mainNavItems = [
  { label: "Dashboard", href: "/" },
  { label: "Workouts", href: "/workouts" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Progress", href: "/progress" },
  { label: "Journal", href: "/journal" },
] as const;

export type NavItem = (typeof mainNavItems)[number];
