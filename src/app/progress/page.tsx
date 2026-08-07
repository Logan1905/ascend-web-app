"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Calendar,
  Target,
  Flame,
  Dumbbell,
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

// --- Static data ---

const userName = "Logan";
const userGoal:
  "build muscle" | "lose weight" | "maintain weight" | "gain weight" =
  "build muscle";
const startingWeight = 165; // in lbs
const currentWeight = 172; // in lbs
const goalWeight = 185; // in lbs
const monthlyChange = 2.4; // lbs gained this month

const weightProgress = [
  { week: "W1", weight: 165 },
  { week: "W2", weight: 165.8 },
  { week: "W3", weight: 166.5 },
  { week: "W4", weight: 167.2 },
  { week: "W5", weight: 168.0 },
  { week: "W6", weight: 169.1 },
  { week: "W7", weight: 170.5 },
  { week: "W8", weight: 171.0 },
  { week: "W9", weight: 172.0 },
];

// Calendar data with daily weight changes (in lbs)
const calendarData: Record<
  number,
  { status: "green" | "red"; weightChange: number }
> = {
  1: { status: "green", weightChange: 0.2 },
  2: { status: "green", weightChange: 0.1 },
  3: { status: "red", weightChange: -0.3 },
  4: { status: "green", weightChange: 0.4 },
  5: { status: "green", weightChange: 0.1 },
  6: { status: "green", weightChange: 0.2 },
  7: { status: "red", weightChange: -0.5 },
  8: { status: "green", weightChange: 0.3 },
  9: { status: "green", weightChange: 0.1 },
  10: { status: "green", weightChange: 0.2 },
  11: { status: "red", weightChange: -0.2 },
  12: { status: "green", weightChange: 0.3 },
  13: { status: "green", weightChange: 0.1 },
  14: { status: "green", weightChange: 0.4 },
  15: { status: "green", weightChange: 0.2 },
  16: { status: "red", weightChange: -0.4 },
  17: { status: "green", weightChange: 0.3 },
  18: { status: "green", weightChange: 0.1 },
  19: { status: "green", weightChange: 0.2 },
  20: { status: "green", weightChange: 0.1 },
  21: { status: "green", weightChange: 0.3 },
  22: { status: "green", weightChange: 0.2 },
  23: { status: "red", weightChange: -0.3 },
  24: { status: "green", weightChange: 0.4 },
  25: { status: "green", weightChange: 0.1 },
  26: { status: "green", weightChange: 0.2 },
  27: { status: "green", weightChange: 0.3 },
  28: { status: "green", weightChange: 0.1 },
  29: { status: "green", weightChange: 0.2 },
  30: { status: "green", weightChange: 0.1 },
  31: { status: "green", weightChange: 0.2 },
};

const today = new Date();
const currentDay = today.getDate();
const currentMonth = today.toLocaleString("default", { month: "long" });
const currentYear = today.getFullYear();
const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
const firstDayOfWeek = new Date(currentYear, today.getMonth(), 1).getDay();

