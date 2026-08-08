"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/components/providers/profile-provider";
import { useSelectedDate } from "@/components/providers/date-provider";
import { JournalWorkout } from "@/components/shared/journal-workout";
import { JournalNotes } from "@/components/shared/journal-notes";
import {
  fetchJournalDay,
  saveJournalEntry,
  saveWorkoutLog,
} from "@/lib/supabase/journal";
import { fetchActiveRoutine } from "@/lib/supabase/routines";
import { toISODate } from "@/lib/utils/date";
import { withRetry } from "@/lib/utils/retry";
import { weightToLbs, type WorkoutLog } from "@/types/journal";
import type { WeightUnit } from "@/types/profile";
import { DAYS_OF_WEEK, getTodayDayOfWeek, type Routine } from "@/types/routine";

/** Parses an input string into a number, treating blank as "not recorded". */
function parseField(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const { trackWorkouts, profile, loading: profileLoading } = useProfile();
  const { selectedDate } = useSelectedDate();

  const dateISO = toISODate(selectedDate);
  const dayOfWeek = getTodayDayOfWeek(selectedDate);
  const dayName = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)!.label;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [logs, setLogs] = useState<Map<string, WorkoutLog>>(new Map());
  const [drafts, setDrafts] = useState<Map<string, string>>(new Map());
  const [unit, setUnit] = useState<WeightUnit>("lbs");

  const [journalBody, setJournalBody] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [savingJournal, setSavingJournal] = useState(false);

  const [workoutStatus, setWorkoutStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const preferredUnit: WeightUnit = profile?.weightUnit ?? "lbs";

  // Reload whenever the signed-in user, the selected date, or the workout
  // preference changes. Everything is scoped to `dateISO`.
  useEffect(() => {
    if (authLoading || profileLoading) return;

    let cancelled = false;

    // Async IIFE: React 19 forbids calling setState in an effect body.
    void (async () => {
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
        setDrafts(new Map());
      }

      try {
        const [day, activeRoutine] = await Promise.all([
          fetchJournalDay(dateISO),
          trackWorkouts
            ? withRetry(() => fetchActiveRoutine())
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setRoutine(activeRoutine);
        setLogs(new Map(day.logs.map((log) => [log.exerciseName, log])));
        setJournalBody(day.entry?.body ?? "");
        setSavedBody(day.entry?.body ?? "");

        // Show weights in whatever unit the user last typed for this day.
        const recordedUnit = day.logs.find(
          (log) => log.weightLbs !== null,
        )?.weightUnit;
        setUnit(recordedUnit ?? preferredUnit);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load this day.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    authLoading,
    profileLoading,
    trackWorkouts,
    dateISO,
    preferredUnit,
  ]);

  const routineDay = useMemo(
    () => routine?.days.find((d) => d.dayOfWeek === dayOfWeek) ?? null,
    [routine, dayOfWeek],
  );

  /** Briefly flashes "Saved" next to the workout heading. */
  const flashSaved = useCallback(() => {
    setWorkoutStatus("saved");
    setTimeout(() => setWorkoutStatus("idle"), 1500);
  }, []);

  function handleFieldChange(
    exerciseName: string,
    field: "weight" | "reps",
    rawValue: string,
  ) {
    setDrafts((prev) => {
      const next = new Map(prev);
      next.set(`${exerciseName}|${field}`, rawValue);
      return next;
    });
  }

  /** Writes the row on blur, so a half-typed number is never persisted. */
  async function handleFieldCommit(exerciseName: string) {
    const weightDraft = drafts.get(`${exerciseName}|weight`);
    const repsDraft = drafts.get(`${exerciseName}|reps`);

    // Nothing was edited for this exercise.
    if (weightDraft === undefined && repsDraft === undefined) return;

    const existing = logs.get(exerciseName);

    // An untouched field keeps its stored value; a cleared field becomes null.
    let nextWeightLbs: number | null;
    if (weightDraft === undefined) {
      nextWeightLbs = existing?.weightLbs ?? null;
    } else {
      const parsed = parseField(weightDraft);
      nextWeightLbs = parsed === null ? null : weightToLbs(parsed, unit);
    }

    const nextReps =
      repsDraft !== undefined
        ? parseField(repsDraft)
        : (existing?.repsDone ?? null);

    const nextLog: WorkoutLog = {
      exerciseName,
      weightLbs: nextWeightLbs,
      weightUnit: unit,
      repsDone: nextReps,
    };

    // Optimistic update, then clear the drafts we just committed.
    setLogs((prev) => new Map(prev).set(exerciseName, nextLog));
    setDrafts((prev) => {
      const next = new Map(prev);
      next.delete(`${exerciseName}|weight`);
      next.delete(`${exerciseName}|reps`);
      return next;
    });

    setWorkoutStatus("saving");
    try {
      await saveWorkoutLog(dateISO, nextLog);
      flashSaved();
    } catch (err) {
      setWorkoutStatus("idle");
      setError(
        err instanceof Error ? err.message : "Could not save your workout.",
      );
    }
  }

  /**
   * Switching units only changes what is displayed — stored pounds never move.
   * Rows that already hold a value get their unit persisted so the number the
   * user typed comes back unchanged.
   */
  async function handleUnitChange(next: WeightUnit) {
    if (next === unit) return;
    setUnit(next);

    const recorded = [...logs.values()].filter(
      (log) => log.weightLbs !== null || log.repsDone !== null,
    );
    if (recorded.length === 0) return;

    try {
      await Promise.all(
        recorded.map((log) =>
          saveWorkoutLog(dateISO, { ...log, weightUnit: next }),
        ),
      );
      setLogs((prev) => {
        const updated = new Map(prev);
        recorded.forEach((log) =>
          updated.set(log.exerciseName, { ...log, weightUnit: next }),
        );
        return updated;
      });
    } catch {
      // Display-only preference — not worth interrupting the user.
    }
  }

  async function handleSaveJournal() {
    setSavingJournal(true);
    try {
      await saveJournalEntry(dateISO, journalBody);
      setSavedBody(journalBody);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your journal.",
      );
    } finally {
      setSavingJournal(false);
    }
  }

  // --- Gates ---

  if (authLoading || profileLoading || (user && loading)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">Sign in to use your journal.</p>
          <Link href="/profile">
            <Button size="sm">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Workout section — only when the user opted into tracking */}
      {trackWorkouts && (
        <JournalWorkout
          day={routineDay}
          dayName={dayName}
          logs={logs}
          unit={unit}
          onUnitChange={handleUnitChange}
          onFieldChange={handleFieldChange}
          onFieldCommit={handleFieldCommit}
          drafts={drafts}
          status={workoutStatus}
        />
      )}

      {/* Journal section — always available */}
      <JournalNotes
        value={journalBody}
        onChange={setJournalBody}
        dirty={journalBody !== savedBody}
        saving={savingJournal}
        onSave={handleSaveJournal}
      />
    </div>
  );
}
