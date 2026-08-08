"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Calendar,
  Target,
  Flame,
  CalendarDays,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/components/providers/profile-provider";
import { OnboardingWizard } from "@/components/shared/onboarding-wizard";
import { ToastModal } from "@/components/shared/toast-modal";
import {
  addWeightEntry,
  fetchUserProfile,
  fetchWeightEntries,
  saveUserProfile,
  updateWeightUnit,
} from "@/lib/supabase/profile";
import { parseWeightInput } from "@/schemas/profile";
import {
  fromLbs,
  getGoalLabel,
  getGraphMode,
  getGraphTitle,
  goalNeedsTargetWeight,
  toLbs,
  type GraphMode,
  type UserProfile,
  type UserProfileDraft,
  type WeightEntry,
  type WeightUnit,
} from "@/types/profile";

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Chart + calendar accent. Neutral goals get an uncoloured slate tone. */
const ACCENT: Record<GraphMode, string> = {
  gain: "#22c55e",
  loss: "#22c55e",
  neutral: "#64748b",
};

/** Parses a YYYY-MM-DD date string as a local date (avoids UTC drift). */
function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** True when a day-over-day change moves the user toward their goal. */
function isOnTrack(change: number, mode: GraphMode): boolean {
  if (mode === "gain") return change >= 0;
  if (mode === "loss") return change <= 0;
  return true;
}

// --- Custom Tooltip ---

interface TooltipPayload {
  value: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  unit?: string;
}
function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-popover rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

