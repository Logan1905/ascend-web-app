/**
 * Central place for application-wide, non-secret configuration values.
 */
export const siteConfig = {
  name: "Fitness Application",
  description:
    "A private fitness and nutrition application for tracking workouts, nutrition, and progress.",
} as const;

export type SiteConfig = typeof siteConfig;