const totalActiveDays = Object.keys(calendarData).length;
const greenDays = Object.values(calendarData).filter(
  (v) => v.status === "green",
).length;
const consistencyPercent = Math.round((greenDays / totalActiveDays) * 100);
const workoutsThisMonth = 18;
const weeksCompleted = 4;

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function toLbs(lbs: number) {
  return lbs;
}
function toKg(lbs: number) {
  return +(lbs * 0.4536).toFixed(1);
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
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackWeight, setTrackWeight] = useState("");
  const [trackUnit, setTrackUnit] = useState<"lbs" | "kg">("lbs");

  const convert = (lbs: number) => (unit === "kg" ? toKg(lbs) : toLbs(lbs));
  const convertChange = (lbs: number) =>
    unit === "kg" ? +(lbs * 0.4536).toFixed(1) : +lbs.toFixed(1);
  const isGaining = userGoal === "build muscle" || userGoal === "gain weight";
  const showProgressBar = userGoal !== "maintain weight";
  const difference = currentWeight - startingWeight;

  // Progress bar calculation
  const totalRange = Math.abs(goalWeight - startingWeight);
  const currentProgress = Math.abs(currentWeight - startingWeight);
  const progressPercent =
    totalRange > 0
      ? Math.min(Math.round((currentProgress / totalRange) * 100), 100)
      : 0;

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
            <p className="mt-0.5 text-sm font-semibold capitalize">
              {userGoal}
            </p>
          </div>
          {/* Unit toggle */}
          <div className="border-border flex overflow-hidden rounded-lg border text-xs font-medium">
            <button
              onClick={() => setUnit("lbs")}
              className={`px-3 py-1.5 transition-colors ${unit === "lbs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              lbs
            </button>
            <button
              onClick={() => setUnit("kg")}
              className={`px-3 py-1.5 transition-colors ${unit === "kg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              kg
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{convert(currentWeight)}</span>
          <span className="text-muted-foreground text-sm">{unit}</span>
          <div
            className={`ml-2 flex items-center gap-0.5 text-sm font-medium ${isGaining ? "text-green-600" : monthlyChange > 0 ? "text-red-500" : "text-green-600"}`}
          >
            {monthlyChange > 0 ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ArrowDown className="size-3.5" />
            )}
            {convertChange(Math.abs(monthlyChange))} {unit} this month
          </div>
        </div>
      </div>

      {/* Track morning weight */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Morning Weight</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Track your fasted weight daily for accuracy.
            </p>
          </div>
          <button
            onClick={() => {
              setTrackWeight("");
              setTrackUnit(unit);
              setShowTrackModal(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Track
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
                value={trackWeight}
                onChange={(e) => setTrackWeight(e.target.value)}
                placeholder={trackUnit === "lbs" ? "172.0" : "78.0"}
                className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 flex-1 rounded-lg border px-4 text-lg font-medium transition-colors outline-none focus:ring-2"
                autoFocus
              />
              <div className="border-border flex overflow-hidden rounded-lg border text-sm font-medium">
                <button
                  onClick={() => setTrackUnit("lbs")}
                  className={`px-3 py-2 transition-colors ${trackUnit === "lbs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                  lbs
                </button>
                <button
                  onClick={() => setTrackUnit("kg")}
                  className={`px-3 py-2 transition-colors ${trackUnit === "kg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                  kg
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: save to database later
                setShowTrackModal(false);
              }}
              disabled={!trackWeight}
              className="bg-primary text-primary-foreground hover:bg-primary/80 mt-4 h-11 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Save
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
        <div className="mb-4 flex items-center gap-2">
          {isGaining ? (
            <TrendingUp className="size-5 text-green-500" />
          ) : (
            <TrendingDown className="size-5 text-green-500" />
          )}
          <h2 className="text-base font-semibold">
            Weight {isGaining ? "Gain" : "Loss"} Progress
          </h2>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weightProgress.map((d) => ({
                ...d,
                weight: convert(d.weight),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip unit={unit} />} cursor={false} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h2 className="mb-3 text-base font-semibold">Progress Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold">
              {convert(startingWeight)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Starting</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {convert(currentWeight)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Current</p>
          </div>
          <div>
            <p
              className={`text-lg font-bold ${difference > 0 ? (isGaining ? "text-green-600" : "text-red-500") : isGaining ? "text-red-500" : "text-green-600"}`}
            >
              {difference > 0 ? "+" : ""}
              {convertChange(difference)}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {unit}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">Difference</p>
          </div>
        </div>

        {/* Progress bar (only if not maintaining) */}
        {showProgressBar && (
          <div className="mt-5">
            <div className="text-muted-foreground mb-1.5 flex justify-between text-[10px]">
              <span>
                {convert(startingWeight)} {unit}
              </span>
              <span className="text-foreground font-medium">
                {convert(currentWeight)} {unit}
              </span>
              <span>
                {convert(goalWeight)} {unit}
              </span>
            </div>
            <div className="bg-muted relative h-3 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progressPercent}%` }}
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
            <p className="text-muted-foreground text-xs">Success Rate</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Dumbbell className="size-4 text-purple-500" />
              <p className="text-lg font-bold">{workoutsThisMonth}</p>
            </div>
            <p className="text-muted-foreground text-xs">Workouts</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Calendar className="size-4 text-blue-500" />
              <p className="text-lg font-bold">{weeksCompleted}</p>
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
            const dayData = calendarData[day];
            const wChange = dayData
              ? convertChange(dayData.weightChange)
              : null;

            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-between rounded-lg px-1 py-1.5 sm:py-2 ${
                  isToday
                    ? "bg-blue-500/15 ring-2 ring-blue-500"
                    : dayData?.status === "green"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : dayData?.status === "red"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-muted/30"
                }`}
              >
                {/* Day number */}
                <span
                  className={`text-[11px] leading-none font-semibold ${
                    isToday
                      ? "text-blue-700 dark:text-blue-300"
                      : dayData?.status === "green"
                        ? "text-green-700 dark:text-green-400"
                        : dayData?.status === "red"
                          ? "text-red-700 dark:text-red-400"
                          : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>

                {/* Status icon */}
                <div className="my-1">
                  {isToday ? (
                    <div className="size-2 rounded-full bg-blue-500" />
                  ) : dayData?.status === "green" ? (
                    <Check className="size-3 text-green-600 dark:text-green-400" />
                  ) : dayData?.status === "red" ? (
                    <X className="size-3 text-red-500 dark:text-red-400" />
                  ) : (
                    <div className="size-3" />
                  )}
                </div>

                {/* Weight change */}
                {wChange !== null ? (
                  <span
                    className={`text-[9px] leading-none font-medium ${(dayData?.weightChange ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                  >
                    {(dayData?.weightChange ?? 0) >= 0 ? "+" : ""}
                    {wChange}
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
            <p className="text-lg font-bold">{totalActiveDays}</p>
            <p className="text-muted-foreground text-[10px]">Active Days</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold text-green-600">
              {greenDays}/{daysInMonth}
            </p>
            <p className="text-muted-foreground text-[10px]">Green Days</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold">
              {monthlyChange > 0 ? "+" : ""}
              {convertChange(monthlyChange)} {unit}
            </p>
            <p className="text-muted-foreground text-[10px]">This Month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
