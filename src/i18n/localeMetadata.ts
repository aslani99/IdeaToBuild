/**
 * Locale metadata — direction and calendar are driven from HERE, never from
 * hardcoded `if (lang === "fa")` checks scattered in the app
 * (see master spec Section 56, RTL-001 in docs/REQUIREMENTS_TRACEABILITY.md).
 */
export type TextDirection = "ltr" | "rtl";
export type CalendarSystem = "gregorian" | "jalali";

export interface LocaleMetadata {
  code: string;
  direction: TextDirection;
  calendar: CalendarSystem;
  translationStatus: "complete" | "in_review" | "partial" | "experimental";
}

export const localeMetadata: Record<string, LocaleMetadata> = {
  en: { code: "en", direction: "ltr", calendar: "gregorian", translationStatus: "complete" },
  fa: { code: "fa", direction: "rtl", calendar: "jalali", translationStatus: "in_review" },
};

export function getDirection(locale: string): TextDirection {
  return localeMetadata[locale]?.direction ?? "ltr";
}
