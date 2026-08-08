import { createClient } from "@/lib/supabase/client";
import { withRetry } from "@/lib/utils/retry";
import type { JournalDay, JournalEntry, WorkoutLog } from "@/types/journal";
import type { WeightUnit } from "@/types/profile";

/**
 * Data access layer for the Journal: recorded workout results and daily
 * journal entries.
 *
 * Every read and write is scoped to a single date, so one day can never
 * overwrite another. Row Level Security keeps users to their own rows.
 */

// --- Raw database row shapes (snake_case, as returned by Supabase) ---

interface WorkoutLogRow {
  exercise_name: string;
  weight_lbs: number | string | null;
  weight_unit: string;
  reps_done: number | null;
}

interface JournalEntryRow {
  entry_date: string;
  body: string;
}

/** Postgres numeric columns come back as strings via PostgREST. */
function num(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapLog(row: WorkoutLogRow): WorkoutLog {
  return {
    exerciseName: row.exercise_name,
    weightLbs: num(row.weight_lbs),
    weightUnit: row.weight_unit as WeightUnit,
    repsDone: row.reps_done,
  };
}

function mapEntry(row: JournalEntryRow): JournalEntry {
  return { entryDate: row.entry_date, body: row.body };
}

/** Requires a signed-in user and returns their id. */
async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("You must be signed in.");

  return user.id;
}

// --- Queries ---

/** Loads the recorded results and journal entry for one date. */
export async function fetchJournalDay(dateISO: string): Promise<JournalDay> {
  return withRetry(async () => {
    const supabase = createClient();

    const [logsResult, entryResult] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("exercise_name, weight_lbs, weight_unit, reps_done")
        .eq("logged_on", dateISO),
      supabase
        .from("journal_entries")
        .select("entry_date, body")
        .eq("entry_date", dateISO)
        .maybeSingle(),
    ]);

    if (logsResult.error) throw new Error(logsResult.error.message);
    if (entryResult.error) throw new Error(entryResult.error.message);

    return {
      logs: ((logsResult.data ?? []) as WorkoutLogRow[]).map(mapLog),
      entry: entryResult.data
        ? mapEntry(entryResult.data as JournalEntryRow)
        : null,
    };
  });
}

// --- Mutations ---

/**
 * Records the result for one exercise on one date.
 * Re-saving the same exercise on the same date replaces the previous values.
 */
export async function saveWorkoutLog(
  dateISO: string,
  log: {
    exerciseName: string;
    weightLbs: number | null;
    weightUnit: WeightUnit;
    repsDone: number | null;
  },
): Promise<void> {
  const supabase = createClient();
  const userId = await requireUserId();

  const { error } = await supabase.from("workout_logs").upsert(
    {
      user_id: userId,
      logged_on: dateISO,
      exercise_name: log.exerciseName,
      weight_lbs: log.weightLbs,
      weight_unit: log.weightUnit,
      reps_done: log.repsDone,
    },
    { onConflict: "user_id,logged_on,exercise_name" },
  );

  if (error) throw new Error(error.message);
}

/**
 * Saves the journal text for one date, leaving every other date untouched.
 */
export async function saveJournalEntry(
  dateISO: string,
  body: string,
): Promise<void> {
  const supabase = createClient();
  const userId = await requireUserId();

  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: userId,
      entry_date: dateISO,
      body,
    },
    { onConflict: "user_id,entry_date" },
  );

  if (error) throw new Error(error.message);
}
