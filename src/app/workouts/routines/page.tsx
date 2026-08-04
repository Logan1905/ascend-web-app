"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check, Moon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import {
  deleteRoutine,
  fetchRoutines,
  setActiveRoutine,
} from "@/lib/supabase/routines";
import { DAYS_OF_WEEK, type Routine } from "@/types/routine";

export default function RoutinesPage() {
  const { user, loading: authLoading } = useAuth();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoutines(await fetchRoutines());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRoutines();
        if (!cancelled) setRoutines(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load routines.",
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

  async function handleSetActive(routineId: string) {
    setBusyId(routineId);
    setError(null);
    try {
      await setActiveRoutine(routineId);
      setRoutines((prev) =>
        prev.map((r) => ({ ...r, isActive: r.id === routineId })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not change the routine.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(routine: Routine) {
    if (!window.confirm(`Delete "${routine.name}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(routine.id);
    setError(null);
    try {
      await deleteRoutine(routine.id);
      await loadRoutines();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the routine.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
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
        {user && (
          <Link href="/workouts/routines/new">
            <Button size="sm" className="shrink-0 gap-1.5">
              <Plus className="size-4" />
              Add Routine
            </Button>
          </Link>
        )}
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
            Sign in to create and save your routines.
          </p>
          <Link href="/profile">
            <Button size="sm">Go to Sign In</Button>
          </Link>
        </div>
      )}

      {/* Loading */}
      {(authLoading || (user && loading)) && (
        <p className="text-muted-foreground text-sm">Loading routines…</p>
      )}

      {/* Empty */}
      {user && !loading && routines.length === 0 && !error && (
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            No routines yet. Create one to get started!
          </p>
          <Link href="/workouts/routines/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Routine
            </Button>
          </Link>
        </div>
      )}

      {/* Routines list */}
      {user && !loading && routines.length > 0 && (
        <div className="space-y-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`bg-card rounded-xl border p-4 transition-colors ${
                routine.isActive ? "border-primary" : "border-border"
              }`}
            >
              {/* Top row: active toggle + name + delete */}
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={() => handleSetActive(routine.id)}
                  disabled={routine.isActive || busyId === routine.id}
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    routine.isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 hover:border-primary"
                  }`}
                  aria-label={
                    routine.isActive
                      ? "Currently active routine"
                      : `Set ${routine.name} as active`
                  }
                >
                  {routine.isActive && <Check className="size-4" />}
                </button>

                <h2 className="flex-1 text-base font-semibold">
                  {routine.name}
                </h2>

                {routine.isActive && (
                  <span className="text-primary text-xs font-medium">
                    Active
                  </span>
                )}

                <button
                  onClick={() => handleDelete(routine)}
                  disabled={busyId === routine.id}
                  className="text-destructive hover:bg-destructive/10 rounded-md p-1.5 transition-colors disabled:opacity-50"
                  aria-label={`Delete ${routine.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Week grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map(({ value, short }) => {
                  const day = routine.days.find((d) => d.dayOfWeek === value);
                  return (
                    <div
                      key={value}
                      className="bg-muted/50 flex flex-col items-center rounded-lg px-1 py-2"
                    >
                      <span className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                        {short}
                      </span>
                      {day?.isRestDay ? (
                        <Moon className="text-muted-foreground mt-1 size-3.5 sm:size-4" />
                      ) : (
                        <span className="mt-1 text-center text-[10px] leading-tight font-medium sm:text-xs">
                          {day?.label || "—"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
