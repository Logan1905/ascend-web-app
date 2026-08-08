"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  fromISODate,
  getMaxSelectableDate,
  getMinSelectableDate,
  isDateSelectable,
  isSameDay,
  today,
  toISODate,
} from "@/lib/utils/date";

/**
 * Holds the single "selected date" that every main tab reads from.
 *
 * The value survives client-side navigation because the provider sits above the
 * router, and survives a full page reload because it is mirrored into
 * sessionStorage.
 */

interface DateContextValue {
  /** The active date, normalised to local midnight. */
  selectedDate: Date;
  /** True when the selected date is the current day. */
  isToday: boolean;
  /** Earliest selectable date (one month before the account was created). */
  minDate: Date;
  /** Latest selectable date (three months from today). */
  maxDate: Date;
  /** Selects a date. Ignored when the date falls outside the allowed window. */
  selectDate: (date: Date) => void;
  /** Jumps back to the current day. */
  resetToToday: () => void;
  /** Whether a given date can be selected right now. */
  canSelect: (date: Date) => boolean;
}

const DateContext = createContext<DateContextValue | undefined>(undefined);

const STORAGE_KEY = "ascend_selected_date";

/** Reads the persisted date on first render so a refresh keeps the selection. */
function getInitialDate(): Date {
  if (typeof window === "undefined") return today();

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return today();
    return fromISODate(stored) ?? today();
  } catch {
    return today();
  }
}

export function DateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);

  const accountCreatedAt = user?.created_at ?? null;

  const minDate = useMemo(
    () => getMinSelectableDate(accountCreatedAt),
    [accountCreatedAt],
  );

  // Recomputed on every render of the provider so the window rolls with the day.
  const maxDate = useMemo(() => getMaxSelectableDate(), []);

  const canSelect = useCallback(
    (date: Date) => isDateSelectable(date, minDate, maxDate),
    [minDate, maxDate],
  );

  const selectDate = useCallback(
    (date: Date) => {
      if (!isDateSelectable(date, minDate, maxDate)) return;

      const normalised = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      setSelectedDate(normalised);
      try {
        sessionStorage.setItem(STORAGE_KEY, toISODate(normalised));
      } catch {
        // Storage can be unavailable in private modes — selection still works.
      }
    },
    [minDate, maxDate],
  );

  const resetToToday = useCallback(() => {
    const now = today();
    setSelectedDate(now);
    try {
      sessionStorage.setItem(STORAGE_KEY, toISODate(now));
    } catch {
      // Non-fatal.
    }
  }, []);

  const value = useMemo<DateContextValue>(
    () => ({
      selectedDate,
      isToday: isSameDay(selectedDate, today()),
      minDate,
      maxDate,
      selectDate,
      resetToToday,
      canSelect,
    }),
    [selectedDate, minDate, maxDate, selectDate, resetToToday, canSelect],
  );

  return <DateContext value={value}>{children}</DateContext>;
}

export function useSelectedDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useSelectedDate must be used within a DateProvider");
  }
  return context;
}
