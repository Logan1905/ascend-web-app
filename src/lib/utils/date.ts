import {
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";

/**
 * Date helpers for the global date selection system.
 *
 * The app works with a single "selected date" that every main tab reads from.
 * Dates are passed around as `Date` objects normalised to midnight local time,
 * and persisted as `YYYY-MM-DD` strings so timezone shifts can't move them.
 */

/** How far back the user may look: one month before their account was created. */
export const PAST_MONTHS_FROM_SIGNUP = 1;

/** How far ahead the user may plan, relative to today. */
export const FUTURE_MONTHS_FROM_TODAY = 3;

/** Midnight today, local time. */
export function today(): Date {
  return startOfDay(new Date());
}

/** Serialises a date to `YYYY-MM-DD` using local calendar values. */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parses a `YYYY-MM-DD` string as local midnight (never UTC). */
export function fromISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

/**
 * Earliest date the user may select, derived from their account creation date.
 *
 * Accepts either a full timestamp (what Supabase returns) or a bare
 * `YYYY-MM-DD`. The bare form is read as a local calendar day — `new Date()`
 * would treat it as UTC midnight and shift it back a day west of Greenwich.
 */
export function getMinSelectableDate(accountCreatedAt: string | null): Date {
  if (!accountCreatedAt) return addMonths(today(), -PAST_MONTHS_FROM_SIGNUP);

  const dateOnly = fromISODate(accountCreatedAt);
  const created = dateOnly ?? startOfDay(new Date(accountCreatedAt));
  const base = Number.isNaN(created.getTime()) ? today() : created;

  return addMonths(base, -PAST_MONTHS_FROM_SIGNUP);
}

/** Latest date the user may select: three months from today, rolling daily. */
export function getMaxSelectableDate(): Date {
  return addMonths(today(), FUTURE_MONTHS_FROM_TODAY);
}

/** True when `date` sits inside the allowed selection window (inclusive). */
export function isDateSelectable(date: Date, min: Date, max: Date): boolean {
  const day = startOfDay(date);
  return !isBefore(day, startOfDay(min)) && !isAfter(day, startOfDay(max));
}

/** Header label: "Today" for the current day, otherwise "August 6, 2026". */
export function formatSelectedDate(date: Date): string {
  return isSameDay(date, today()) ? "Today" : format(date, "MMMM d, yyyy");
}

/** Month heading for the calendar, e.g. "August 2026". */
export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy");
}

/**
 * Builds the calendar grid for a month: leading nulls pad the row so the first
 * of the month lands under the correct weekday (Sunday-first).
 */
export function buildMonthGrid(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  const leading: Array<Date | null> = Array.from(
    { length: firstWeekday },
    () => null,
  );

  const days: Array<Date | null> = Array.from(
    { length: totalDays },
    (_, i) => new Date(year, monthIndex, i + 1),
  );

  return [...leading, ...days];
}

export { isSameDay, addMonths, startOfDay };
