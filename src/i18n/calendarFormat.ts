import type { CalendarSystem } from "@i18n/localeMetadata";

/**
 * Converts our internal calendar-system names to the Intl.DateTimeFormat
 * `-u-ca-` extension values. Dates are ALWAYS stored/queried as plain
 * Gregorian ISO strings (YYYY-MM-DD) — see docs/DATABASE.md, entry_date.
 * Only the on-screen label changes with the user's chosen calendar system;
 * this keeps every date comparison/sort in the codebase and database
 * unambiguous regardless of display preference (AD-009).
 */
const INTL_CALENDAR_ID: Record<CalendarSystem, string> = {
  gregorian: "gregory",
  jalali: "persian",
  hijri: "islamic",
};

/** Formats a plain ISO date (YYYY-MM-DD) as a human-readable string in the given calendar system. */
export function formatDateInCalendar(isoDate: string, calendar: CalendarSystem, locale: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(`${locale}-u-ca-${INTL_CALENDAR_ID[calendar]}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Today's date as a plain ISO string (YYYY-MM-DD), in the user's local timezone (not UTC). */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
