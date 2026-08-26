import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useActiveDate } from "@application/context/ActiveDateContext";
import { formatDateInCalendar } from "@i18n/calendarFormat";
import type { CalendarSystem } from "@i18n/localeMetadata";

/**
 * The permanent, non-removable calendar control at the top of the app
 * (docs/PRODUCT_SPEC.md, CAL-001). Whatever date is picked here becomes the
 * `activeDate` that every date-scoped panel (IdeasPanel today, others later)
 * reads from.
 *
 * MVP scope (documented, not hidden): uses the browser's native date input
 * to pick a day — the input itself is always Gregorian in the picker UI,
 * but the label next to it is rendered in the user's chosen calendar system
 * via Intl. A fully custom Jalali/Hijri calendar-grid widget is a follow-up
 * (see docs/ROADMAP.md) — this ships date-driven navigation correctly today
 * without blocking on building three calendar-grid UIs from scratch.
 */
export function DateNavigator() {
  const { t, i18n } = useTranslation();
  const { activeDate, setActiveDate, goToToday } = useActiveDate();
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>("gregorian");

  return (
    <div className="date-navigator">
      <label>
        {t("calendar.jumpToDate", { defaultValue: "Go to date" })}
        <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} />
      </label>

      <select value={calendarSystem} onChange={(e) => setCalendarSystem(e.target.value as CalendarSystem)}>
        <option value="gregorian">{t("calendar.gregorian", { defaultValue: "Gregorian" })}</option>
        <option value="jalali">{t("calendar.jalali", { defaultValue: "Jalali (Shamsi)" })}</option>
        <option value="hijri">{t("calendar.hijri", { defaultValue: "Hijri (Qamari)" })}</option>
      </select>

      <span className="date-navigator-label">{formatDateInCalendar(activeDate, calendarSystem, i18n.language)}</span>

      <button onClick={goToToday}>{t("calendar.today", { defaultValue: "Today" })}</button>
    </div>
  );
}
