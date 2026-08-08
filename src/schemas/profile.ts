import { z } from "zod";

import { goalNeedsTargetWeight, type FitnessGoal } from "@/types/profile";

/**
 * Validation schemas for the fitness profile. These mirror the CHECK
 * constraints in `supabase/migrations/0003_user_profiles.sql` so invalid data
 * is caught before it is sent.
 */

export const weightUnitSchema = z.enum(["lbs", "kg"]);

export const fitnessGoalSchema = z.enum([
  "build_muscle",
  "lose_weight",
  "maintain_weight",
  "gain_weight",
  "other",
]);

export const workoutFrequencySchema = z.enum([
  "1-2",
  "3-4",
  "5-6",
  "everyday",
  "varies",
  "never",
]);

/** A weight in pounds, matching the database range check. */
export const weightLbsSchema = z
  .number({ message: "Enter a valid weight." })
  .positive("Weight must be greater than 0.")
  .max(1500, "That weight looks too high.");

export const userProfileDraftSchema = z
  .object({
    currentWeight: weightLbsSchema,
    goalWeight: weightLbsSchema.nullable(),
    weightUnit: weightUnitSchema,
    goal: fitnessGoalSchema,
    goalCustom: z
      .string()
      .trim()
      .max(100, "Keep it under 100 characters.")
      .nullable(),
    workoutFrequency: workoutFrequencySchema,
    trackWorkouts: z.boolean(),
  })
  .refine((draft) => draft.goal !== "other" || !!draft.goalCustom, {
    message: "Tell us a bit about your goal.",
    path: ["goalCustom"],
  })
  .refine(
    (draft) => !goalNeedsTargetWeight(draft.goal) || draft.goalWeight !== null,
    {
      message: "Enter your goal weight.",
      path: ["goalWeight"],
    },
  );

export type UserProfileDraftInput = z.infer<typeof userProfileDraftSchema>;

/** Validates a single morning weight entry. */
export const weightEntrySchema = z.object({
  weightLbs: weightLbsSchema,
});

/** Parses free-form input from a weight field. Returns null when unusable. */
export function parseWeightInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Narrow a string coming from the database into a FitnessGoal. */
export function isFitnessGoal(value: string): value is FitnessGoal {
  return fitnessGoalSchema.safeParse(value).success;
}
