/**
 * Domain types for workout routines.
 *
 * These are the camelCase shapes the UI works with. The mapping to/from the
 * snake_case database rows lives in `src/lib/supabase/routines.ts`.
 */

/** ISO weekday numbering: 1 = Monday ... 7 = Sunday. */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DAYS_OF_WEEK: ReadonlyArray<{
  value: DayOfWeek;
  label: string;
  short: string;
}> = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
];

export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = "8-10";
export const DEFAULT_REST_MINUTES = 3;

/** An exercise as stored in a routine day. */
export interface RoutineExercise {
  /** Client-side id. Not persisted — the database generates its own. */
  id: string;
  name: string;
  sets: number;
  reps: string;
}

/** A single day within a routine. */
export interface RoutineDay {
  dayOfWeek: DayOfWeek;
  isRestDay: boolean;
  /** Display name for the day, e.g. "Push". Empty for rest days. */
  label: string;
  restMinutes: number;
  exercises: RoutineExercise[];
}

/** A complete routine, including all seven days. */
export interface Routine {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  days: RoutineDay[];
}

/** The payload used when creating or updating a routine. */
export interface RoutineDraft {
  name: string;
  days: RoutineDay[];
}

/** Returns the ISO weekday (1-7) for a given date, defaulting to today. */
export function getTodayDayOfWeek(date: Date = new Date()): DayOfWeek {
  // JS getDay(): 0 = Sunday ... 6 = Saturday. Convert to ISO 1-7.
  const jsDay = date.getDay();
  return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

/** Builds an empty seven-day week, used as the starting point for new routines. */
export function createEmptyWeek(): RoutineDay[] {
  return DAYS_OF_WEEK.map(({ value }) => ({
    dayOfWeek: value,
    isRestDay: false,
    label: "",
    restMinutes: DEFAULT_REST_MINUTES,
    exercises: [],
  }));
}
