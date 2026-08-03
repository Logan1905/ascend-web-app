import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

/**
 * Main navigation items used in the header and bottom tab bar.
 */
export const mainNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Workouts", href: "/workouts", icon: Dumbbell },
  { label: "Nutrition", href: "/nutrition", icon: UtensilsCrossed },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Journal", href: "/journal", icon: BookOpen },
] as const satisfies readonly NavItem[];

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
