/**
 * Central place for application-wide, non-secret configuration values.
 */
export const siteConfig = {
  name: "Ascend",
  description:
    "A private fitness and nutrition application for tracking workouts, nutrition, and progress.",
} as const;

export type SiteConfig = typeof siteConfig;
