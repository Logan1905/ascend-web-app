"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

// --- Types ---

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

interface DayRoutine {
  isRestDay: boolean;
  routineName: string;
  restTime: string;
  exercises: Exercise[];
}

type WeekRoutine = Record<string, DayRoutine>;

// --- Constants ---

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function emptyDay(): DayRoutine {
  return { isRestDay: false, routineName: "", restTime: "3", exercises: [] };
}

function emptyWeek(): WeekRoutine {
  const week: WeekRoutine = {};
  daysOfWeek.forEach((day) => {
    week[day] = emptyDay();
  });
  return week;
}

// --- Component ---

export default function NewRoutinePage() {
  const [routineName, setRoutineName] = useState("");
  const [week, setWeek] = useState<WeekRoutine>(emptyWeek);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  function updateDay(day: string, updates: Partial<DayRoutine>) {
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  }

  function addExercise(day: string) {
    const dayData = week[day];
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: "",
      sets: 3,
      reps: "8-10",
    };
    updateDay(day, { exercises: [...dayData.exercises, newExercise] });
  }

  function removeExercise(day: string, exerciseId: string) {
    const dayData = week[day];
    updateDay(day, {
      exercises: dayData.exercises.filter((e) => e.id !== exerciseId),
    });
  }

  function updateExercise(
    day: string,
    exerciseId: string,
    updates: Partial<Exercise>,
  ) {
    const dayData = week[day];
    updateDay(day, {
      exercises: dayData.exercises.map((e) =>
        e.id === exerciseId ? { ...e, ...updates } : e,
      ),
    });
  }

  function toggleRestDay(day: string) {
    const dayData = week[day];
    updateDay(day, {
      isRestDay: !dayData.isRestDay,
      exercises: !dayData.isRestDay ? [] : dayData.exercises,
      routineName: !dayData.isRestDay ? "" : dayData.routineName,
    });
  }

  // --- Day editor view ---
  if (selectedDay) {
    const dayData = week[selectedDay];

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
          <h1 className="text-2xl font-bold tracking-tight">{selectedDay}</h1>
        </div>

        {/* Rest day toggle */}
        <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
          <Moon className="text-muted-foreground size-5" />
          <span className="flex-1 text-sm font-medium">Rest Day</span>
          <button
            onClick={() => toggleRestDay(selectedDay)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              dayData.isRestDay ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={dayData.isRestDay}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                dayData.isRestDay ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Routine editor */}
        {!dayData.isRestDay && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Day Label</label>
                <input
                  type="text"
                  value={dayData.routineName}
                  onChange={(e) =>
                    updateDay(selectedDay, { routineName: e.target.value })
                  }
                  placeholder="e.g. Push, Pull, Legs"
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-3 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rest Time (min)</label>
                <input
                  type="text"
                  value={dayData.restTime}
                  onChange={(e) =>
                    updateDay(selectedDay, { restTime: e.target.value })
                  }
                  placeholder="e.g. 3"
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
              {dayData.exercises.map((exercise) => (
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
        {daysOfWeek.map((day) => {
          const dayData = week[day];
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="border-border bg-card hover:bg-accent/50 flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors"
            >
              <div>
                <p className="font-medium">{day}</p>
                <p className="text-muted-foreground text-sm">
                  {dayData.isRestDay
                    ? "Rest Day"
                    : dayData.routineName
                      ? `${dayData.routineName} — ${dayData.exercises.length} exercises`
                      : "Not configured"}
                </p>
              </div>
              {dayData.isRestDay && (
                <Moon className="text-muted-foreground size-5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <Link href="/workouts/routines" className="flex-1">
          <Button variant="outline" className="w-full">
            Cancel
          </Button>
        </Link>
        <Link href="/workouts/routines" className="flex-1">
          <Button className="w-full">Save Routine</Button>
        </Link>
      </div>
    </div>
  );
}
