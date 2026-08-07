/**
 * Domain types for the user fitness profile and morning weight log.
 *
 * These are the camelCase shapes the UI works with. The mapping to/from the
 * snake_case database rows lives in `src/lib/supabase/profile.ts`.
 *
 * Weights are ALWAYS stored and passed around in pounds. Conversion to
 * kilograms happens at display time only, so switching the lbs/kg toggle never
 * changes what is saved.
 */

export type WeightUnit = "lbs" | "kg";

export type FitnessGoal =
  "build_muscle" | "lose_weight" | "maintain_weight" | "gain_weight" | "other";

export type WorkoutFrequency =
  "1-2" | "3-4" | "5-6" | "everyday" | "varies" | "never";

/** How the progress charts and calendar should be coloured. */
export type GraphMode = "gain" | "loss" | "neutral";

export interface UserProfile {
  userId: string;
  /** Latest known weight, in pounds. */
  currentWeight: number;
  /** Weight recorded during onboarding, in pounds. */
  startingWeight: number;
  /** Target weight in pounds. Null for maintain/other goals. */
  goalWeight: number | null;
  /** The unit the user prefers to see. */
  weightUnit: WeightUnit;
  goal: FitnessGoal;
  /** Free-text goal, only set when `goal` is "other". */
  goalCustom: string | null;
  workoutFrequency: WorkoutFrequency;
  onboarded: boolean;
}

/** The payload used when saving onboarding answers. */
export interface UserProfileDraft {
  currentWeight: number;
  goalWeight: number | null;
  weightUnit: WeightUnit;
  goal: FitnessGoal;
  goalCustom: string | null;
  workoutFrequency: WorkoutFrequency;
}

/** A single logged morning weight. */
export interface WeightEntry {
  id: string;
  /** Weight in pounds. */
  weightLbs: number;
  /** ISO date string, e.g. "2026-08-06". */
  loggedOn: string;
}

// --- Option lists for the onboarding button questions ---

export const GOAL_OPTIONS: ReadonlyArray<{
  value: FitnessGoal;
  label: string;
}> = [
  { value: "build_muscle", label: "Build muscle" },
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "other", label: "Other" },
];

export const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: WorkoutFrequency;
  label: string;
}> = [
  { value: "1-2", label: "1-2 days/week" },
  { value: "3-4", label: "3-4 days/week" },
  { value: "5-6", label: "5-6 days/week" },
  { value: "everyday", label: "Every day" },
  { value: "varies", label: "It varies" },
  { value: "never", label: "Never" },
];

// --- Helpers ---

/** Goals that require a target weight (and therefore a goal progress bar). */
export function goalNeedsTargetWeight(goal: FitnessGoal | null): boolean {
  return (
    goal === "build_muscle" || goal === "lose_weight" || goal === "gain_weight"
  );
}

/**
 * Decides how progress should be visualised:
 *  - "gain"    upward trend is good (build muscle / gain weight)
 *  - "loss"    downward trend is good (lose weight)
 *  - "neutral" no good/bad colouring, just show the trend (maintain / other)
 */
export function getGraphMode(goal: FitnessGoal): GraphMode {
  if (goal === "build_muscle" || goal === "gain_weight") return "gain";
  if (goal === "lose_weight") return "loss";
  return "neutral";
}

/** Human readable label for a goal, falling back to the custom text. */
export function getGoalLabel(
  goal: FitnessGoal,
  goalCustom?: string | null,
): string {
  if (goal === "other") return goalCustom?.trim() || "Other";
  return GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? "Other";
}

/** Chart heading that matches the goal. */
export function getGraphTitle(mode: GraphMode): string {
  if (mode === "gain") return "Weight Gain Progress";
  if (mode === "loss") return "Weight Loss Progress";
  return "Weight Trend";
}

const LBS_PER_KG = 2.20462;

/** Converts a stored pound value into the unit the user is viewing. */
export function fromLbs(lbs: number, unit: WeightUnit): number {
  const value = unit === "kg" ? lbs / LBS_PER_KG : lbs;
  return Math.round(value * 10) / 10;
}

/** Converts a user-entered value into pounds for storage. */
export function toLbs(value: number, unit: WeightUnit): number {
  const lbs = unit === "kg" ? value * LBS_PER_KG : value;
  return Math.round(lbs * 100) / 100;
}
