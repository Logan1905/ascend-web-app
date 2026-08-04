"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

// --- Types ---

interface DayInfo {
  isRestDay: boolean;
  routineName: string;
}

interface Routine {
  id: string;
  name: string;
  days: Record<string, DayInfo>;
}

// --- Static data ---

const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const daysFull = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const staticRoutines: Routine[] = [
  {
    id: "1",
    name: "Push Pull Legs",
    days: {
      Monday: { isRestDay: false, routineName: "Push" },
      Tuesday: { isRestDay: false, routineName: "Pull" },
      Wednesday: { isRestDay: false, routineName: "Legs" },
      Thursday: { isRestDay: true, routineName: "" },
      Friday: { isRestDay: false, routineName: "Upper Body" },
      Saturday: { isRestDay: false, routineName: "Lower Body" },
      Sunday: { isRestDay: true, routineName: "" },
    },
  },
  {
    id: "2",
    name: "Full Body 3x",
    days: {
      Monday: { isRestDay: false, routineName: "Full Body A" },
      Tuesday: { isRestDay: true, routineName: "" },
      Wednesday: { isRestDay: false, routineName: "Full Body B" },
      Thursday: { isRestDay: true, routineName: "" },
      Friday: { isRestDay: false, routineName: "Full Body C" },
      Saturday: { isRestDay: true, routineName: "" },
      Sunday: { isRestDay: true, routineName: "" },
    },
  },
];

// --- Component ---

export default function RoutinesPage() {
  const [activeId, setActiveId] = useState("1");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/workouts"
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">My Routines</h1>
        </div>
        <Link href="/workouts/routines/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Add Routine
          </Button>
        </Link>
      </div>

      {/* Routines list */}
      {staticRoutines.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            No routines yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {staticRoutines.map((routine) => {
            const isActive = routine.id === activeId;
            return (
              <div
                key={routine.id}
                className={`bg-card rounded-xl border p-4 transition-colors ${
                  isActive ? "border-primary" : "border-border"
                }`}
              >
                {/* Top row: checkmark + name */}
                <div className="mb-3 flex items-center gap-3">
                  <button
                    onClick={() => setActiveId(routine.id)}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 hover:border-primary"
                    }`}
                    aria-label={
                      isActive
                        ? "Currently active routine"
                        : `Set ${routine.name} as active`
                    }
                  >
                    {isActive && <Check className="size-4" />}
                  </button>
                  <h2 className="text-base font-semibold">{routine.name}</h2>
                </div>

                {/* Week grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {daysFull.map((day, i) => {
                    const dayInfo = routine.days[day];
                    return (
                      <div
                        key={day}
                        className="bg-muted/50 flex flex-col items-center rounded-lg px-1 py-2"
                      >
                        <span className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                          {daysShort[i]}
                        </span>
                        {dayInfo.isRestDay ? (
                          <Moon className="text-muted-foreground mt-1 size-3.5 sm:size-4" />
                        ) : (
                          <span className="mt-1 text-center text-[10px] leading-tight font-medium sm:text-xs">
                            {dayInfo.routineName || "—"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
