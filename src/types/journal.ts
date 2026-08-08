/**
 * Domain types for the Journal tab.
 *
 * The Journal records what the user ACTUALLY did. The planned workout
 * (exercise, sets, rep range) always comes from their routine and is never
 * duplicated here — see `src/types/routine.ts`.
 */

import type { WeightUnit } from "@/types/profile";

/** A recorded result for one exercise on one day. */
export interface WorkoutLog {
  /** Exercise name, used as the stable key across routine edits. */
  exerciseName: string;
  /** Weight in pounds, or null when nothing has been recorded yet. */
  weightLbs: number | null;
  /** The unit the user typed in, so the value round-trips unchanged. */
  weightUnit: WeightUnit;
  /** Reps actually completed, or null when not recorded. */
  repsDone: number | null;
}

/** A day's journal text. */
export interface JournalEntry {
  /** ISO date string, e.g. "2026-08-07". */
  entryDate: string;
  body: string;
}

/** Everything the Journal needs for a single day. */
export interface JournalDay {
  logs: WorkoutLog[];
  entry: JournalEntry | null;
}

const LBS_PER_KG = 2.20462;

/** Converts a stored pound value for display in the chosen unit. */
export function weightFromLbs(lbs: number, unit: WeightUnit): number {
  const value = unit === "kg" ? lbs / LBS_PER_KG : lbs;
  return Math.round(value * 10) / 10;
}

/** Converts a user-entered weight into pounds for storage. */
export function weightToLbs(value: number, unit: WeightUnit): number {
  const lbs = unit === "kg" ? value * LBS_PER_KG : value;
  return Math.round(lbs * 100) / 100;
}

/** Builds an empty log row for an exercise that has no record yet. */
export function emptyLog(
  exerciseName: string,
  weightUnit: WeightUnit,
): WorkoutLog {
  return { exerciseName, weightLbs: null, weightUnit, repsDone: null };
}