// --- Component ---

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshSharedProfile } = useProfile();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [unit, setUnit] = useState<WeightUnit>("lbs");
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackWeight, setTrackWeight] = useState("");
  const [trackUnit, setTrackUnit] = useState<WeightUnit>("lbs");
  const [savingWeight, setSavingWeight] = useState(false);
  const [chartRange, setChartRange] = useState<"days" | "weeks" | "months">(
    "days",
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message?: string;
  } | null>(null);

  const load = useCallback(async () => {
    const [nextProfile, nextEntries] = await Promise.all([
      fetchUserProfile(),
      fetchWeightEntries(),
    ]);
    setProfile(nextProfile);
    setEntries(nextEntries);
    if (nextProfile) setUnit(nextProfile.weightUnit);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    // Wrapped in an async IIFE: React 19 forbids setState in an effect body.
    void (async () => {
      try {
        if (!user) {
          if (!cancelled) {
            setProfile(null);
            setEntries([]);
          }
          return;
        }
        await load();
        if (!cancelled) setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Could not load your progress.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, load]);

  function handleUnitChange(next: WeightUnit) {
    setUnit(next);
    if (profile) {
      setProfile({ ...profile, weightUnit: next });
      void updateWeightUnit(next).catch(() => {
        // Display preference only — not worth interrupting the user.
      });
    }
  }

  async function handleOnboardingComplete(draft: UserProfileDraft) {
    await saveUserProfile(draft);
    await load();
    // Keep the app-wide copy (and trackWorkouts) current.
    await refreshSharedProfile();
    setToast({
      type: "success",
      title: "You're all set!",
      message: "Your progress is ready to track.",
    });
  }

  async function handleTrackSave() {
    const value = parseWeightInput(trackWeight);
    if (value === null) return;

    setSavingWeight(true);
    try {
      await addWeightEntry(toLbs(value, trackUnit));
      await load();
      setShowTrackModal(false);
      setToast({ type: "success", title: "Weight logged" });
    } catch (err) {
      setToast({
        type: "error",
        title: "Could not save",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingWeight(false);
    }
  }

  // --- Derived data ---

  /** Works for absolute weights and deltas alike — lbs/kg is a pure ratio. */
  const convert = useCallback((lbs: number) => fromLbs(lbs, unit), [unit]);

  const graphMode: GraphMode = profile ? getGraphMode(profile.goal) : "neutral";

  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const now = new Date();

    if (chartRange === "days") {
      // Last 30 days of entries, one point per day
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return entries
        .filter((e) => parseISODate(e.loggedOn) >= cutoff)
        .map((entry) => ({
          label: shortDate(entry.loggedOn),
          weight: fromLbs(entry.weightLbs, unit),
        }));
    }

    if (chartRange === "weeks") {
      // Group entries by ISO week, average each week
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 12 * 7); // ~12 weeks
      const filtered = entries.filter(
        (e) => parseISODate(e.loggedOn) >= cutoff,
      );
      const weekMap = new Map<string, number[]>();
      for (const entry of filtered) {
        const d = parseISODate(entry.loggedOn);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        const existing = weekMap.get(key) ?? [];
        existing.push(entry.weightLbs);
        weekMap.set(key, existing);
      }
      return [...weekMap.entries()].map(([label, weights]) => ({
        label,
        weight: fromLbs(
          weights.reduce((a, b) => a + b, 0) / weights.length,
          unit,
        ),
      }));
    }

    // months — average per month
    const monthMap = new Map<string, number[]>();
    for (const entry of entries) {
      const d = parseISODate(entry.loggedOn);
      const key = d.toLocaleString(undefined, {
        month: "short",
        year: "2-digit",
      });
      const existing = monthMap.get(key) ?? [];
      existing.push(entry.weightLbs);
      monthMap.set(key, existing);
    }
    return [...monthMap.entries()].map(([label, weights]) => ({
      label,
      weight: fromLbs(
        weights.reduce((a, b) => a + b, 0) / weights.length,
        unit,
      ),
    }));
  }, [entries, unit, chartRange]);

  /** Day-of-month -> logged weight + change vs the previous entry. */
  const calendarData = useMemo(() => {
    const now = new Date();
    const map = new Map<number, { weightLbs: number; change: number }>();

    entries.forEach((entry, index) => {
      const date = parseISODate(entry.loggedOn);
      if (
        date.getMonth() !== now.getMonth() ||
        date.getFullYear() !== now.getFullYear()
      ) {
        return;
      }
      const previous = entries[index - 1];
      map.set(date.getDate(), {
        weightLbs: entry.weightLbs,
        change: previous ? entry.weightLbs - previous.weightLbs : 0,
      });
    });

    return map;
  }, [entries]);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString(undefined, { month: "long" });
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, today.getMonth(), 1).getDay();

  const loggedDays = calendarData.size;
  const onTrackDays = [...calendarData.values()].filter((d) =>
    isOnTrack(d.change, graphMode),
  ).length;
  const consistencyPercent =
    loggedDays > 0 ? Math.round((onTrackDays / loggedDays) * 100) : 0;
  const weeksTracked = Math.max(1, Math.ceil(currentDay / 7));

  /** Change since the first entry logged this month. */
  const monthlyChange = useMemo(() => {
    const monthEntries = [...calendarData.entries()].sort(
      (a, b) => a[0] - b[0],
    );
    if (monthEntries.length < 2 || !profile) return 0;
    const first = monthEntries[0][1].weightLbs;
    const last = monthEntries[monthEntries.length - 1][1].weightLbs;
    return last - first;
  }, [calendarData, profile]);

  // --- Gates ---

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-muted-foreground text-sm">Loading your progress…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="border-border bg-card rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Sign in to track progress</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your progress is saved to your account. Head to your profile to sign
            in.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="border-border bg-card rounded-xl border p-6">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.onboarded) {
    return (
      <>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
        <ToastModal
          open={toast !== null}
          type={toast?.type}
          title={toast?.title ?? ""}
          message={toast?.message}
          autoClose={2500}
          onClose={() => setToast(null)}
        />
      </>
    );
  }

  const userName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "there";

  const accent = ACCENT[graphMode];
  const showProgressBar = goalNeedsTargetWeight(profile.goal);
  const difference = profile.currentWeight - profile.startingWeight;

  const totalRange = profile.goalWeight
    ? Math.abs(profile.goalWeight - profile.startingWeight)
    : 0;
  const currentProgress = Math.abs(difference);
  const progressPercent =
    totalRange > 0
      ? Math.min(Math.round((currentProgress / totalRange) * 100), 100)
      : 0;

  const monthlyOnTrack = isOnTrack(monthlyChange, graphMode);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your progress overview. Keep pushing!
        </p>
      </div>

      {/* Goal + Current weight */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Goal
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {getGoalLabel(profile.goal, profile.goalCustom)}
            </p>
          </div>
          {/* Unit toggle */}
          <div className="border-border flex overflow-hidden rounded-lg border text-xs font-medium">
            {(["lbs", "kg"] as const).map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={`px-3 py-1.5 transition-colors ${unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-bold">
            {convert(profile.currentWeight)}
          </span>
          <span className="text-muted-foreground text-sm">{unit}</span>
          {monthlyChange !== 0 && (
            <div
              className={`ml-2 flex items-center gap-0.5 text-sm font-medium ${
                graphMode === "neutral"
                  ? "text-muted-foreground"
                  : monthlyOnTrack
                    ? "text-green-600"
                    : "text-red-500"
              }`}
            >
              {monthlyChange > 0 ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
              {convert(Math.abs(monthlyChange))} {unit} this month
            </div>
          )}
        </div>
      </div>

      {/* Track morning weight */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-semibold">Morning Weight</h2>
              {calendarData.has(currentDay) && (
                <Check className="size-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {calendarData.has(currentDay)
                ? "Successfully tracked morning weight"
                : "Track your fasted weight daily for accuracy."}
            </p>
          </div>
          <button
            onClick={() => {
              setTrackWeight("");
              setTrackUnit(unit);
              setShowTrackModal(true);
            }}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              calendarData.has(currentDay)
                ? "border-border hover:bg-accent border"
                : "bg-primary text-primary-foreground hover:bg-primary/80"
            }`}
          >
            {calendarData.has(currentDay) ? "Edit" : "Track"}
          </button>
        </div>
      </div>

      {/* Track weight modal */}
      {showTrackModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="bg-background/60 absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowTrackModal(false)}
          />
          <div className="border-border bg-card relative w-full max-w-sm rounded-xl border p-6 shadow-lg">
            <h2 className="text-xl font-bold">Track Weight</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Weigh yourself first thing in the morning for best results.
            </p>

            <div className="mt-5 flex gap-2">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={trackWeight}
                onChange={(e) => setTrackWeight(e.target.value)}
                placeholder={trackUnit === "lbs" ? "172.0" : "78.0"}
                aria-label={`Weight in ${trackUnit}`}
                className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 flex-1 rounded-lg border px-4 text-lg font-medium transition-colors outline-none focus:ring-2"
                autoFocus
              />
              <div className="border-border flex overflow-hidden rounded-lg border text-sm font-medium">
                {(["lbs", "kg"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setTrackUnit(u)}
                    className={`px-3 py-2 transition-colors ${trackUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTrackSave}
              disabled={!trackWeight || savingWeight}
              className="bg-primary text-primary-foreground hover:bg-primary/80 mt-4 h-11 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {savingWeight ? "Saving…" : "Save"}
            </button>

            <button
              onClick={() => setShowTrackModal(false)}
              className="text-muted-foreground hover:text-foreground mt-2 w-full text-center text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weight chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {graphMode === "gain" ? (
              <TrendingUp className="size-5" style={{ color: accent }} />
            ) : graphMode === "loss" ? (
              <TrendingDown className="size-5" style={{ color: accent }} />
            ) : (
              <Activity className="size-5" style={{ color: accent }} />
            )}
            <h2 className="text-base font-semibold">
              {getGraphTitle(graphMode)}
            </h2>
          </div>
          {/* Range filter */}
          {entries.length >= 3 && (
            <div className="border-border flex overflow-hidden rounded-lg border text-xs font-medium">
              {(["days", "weeks", "months"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-2.5 py-1 capitalize transition-colors ${
                    chartRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
        {entries.length < 3 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Log at least 3 days to see your progress graph.
          </p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  content={<CustomTooltip unit={unit} />}
                  cursor={false}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke={accent}
                  fill={accent}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h2 className="mb-3 text-base font-semibold">Progress Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold">
              {convert(profile.startingWeight)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Starting</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {convert(profile.currentWeight)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Current</p>
          </div>
          <div>
            <p
              className={`text-lg font-bold ${
                graphMode === "neutral" || difference === 0
                  ? ""
                  : isOnTrack(difference, graphMode)
                    ? "text-green-600"
                    : "text-red-500"
              }`}
            >
              {difference > 0 ? "+" : ""}
              {convert(difference)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Difference</p>
          </div>
        </div>

        {/* Goal progress bar (hidden for maintain / other) */}
        {showProgressBar && profile.goalWeight !== null && (
          <div className="mt-5">
            <div className="text-muted-foreground mb-1.5 flex justify-between text-[10px]">
              <span>
                {convert(profile.startingWeight)} {unit}
              </span>
              <span className="text-foreground font-medium">
                {convert(profile.currentWeight)} {unit}
              </span>
              <span>
                {convert(profile.goalWeight)} {unit}
              </span>
            </div>
            <div className="bg-muted relative h-3 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
              <Target className="size-3" />
              <span>{progressPercent}% to goal</span>
            </div>
          </div>
        )}
      </div>

      {/* Consistency */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h2 className="mb-3 text-base font-semibold">Consistency</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Flame className="size-4 text-orange-500" />
              <p className="text-lg font-bold">{consistencyPercent}%</p>
            </div>
            <p className="text-muted-foreground text-xs">
              {graphMode === "neutral" ? "Stable Days" : "On Track"}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <CalendarDays className="size-4 text-purple-500" />
              <p className="text-lg font-bold">{loggedDays}</p>
            </div>
            <p className="text-muted-foreground text-xs">Days Logged</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Calendar className="size-4 text-blue-500" />
              <p className="text-lg font-bold">{weeksTracked}</p>
            </div>
            <p className="text-muted-foreground text-xs">Weeks</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="text-muted-foreground size-5" />
          <h2 className="text-base font-semibold">
            {currentMonth} {currentYear}
          </h2>
        </div>

        {/* Day headers */}
        <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-xs font-medium">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            const dayData = calendarData.get(day);
            // Neutral goals get no good/bad colouring at all.
            const status = !dayData
              ? "none"
              : graphMode === "neutral"
                ? "logged"
                : isOnTrack(dayData.change, graphMode)
                  ? "good"
                  : "bad";

            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-between rounded-lg px-1 py-1.5 sm:py-2 ${
                  isToday
                    ? "bg-blue-500/15 ring-2 ring-blue-500"
                    : status === "good"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : status === "bad"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : status === "logged"
                          ? "bg-muted"
                          : "bg-muted/30"
                }`}
              >
                {/* Day number */}
                <span
                  className={`text-[11px] leading-none font-semibold ${
                    isToday
                      ? "text-blue-700 dark:text-blue-300"
                      : status === "good"
                        ? "text-green-700 dark:text-green-400"
                        : status === "bad"
                          ? "text-red-700 dark:text-red-400"
                          : status === "logged"
                            ? "text-foreground"
                            : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>

                {/* Status icon */}
                <div className="my-1">
                  {isToday ? (
                    <div className="size-2 rounded-full bg-blue-500" />
                  ) : status === "good" ? (
                    <Check className="size-3 text-green-600 dark:text-green-400" />
                  ) : status === "bad" ? (
                    <X className="size-3 text-red-500 dark:text-red-400" />
                  ) : status === "logged" ? (
                    <div className="bg-muted-foreground/60 size-2 rounded-full" />
                  ) : (
                    <div className="size-3" />
                  )}
                </div>

                {/* Weight change */}
                {dayData ? (
                  <span
                    className={`text-[9px] leading-none font-medium ${
                      graphMode === "neutral"
                        ? "text-muted-foreground"
                        : dayData.change >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {dayData.change > 0 ? "+" : ""}
                    {convert(dayData.change)}
                  </span>
                ) : (
                  <span className="text-[9px] leading-none text-transparent">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold">{loggedDays}</p>
            <p className="text-muted-foreground text-[10px]">Days Logged</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p
              className={`text-lg font-bold ${graphMode === "neutral" ? "" : "text-green-600"}`}
            >
              {onTrackDays}/{loggedDays}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {graphMode === "neutral" ? "Stable Days" : "Good Days"}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold">
              {monthlyChange > 0 ? "+" : ""}
              {convert(monthlyChange)} {unit}
            </p>
            <p className="text-muted-foreground text-[10px]">This Month</p>
          </div>
        </div>
      </div>

      <ToastModal
        open={toast !== null}
        type={toast?.type}
        title={toast?.title ?? ""}
        message={toast?.message}
        autoClose={2500}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
