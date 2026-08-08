"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useSelectedDate } from "@/components/providers/date-provider";
import {
  addMonths,
  buildMonthGrid,
  formatMonthLabel,
  isSameDay,
  today,
} from "@/lib/utils/date";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface DatePickerModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Month-at-a-time calendar used purely for picking the app's active date.
 * Deliberately shows no weight, workout, or progress data.
 */
export function DatePickerModal({ open, onClose }: DatePickerModalProps) {
  const { selectedDate, minDate, maxDate, selectDate, canSelect } =
    useSelectedDate();

  // The month on screen starts on whichever month holds the selection.
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  if (!open) return null;

  const grid = buildMonthGrid(viewMonth);
  const now = today();

  // Disable the arrows once the neighbouring month is entirely out of range.
  const previousMonth = addMonths(viewMonth, -1);
  const lastDayOfPrevious = new Date(
    previousMonth.getFullYear(),
    previousMonth.getMonth() + 1,
    0,
  );
  const canGoBack = lastDayOfPrevious >= minDate;

  const nextMonth = addMonths(viewMonth, 1);
  const firstDayOfNext = new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth(),
    1,
  );
  const canGoForward = firstDayOfNext <= maxDate;

  function handleSelect(date: Date) {
    selectDate(date);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:items-center">
      <div
        className="bg-background/60 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="border-border bg-card relative mt-16 w-full max-w-sm rounded-xl border p-5 shadow-lg sm:mt-0">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Select a date</h2>
          <button
            onClick={onClose}
            aria-label="Close calendar"
            className="text-muted-foreground hover:text-foreground rounded-md p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setViewMonth(previousMonth)}
            disabled={!canGoBack}
            aria-label="Previous month"
            className="text-primary hover:bg-accent rounded-md p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-sm font-semibold">{formatMonthLabel(viewMonth)}</p>
          <button
            onClick={() => setViewMonth(nextMonth)}
            disabled={!canGoForward}
            aria-label="Next month"
            className="text-primary hover:bg-accent rounded-md p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-xs font-medium">
          {WEEKDAYS.map((day, i) => (
            <div key={`${day}-${i}`} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} />;

            const selectable = canSelect(date);
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentDay = isSameDay(date, now);

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleSelect(date)}
                disabled={!selectable}
                aria-label={date.toDateString()}
                aria-current={isSelected ? "date" : undefined}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : !selectable
                      ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed line-through"
                      : isCurrentDay
                        ? "bg-blue-500/15 text-blue-700 ring-2 ring-blue-500 dark:text-blue-300"
                        : "hover:bg-accent"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="text-muted-foreground mt-4 flex items-center justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary size-2.5 rounded-full" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-2 ring-blue-500 ring-inset" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-muted/40 size-2.5 rounded-full" />
            Unavailable
          </span>
        </div>
      </div>
    </div>
  );
}
