"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { createRoutine } from "@/lib/supabase/routines";
import { routineDraftSchema } from "@/schemas/routine";
import {
  createEmptyWeek,
  DAYS_OF_WEEK,
  DEFAULT_REPS,
  DEFAULT_SETS,
  type DayOfWeek,
  type RoutineDay,
  type RoutineExercise,
} from "@/types/routine";

export default function NewRoutinePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [routineName, setRoutineName] = useState("");
  const [days, setDays] = useState<RoutineDay[]>(createEmptyWeek);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(dayOfWeek: DayOfWeek, updates: Partial<RoutineDay>) {
    setDays((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day,
      ),
    );
  }

  function getDay(dayOfWeek: DayOfWeek): RoutineDay {
    return days.find((d) => d.dayOfWeek === dayOfWeek)!;
  }

  function addExercise(dayOfWeek: DayOfWeek) {
    const day = getDay(dayOfWeek);
    const newExercise: RoutineExercise = {
      id: crypto.randomUUID(),
      name: "",
      sets: DEFAULT_SETS,
      reps: DEFAULT_REPS,
    };
    updateDay(dayOfWeek, { exercises: [...day.exercises, newExercise] });
  }

  function removeExercise(dayOfWeek: DayOfWeek, exerciseId: string) {
    const day = getDay(dayOfWeek);
    updateDay(dayOfWeek, {
      exercises: day.exercises.filter((e) => e.id !== exerciseId),
    });
  }

  function updateExercise(
    dayOfWeek: DayOfWeek,
    exerciseId: string,
    updates: Partial<RoutineExercise>,
  ) {
    const day = getDay(dayOfWeek);
    updateDay(dayOfWeek, {
      exercises: day.exercises.map((e) =>
        e.id === exerciseId ? { ...e, ...updates } : e,
      ),
    });
  }

  function toggleRestDay(dayOfWeek: DayOfWeek) {
    const day = getDay(dayOfWeek);
    const becomingRestDay = !day.isRestDay;
    updateDay(dayOfWeek, {
      isRestDay: becomingRestDay,
      label: becomingRestDay ? "" : day.label,
      exercises: becomingRestDay ? [] : day.exercises,
    });
  }

  async function handleSave() {
    setError(null);

    const parsed = routineDraftSchema.safeParse({
      name: routineName,
      days,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Please check the routine details.");
      return;
    }

    setSaving(true);
    try {
      await createRoutine({ name: routineName, days });
      router.push("/workouts/routines");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the routine.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --- Not signed in ---
  if (!authLoading && !user) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/workouts/routines"
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
            aria-label="Back to routines"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">New Routine</h1>
        </div>
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            Sign in to create and save routines.
          </p>
          <Link href="/profile">
            <Button size="sm">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Day editor view ---
  if (selectedDay !== null) {
    const day = getDay(selectedDay);
    const dayLabel = DAYS_OF_WEEK.find((d) => d.value === selectedDay)!.label;

    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDay(null)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
            aria-label="Back to week view"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{dayLabel}</h1>
        </div>

        {/* Rest day toggle */}
        <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
          <Moon className="text-muted-foreground size-5" />
          <span className="flex-1 text-sm font-medium">Rest Day</span>
          <button
            onClick={() => toggleRestDay(selectedDay)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              day.isRestDay ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={day.isRestDay}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                day.isRestDay ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Routine editor */}
        {!day.isRestDay && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Day Label</label>
                <input
                  type="text"
                  value={day.label}
                  onChange={(e) =>
                    updateDay(selectedDay, { label: e.target.value })
                  }
                  placeholder="e.g. Push, Pull, Legs"
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rest Time (min)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={day.restMinutes}
                  onChange={(e) =>
                    updateDay(selectedDay, {
                      restMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Exercises</h2>
                <div className="text-muted-foreground hidden text-xs sm:flex sm:gap-8 sm:pr-10">
                  <span>Sets</span>
                  <span>Reps</span>
                </div>
              </div>

              {day.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="border-border bg-card flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_80px]">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(selectedDay, exercise.id, {
                          name: e.target.value,
                        })
                      }
                      placeholder="Exercise name"
                      className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-9 w-full rounded-md border px-3 text-sm transition-colors outline-none focus:ring-2"
                    />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={exercise.sets}
                      onChange={(e) =>
                        updateExercise(selectedDay, exercise.id, {
                          sets: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Sets"
                      className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-9 w-full rounded-md border px-3 text-center text-sm transition-colors outline-none focus:ring-2"
                    />
                    <input
                      type="text"
                      value={exercise.reps}
                      onChange={(e) =>
                        updateExercise(selectedDay, exercise.id, {
                          reps: e.target.value,
                        })
                      }
                      placeholder="Reps"
                      className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-9 w-full rounded-md border px-3 text-center text-sm transition-colors outline-none focus:ring-2"
                    />
                  </div>
                  <button
                    onClick={() => removeExercise(selectedDay, exercise.id)}
                    className="text-destructive hover:bg-destructive/10 mt-1 rounded-md p-1.5 transition-colors"
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => addExercise(selectedDay)}
              >
                <Plus className="size-4" />
                Add Exercise
              </Button>
            </div>
          </>
        )}

        <Button className="w-full" onClick={() => setSelectedDay(null)}>
          Done
        </Button>
      </div>
    );
  }

  // --- Week overview ---
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/workouts/routines"
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
          aria-label="Back to routines"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Routine</h1>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Routine name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Routine Name</label>
        <input
          type="text"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          placeholder="e.g. Push Pull Legs, Bro Split, Full Body"
          className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2"
        />
      </div>

      <p className="text-muted-foreground text-sm">
        Tap a day to set up your workout or mark it as a rest day.
      </p>

      {/* Days of the week */}
      <div className="space-y-2">
        {DAYS_OF_WEEK.map(({ value, label }) => {
          const day = getDay(value);
          return (
            <button
              key={value}
              onClick={() => setSelectedDay(value)}
              className="border-border bg-card hover:bg-accent/50 flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors"
            >
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground text-sm">
                  {day.isRestDay
                    ? "Rest Day"
                    : day.label
                      ? `${day.label} — ${day.exercises.length} exercise${
                          day.exercises.length === 1 ? "" : "s"
                        }`
                      : "Not configured"}
                </p>
              </div>
              {day.isRestDay && (
                <Moon className="text-muted-foreground size-5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <Link href="/workouts/routines" className="flex-1">
          <Button variant="outline" className="w-full" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Routine"}
        </Button>
      </div>
    </div>
  );
}
