import { createClient } from "@/lib/supabase/client";
import { withRetry } from "@/lib/utils/retry";
import type {
  Country,
  FitnessGoal,
  HeightUnit,
  Sex,
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
  track_workouts: boolean;
  onboarded: boolean;
  birthday: string | null;
  height_cm: number | string | null;
  height_unit: string;
  sex: string | null;
  country: string | null;
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
    trackWorkouts: row.track_workouts ?? false,
    onboarded: row.onboarded,
    birthday: row.birthday,
    heightCm: row.height_cm === null ? null : num(row.height_cm),
    heightUnit: row.height_unit as HeightUnit,
    sex: row.sex as Sex | null,
    country: row.country as Country | null,
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
  track_workouts,
  onboarded,
  birthday,
  height_cm,
  height_unit,
  sex,
  country
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
    // Keep the original starting weight once a real one is set.
    starting_weight:
      existing && existing.startingWeight > 0
        ? existing.startingWeight
        : draft.currentWeight,
    goal_weight: draft.goalWeight,
    weight_unit: draft.weightUnit,
    goal: draft.goal,
    goal_custom: draft.goal === "other" ? draft.goalCustom : null,
    workout_frequency: draft.workoutFrequency,
    track_workouts: draft.trackWorkouts,
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

/**
 * Toggles workout tracking on its own.
 * Used by the Settings tab so the preference can change without re-running
 * the whole Progress setup.
 */
export async function updateTrackWorkouts(enabled: boolean): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be signed in.");

  const { error } = await supabase
    .from("user_profiles")
    .update({ track_workouts: enabled })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
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
 * Logs a morning weight for a given date (today by default), replacing any
 * earlier entry for that same date.
 *
 * `user_profiles.current_weight` is then resynced from the most recent entry,
 * so back-filling an older date never clobbers a newer reading.
 */
export async function addWeightEntry(
  weightLbs: number,
  dateISO: string = localToday(),
): Promise<WeightEntry> {
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
        logged_on: dateISO,
      },
      { onConflict: "user_id,logged_on" },
    )
    .select("id, weight_lbs, logged_on")
    .single();

  if (error) throw new Error(error.message);

  // The newest entry defines the profile's current weight, whichever date the
  // user happened to be editing.
  const { data: latest, error: latestError } = await supabase
    .from("weight_entries")
    .select("weight_lbs")
    .order("logged_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw new Error(latestError.message);

  const currentWeight = latest ? num(latest.weight_lbs) : weightLbs;

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ current_weight: currentWeight })
    .eq("user_id", user.id);

  if (profileError) throw new Error(profileError.message);

  return mapWeightEntry(data as WeightEntryRow);
}

/** Data collected during sign-up onboarding (before the progress onboarding). */
export interface SignupProfileData {
  birthday: string; // ISO date
  heightCm: number;
  heightUnit: HeightUnit;
  sex: Sex;
  country: Country;
}

/**
 * Creates the initial user_profiles row with sign-up details.
 * The progress onboarding will later fill in weight/goal/frequency.
 * If the row already exists this is a no-op.
 */
export async function createSignupProfile(
  data: SignupProfileData,
): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("You must be signed in.");

  // Insert with placeholder weight; progress onboarding will overwrite.
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      current_weight: 0,
      starting_weight: 0,
      weight_unit: "lbs",
      goal: "build_muscle",
      workout_frequency: "3-4",
      track_workouts: false,
      onboarded: false,
      birthday: data.birthday,
      height_cm: data.heightCm,
      height_unit: data.heightUnit,
      sex: data.sex,
      country: data.country,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (error) throw new Error(error.message);
}

/** Updates the personal detail fields on an existing profile. */
export async function updateProfileDetails(
  data: SignupProfileData,
): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      birthday: data.birthday,
      height_cm: data.heightCm,
      height_unit: data.heightUnit,
      sex: data.sex,
      country: data.country,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
