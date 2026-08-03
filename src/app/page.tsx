"use client";

import { Droplets, Flame, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Static data ---

const userName = "Logan";
const dailyCalorieGoal = 2200;
const dailyCaloriesConsumed = 1845;
const dailyWaterGoal = 8; // glasses
const dailyWaterConsumed = 5;
const userGoal: "loss" | "gain" = "loss";

const weeklyCalories = [
  { day: "Mon", calories: 2100 },
  { day: "Tue", calories: 1950 },
  { day: "Wed", calories: 2300 },
  { day: "Thu", calories: 2050 },
  { day: "Fri", calories: 1900 },
  { day: "Sat", calories: 2400 },
  { day: "Sun", calories: 1845 },
];

const weightData = [
  { week: "W1", weight: 185 },
  { week: "W2", weight: 184.2 },
  { week: "W3", weight: 183.5 },
  { week: "W4", weight: 183.1 },
  { week: "W5", weight: 182.4 },
  { week: "W6", weight: 181.8 },
  { week: "W7", weight: 181.2 },
  { week: "W8", weight: 180.5 },
];

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getCaloriePercentage(): number {
  return Math.round((dailyCaloriesConsumed / dailyCalorieGoal) * 100);
}

function getWaterPercentage(): number {
  return Math.round((dailyWaterConsumed / dailyWaterGoal) * 100);
}

// --- Component ---

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your fitness overview for today.
        </p>
      </div>

      {/* Daily Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Calories Card */}
        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Flame className="size-5 text-orange-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Calories Consumed</p>
              <p className="text-xl font-bold">
                {dailyCaloriesConsumed}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / {dailyCalorieGoal} kcal
                </span>
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="bg-muted mt-4 h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${Math.min(getCaloriePercentage(), 100)}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {getCaloriePercentage()}% of daily goal
          </p>
        </div>

        {/* Water Card */}
        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Droplets className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Water Intake</p>
              <p className="text-xl font-bold">
                {dailyWaterConsumed}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / {dailyWaterGoal} glasses
                </span>
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="bg-muted mt-4 h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(getWaterPercentage(), 100)}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {getWaterPercentage()}% of daily goal
          </p>
        </div>
      </div>

      {/* Weekly Calories Chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h2 className="mb-4 text-base font-semibold">
          Weekly Calories Overview
        </h2>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCalories}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              />
              <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Progress Chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="size-5 text-green-500" />
          <h2 className="text-base font-semibold">
            Weight {userGoal === "loss" ? "Loss" : "Gain"} Progress
          </h2>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData}>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              />
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
        <p className="text-muted-foreground mt-2 text-xs">
          Started at {weightData[0].weight} lbs — current{" "}
          {weightData[weightData.length - 1].weight} lbs (
          {(
            weightData[0].weight - weightData[weightData.length - 1].weight
          ).toFixed(1)}{" "}
          lbs lost)
        </p>
      </div>
    </div>
  );
}
