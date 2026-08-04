import { createClient } from "@/lib/supabase/client";
import {
  DAYS_OF_WEEK,
  DEFAULT_REST_MINUTES,
  type DayOfWeek,
  type Routine,
  type RoutineDay,
  type RoutineDraft,
} from "@/types/routine";

/**
 * Data access layer for workout routines.
 *
 * All functions run in the browser using the Supabase anon key. Row Level
 * Security on the database guarantees a user can only touch their own rows.
 */

// --- Raw database row shapes (snake_case, as returned by Supabase) ---

interface ExerciseRow {
  id: string;
  name: string;
  sets: number;
  reps: string;
  position: number;
}

interface DayRow {
  id: string;
  day_of_week: number;
  is_rest_day: boolean;
  label: string;
  rest_minutes: number;
  routine_exercises: ExerciseRow[] | null;
}

interface RoutineRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  routine_days: DayRow[] | null;
}

const ROUTINE_SELECT = `
  id,
  name,
  is_active,
  created_at,
  routine_days (
    id,
    day_of_week,
    is_rest_day,
    label,
    rest_minutes,
    routine_exercises ( id, name, sets, reps, position )
  )
`;

// --- Mapping helpers ---

/** Converts a database row into the camelCase shape the UI uses. */
function mapRoutine(row: RoutineRow): Routine {
  const dayRows = row.routine_days ?? [];

  // Always return all seven days in order, filling gaps defensively.
  const days: RoutineDay[] = DAYS_OF_WEEK.map(({ value }) => {
    const dayRow = dayRows.find((d) => d.day_of_week === value);

    if (!dayRow) {
      return {
        dayOfWeek: value,
        isRestDay: false,
        label: "",
        restMinutes: DEFAULT_REST_MINUTES,
        exercises: [],
      };
    }

    const exercises = [...(dayRow.routine_exercises ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
      }));

    return {
      dayOfWeek: dayRow.day_of_week as DayOfWeek,
      isRestDay: dayRow.is_rest_day,
      label: dayRow.label,
      restMinutes: dayRow.rest_minutes,
      exercises,
    };
  });

  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
    days,
  };
}

// --- Queries ---

/** Fetches every routine belonging to the signed-in user, newest first. */
export async function fetchRoutines(): Promise<Routine[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("routines")
    .select(ROUTINE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as RoutineRow[]).map(mapRoutine);
}

/** Fetches the user's currently active routine, or null if none is set. */
export async function fetchActiveRoutine(): Promise<Routine | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("routines")
    .select(ROUTINE_SELECT)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapRoutine(data as RoutineRow);
}

/** Fetches a single routine by its ID. */
export async function fetchRoutineById(
  routineId: string,
): Promise<Routine | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("routines")
    .select(ROUTINE_SELECT)
    .eq("id", routineId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapRoutine(data as RoutineRow);
}

// --- Mutations ---

/**
 * Writes the seven days (and their exercises) for a routine.
 * Existing days for the routine are replaced.
 */
async function writeRoutineDays(routineId: string, days: RoutineDay[]) {
  const supabase = createClient();

  // Replace the day rows. Exercises cascade-delete with their day.
  const { error: deleteError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routineId);

  if (deleteError) throw new Error(deleteError.message);

  const { data: insertedDays, error: dayError } = await supabase
    .from("routine_days")
    .insert(
      days.map((day) => ({
        routine_id: routineId,
        day_of_week: day.dayOfWeek,
        is_rest_day: day.isRestDay,
        label: day.isRestDay ? "" : day.label.trim(),
        rest_minutes: day.restMinutes,
      })),
    )
    .select("id, day_of_week");

  if (dayError) throw new Error(dayError.message);

  // Link each exercise to the id of its newly created day.
  const dayIdByWeekday = new Map<number, string>(
    (insertedDays ?? []).map((d) => [d.day_of_week as number, d.id as string]),
  );

  const exerciseRows = days.flatMap((day) => {
    if (day.isRestDay) return [];
    const dayId = dayIdByWeekday.get(day.dayOfWeek);
    if (!dayId) return [];

    return day.exercises
      .filter((exercise) => exercise.name.trim().length > 0)
      .map((exercise, index) => ({
        routine_day_id: dayId,
        name: exercise.name.trim(),
        sets: exercise.sets,
        reps: exercise.reps.trim(),
        position: index,
      }));
  });

  if (exerciseRows.length > 0) {
    const { error: exerciseError } = await supabase
      .from("routine_exercises")
      .insert(exerciseRows);

    if (exerciseError) throw new Error(exerciseError.message);
  }
}

/**
 * Creates a new routine for the signed-in user.
 * The first routine a user creates automatically becomes the active one.
 */
export async function createRoutine(draft: RoutineDraft): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in to save a routine.");

  // Make this routine active if the user has none yet.
  const { count, error: countError } = await supabase
    .from("routines")
    .select("id", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      name: draft.name.trim(),
      is_active: (count ?? 0) === 0,
    })
    .select("id")
    .single();

  if (routineError) throw new Error(routineError.message);

  try {
    await writeRoutineDays(routine.id, draft.days);
  } catch (err) {
    // Don't leave a half-written routine behind.
    await supabase.from("routines").delete().eq("id", routine.id);
    throw err;
  }

  return routine.id as string;
}

/** Updates an existing routine's name and replaces all of its days. */
export async function updateRoutine(
  routineId: string,
  draft: RoutineDraft,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("routines")
    .update({ name: draft.name.trim() })
    .eq("id", routineId);

  if (error) throw new Error(error.message);

  await writeRoutineDays(routineId, draft.days);
}

/** Deletes a routine (its days and exercises cascade). */
export async function deleteRoutine(routineId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId);

  if (error) throw new Error(error.message);
}

/** Marks a routine as the active one, deactivating any other. */
export async function setActiveRoutine(routineId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("set_active_routine", {
    target_routine_id: routineId,
  });

  if (error) throw new Error(error.message);
}
