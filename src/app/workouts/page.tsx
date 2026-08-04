"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, StickyNote, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

// --- Static data ---

const userName = "Logan";
const todaysRoutine = "Push";
const restTime = "3 min";

const exercises = [
  { name: "Flat Barbell Bench Press", sets: 4, reps: "8-10" },
  { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
  { name: "Cable Flyes", sets: 3, reps: "12-15" },
  { name: "Overhead Press", sets: 4, reps: "8-10" },
  { name: "Lateral Raises", sets: 3, reps: "12-15" },
  { name: "Tricep Pushdowns", sets: 3, reps: "10-12" },
  { name: "Overhead Tricep Extension", sets: 3, reps: "10-12" },
];

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// --- Component ---

export default function WorkoutsPage() {
  const [notes, setNotes] = useState("");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Greeting + Routine button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">Today&apos;s workout:</p>
        </div>
        <Link href="/workouts/routines">
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
            <CalendarDays className="size-4" />
            My Routines
          </Button>
        </Link>
      </div>

      {/* Workout Table */}
      <div className="border-border bg-card rounded-xl border">
        {/* Table header with routine name and rest time */}
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{todaysRoutine}</h2>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Clock className="size-4" />
            <span>Rest: {restTime}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-muted/50 border-b">
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">
                  Exercise
                </th>
                <th className="text-muted-foreground px-5 py-3 text-center font-medium">
                  Sets
                </th>
                <th className="text-muted-foreground px-5 py-3 text-center font-medium">
                  Reps
                </th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise, index) => (
                <tr
                  key={exercise.name}
                  className={
                    index < exercises.length - 1 ? "border-border border-b" : ""
                  }
                >
                  <td className="px-5 py-3.5 font-medium">{exercise.name}</td>
                  <td className="text-muted-foreground px-5 py-3.5 text-center">
                    {exercise.sets}
                  </td>
                  <td className="text-muted-foreground px-5 py-3.5 text-center">
                    {exercise.reps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workout Notes */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-3 flex items-center gap-2">
          <StickyNote className="text-muted-foreground size-5" />
          <h2 className="text-base font-semibold">Workout Notes</h2>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did the workout feel? Any PRs? Adjustments for next time..."
          className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 min-h-[120px] w-full resize-y rounded-lg border px-4 py-3 text-sm transition-colors outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}
