"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, StickyNote, CalendarDays, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchActiveRoutine, fetchRoutines } from "@/lib/supabase/routines";
import {
  DAYS_OF_WEEK,
  getTodayDayOfWeek,
  type Routine,
  type RoutineDay,
} from "@/types/routine";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [hasRoutines, setHasRoutines] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [active, allRoutines] = await Promise.all([
          fetchActiveRoutine(),
          fetchRoutines(),
        ]);
        if (!cancelled) {
          setRoutine(active);
          setHasRoutines(allRoutines.length > 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your routine.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "there";

  const todayDayOfWeek = getTodayDayOfWeek();
  const todayName = DAYS_OF_WEEK.find((d) => d.value === todayDayOfWeek)!.label;
  const today: RoutineDay | undefined = routine?.days.find(
    (d) => d.dayOfWeek === todayDayOfWeek,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Greeting + Routines button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}
            {user ? `, ${firstName}` : ""}
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

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Not signed in */}
      {!authLoading && !user && (
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            Sign in to see your workout for today.
          </p>
          <Link href="/profile">
            <Button size="sm">Go to Sign In</Button>
          </Link>
        </div>
      )}

      {/* Loading */}
      {(authLoading || (user && loading)) && (
        <p className="text-muted-foreground text-sm">Loading your workout…</p>
      )}

      {/* No active routine */}
      {user && !loading && !routine && !error && (
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          {hasRoutines ? (
            <>
              <p className="text-muted-foreground">
                No routine is currently active. Select one from your routines or
                create a new one.
              </p>
              <Link href="/workouts/routines">
                <Button size="sm">Go to My Routines</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                No routines yet. Create one to see your daily workout.
              </p>
              <Link href="/workouts/routines/new">
                <Button size="sm">Create a Routine</Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Rest day */}
      {user && !loading && routine && today?.isRestDay && (
        <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border py-16 text-center">
          <Moon className="text-muted-foreground size-8" />
          <p className="text-lg font-semibold">Rest Day</p>
          <p className="text-muted-foreground text-sm">
            Enjoy your recovery — {todayName} is a rest day.
          </p>
        </div>
      )}

      {/* Workout table */}
      {user && !loading && routine && today && !today.isRestDay && (
        <div className="border-border bg-card rounded-xl border">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold">
              {today.label || todayName}
            </h2>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Clock className="size-4" />
              <span>Rest: {today.restMinutes} min</span>
            </div>
          </div>

          {today.exercises.length === 0 ? (
            <p className="text-muted-foreground px-5 py-8 text-center text-sm">
              No exercises set for {todayName} yet.
            </p>
          ) : (
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
                  {today.exercises.map((exercise, index) => (
                    <tr
                      key={exercise.id}
                      className={
                        index < today.exercises.length - 1
                          ? "border-border border-b"
                          : ""
                      }
                    >
                      <td className="px-5 py-3.5 font-medium">
                        {exercise.name}
                      </td>
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
          )}
        </div>
      )}

      {/* Workout Notes (still local — saved to the database in a later step) */}
      {user && !loading && routine && !today?.isRestDay && (
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
      )}
    </div>
  );
}
