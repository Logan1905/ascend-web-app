"use client";

import { Clock, Moon } from "lucide-react";

import { weightFromLbs, type WorkoutLog } from "@/types/journal";
import type { WeightUnit } from "@/types/profile";
import type { RoutineDay } from "@/types/routine";

/**
 * Shows the workout planned for the selected day and lets the user record what
 * they actually did.
 *
 * Planned values (exercise, sets, rep range) are read-only — they come straight
 * from the user's routine and are never edited here.
 */

interface JournalWorkoutProps {
  /** The routine day for the selected date, or null when nothing is scheduled. */
  day: RoutineDay | null;
  /** Fallback heading when the day has no custom label. */
  dayName: string;
  /** Recorded results keyed by exercise name. */
  logs: Map<string, WorkoutLog>;
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  onFieldChange: (
    exerciseName: string,
    field: "weight" | "reps",
    rawValue: string,
  ) => void;
  /** Commits the row to the database (called on blur). */
  onFieldCommit: (exerciseName: string) => void;
  /** Draft text the user is currently typing, keyed by `name|field`. */
  drafts: Map<string, string>;
  status: "idle" | "saving" | "saved";
}

export function JournalWorkout({
  day,
  dayName,
  logs,
  unit,
  onUnitChange,
  onFieldChange,
  onFieldCommit,
  drafts,
  status,
}: JournalWorkoutProps) {
  // Nothing scheduled: a rest day, no active routine, or an empty day.
  if (!day || day.isRestDay || day.exercises.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center">
        {day?.isRestDay ? (
          <>
            <Moon className="text-muted-foreground size-7" />
            <p className="text-sm font-medium">Rest day</p>
            <p className="text-muted-foreground text-sm">
              No workout scheduled for this day.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No workout scheduled for this day.
          </p>
        )}
      </div>
    );
  }

  /** Value shown in an input: the live draft if present, else the stored value. */
  function displayValue(
    exerciseName: string,
    field: "weight" | "reps",
  ): string {
    const draft = drafts.get(`${exerciseName}|${field}`);
    if (draft !== undefined) return draft;

    const log = logs.get(exerciseName);
    if (!log) return "";

    if (field === "reps") {
      return log.repsDone === null ? "" : String(log.repsDone);
    }
    return log.weightLbs === null
      ? ""
      : String(weightFromLbs(log.weightLbs, unit));
  }

  return (
    <div className="border-border bg-card rounded-xl border">
      {/* Header: title, unit toggle, rest time */}
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">{day.label || dayName}</h2>
          {status === "saving" && (
            <span className="text-muted-foreground text-xs">Saving…</span>
          )}
          {status === "saved" && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Weight unit toggle, sits left of the rest time */}
          <div className="border-border flex overflow-hidden rounded-lg border text-xs font-medium">
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                onClick={() => onUnitChange(u)}
                aria-pressed={unit === u}
                className={`px-2.5 py-1 transition-colors ${
                  unit === u
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {u === "lbs" ? "lb" : "kg"}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Clock className="size-4" />
            <span>Rest: {day.restMinutes} min</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              <th className="text-muted-foreground px-5 py-3 text-left font-medium">
                Exercise &amp; Reps
              </th>
              <th className="text-muted-foreground px-3 py-3 text-center font-medium">
                Sets
              </th>
              <th className="text-muted-foreground px-3 py-3 text-center font-medium">
                Weight
              </th>
              <th className="text-muted-foreground px-3 py-3 text-center font-medium">
                Reps Done
              </th>
            </tr>
          </thead>
          <tbody>
            {day.exercises.map((exercise, index) => (
              <tr
                key={exercise.id}
                className={
                  index < day.exercises.length - 1
                    ? "border-border border-b"
                    : ""
                }
              >
                {/* Planned: exercise name + rep range */}
                <td className="px-5 py-3">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {exercise.reps} reps
                  </p>
                </td>

                {/* Planned: sets */}
                <td className="text-muted-foreground px-3 py-3 text-center">
                  {exercise.sets}
                </td>

                {/* Actual: weight */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    inputMode="decimal"
                    value={displayValue(exercise.name, "weight")}
                    onChange={(e) =>
                      onFieldChange(exercise.name, "weight", e.target.value)
                    }
                    onBlur={() => onFieldCommit(exercise.name)}
                    placeholder="—"
                    aria-label={`Weight for ${exercise.name} in ${unit}`}
                    className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-9 w-20 rounded-lg border px-2 text-center transition-colors outline-none focus:ring-2"
                  />
                </td>

                {/* Actual: reps completed */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    value={displayValue(exercise.name, "reps")}
                    onChange={(e) =>
                      onFieldChange(exercise.name, "reps", e.target.value)
                    }
                    onBlur={() => onFieldCommit(exercise.name)}
                    placeholder="—"
                    aria-label={`Reps completed for ${exercise.name}`}
                    className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-9 w-20 rounded-lg border px-2 text-center transition-colors outline-none focus:ring-2"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
