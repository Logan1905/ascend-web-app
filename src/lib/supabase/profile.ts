import { createClient } from "@/lib/supabase/client";
import { withRetry } from "@/lib/utils/retry";
import type {
  FitnessGoal,
  UserProfile,
  UserProfileDraft,
  WeightEntry,
  WeightUnit,
  WorkoutFrequency,
} from "@/types/profile";

/**
 * Data access layer for the user fitness profile and morning weight log.
 *
 * All functions run in the browser using the Supabase anon key. Row Level
 * Security on the database guarantees a user can only touch their own rows.
 *
 * Weights are stored in pounds; callers pass and receive pounds.
 */

// --- Raw database row shapes (snake_case, as returned by Supabase) ---

interface ProfileRow {
  user_id: string;
  current_weight: number | string;
  starting_weight: number | string;
  goal_weight: number | string | null;
  weight_unit: string;
  goal: string;
  goal_custom: string | null;
  workout_frequency: string;
  onboarded: boolean;
}

interface WeightEntryRow {
  id: string;
  weight_lbs: number | string;
  logged_on: string;
}

/** Postgres numeric columns come back as strings via PostgREST. */
function num(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    currentWeight: num(row.current_weight),
    startingWeight: num(row.starting_weight),
    goalWeight: row.goal_weight === null ? null : num(row.goal_weight),
    weightUnit: row.weight_unit as WeightUnit,
    goal: row.goal as FitnessGoal,
    goalCustom: row.goal_custom,
    workoutFrequency: row.workout_frequency as WorkoutFrequency,
    onboarded: row.onboarded,
  };
}

function mapWeightEntry(row: WeightEntryRow): WeightEntry {
  return {
    id: row.id,
    weightLbs: num(row.weight_lbs),
    loggedOn: row.logged_on,
  };
}

const PROFILE_SELECT = `
  user_id,
  current_weight,
  starting_weight,
  goal_weight,
  weight_unit,
  goal,
  goal_custom,
  workout_frequency,
  onboarded
`;

/** Today's date as a local-time ISO date string (YYYY-MM-DD). */
function localToday(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// --- Queries ---

/** Fetches the signed-in user's profile, or null if they haven't onboarded. */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  return withRetry(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapProfile(data as ProfileRow);
  });
}

/** Fetches the user's logged weights, oldest first. */
export async function fetchWeightEntries(): Promise<WeightEntry[]> {
  return withRetry(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("weight_entries")
      .select("id, weight_lbs, logged_on")
      .order("logged_on", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data ?? []) as WeightEntryRow[]).map(mapWeightEntry);
  });
}

// --- Mutations ---

/**
 * Saves the onboarding answers. Creates the profile on first save and updates
 * it afterwards, leaving `starting_weight` untouched once it exists so the
 * user's baseline is never lost.
 */
export async function saveUserProfile(
  draft: UserProfileDraft,
): Promise<UserProfile> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in to save your profile.");

  const existing = await fetchUserProfile();

  const payload = {
    user_id: user.id,
    current_weight: draft.currentWeight,
    starting_weight: existing?.startingWeight ?? draft.currentWeight,
    goal_weight: draft.goalWeight,
    weight_unit: draft.weightUnit,
    goal: draft.goal,
    goal_custom: draft.goal === "other" ? draft.goalCustom : null,
    workout_frequency: draft.workoutFrequency,
    onboarded: true,
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select(PROFILE_SELECT)
    .single();

  if (error) throw new Error(error.message);

  // Seed the weight log so the chart has a first data point.
  await addWeightEntry(draft.currentWeight);

  return mapProfile(data as ProfileRow);
}

/** Stores the user's preferred display unit so it persists across visits. */
export async function updateWeightUnit(unit: WeightUnit): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("user_profiles")
    .update({ weight_unit: unit })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

/**
 * Logs a morning weight for today, replacing any earlier entry for the same
 * day, and keeps the profile's current weight in sync.
 */
export async function addWeightEntry(weightLbs: number): Promise<WeightEntry> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in to log your weight.");

  const { data, error } = await supabase
    .from("weight_entries")
    .upsert(
      {
        user_id: user.id,
        weight_lbs: weightLbs,
        logged_on: localToday(),
      },
      { onConflict: "user_id,logged_on" },
    )
    .select("id, weight_lbs, logged_on")
    .single();

  if (error) throw new Error(error.message);

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ current_weight: weightLbs })
    .eq("user_id", user.id);

  if (profileError) throw new Error(profileError.message);

  return mapWeightEntry(data as WeightEntryRow);
}
