"use client";

import { useSelectedDate } from "@/components/providers/date-provider";

/**
 * Nutrition is still a placeholder — there is no nutrition storage yet.
 *
 * It already reads the global selected date so that when logging is built it
 * has the active date to hand, and so the page never implies it is showing
 * today's data while another day is selected.
 */
export default function NutritionPage() {
  const { selectedDate, isToday } = useSelectedDate();

  const dateLabel = selectedDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Nutrition
      </h1>
      <p className="text-muted-foreground mt-2">Coming soon.</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {isToday ? "Showing today." : `Showing ${dateLabel}.`}
      </p>
    </div>
  );
}
