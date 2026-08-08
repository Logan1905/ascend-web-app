"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { useSelectedDate } from "@/components/providers/date-provider";
import { DatePickerModal } from "@/components/shared/date-picker-modal";
import { formatSelectedDate } from "@/lib/utils/date";

/**
 * The global date strip shown at the top of the main tabs.
 * Label on one side, calendar trigger on the other.
 */
export function DateBar() {
  const { selectedDate, isToday } = useSelectedDate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold tracking-tight sm:text-xl">
            {formatSelectedDate(selectedDate)}
          </p>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open calendar to change the date"
            className="border-border hover:bg-accent relative rounded-lg border p-2 transition-colors"
          >
            <CalendarDays className="size-5" />
            {/* Dot hints that a non-current date is active. */}
            {!isToday && (
              <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <DatePickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
