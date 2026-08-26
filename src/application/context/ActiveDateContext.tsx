import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { todayIsoDate } from "@i18n/calendarFormat";

/**
 * The "Active Date" is the single source of truth for what day the whole
 * app is currently showing (docs/PRODUCT_SPEC.md, CAL-001; docs/DECISIONS.md,
 * AD-009). Every screen that lists date-scoped records (Ideas today, Notes
 * later, Files later) reads from here rather than keeping its own notion of
 * "today". Defaults to the real today's date on load.
 */
interface ActiveDateContextValue {
  activeDate: string; // plain ISO date (YYYY-MM-DD)
  setActiveDate: (isoDate: string) => void;
  goToToday: () => void;
}

const ActiveDateContext = createContext<ActiveDateContextValue | null>(null);

export function ActiveDateProvider({ children }: { children: ReactNode }) {
  const [activeDate, setActiveDate] = useState<string>(todayIsoDate());

  const value = useMemo<ActiveDateContextValue>(
    () => ({
      activeDate,
      setActiveDate,
      goToToday: () => setActiveDate(todayIsoDate()),
    }),
    [activeDate]
  );

  return <ActiveDateContext.Provider value={value}>{children}</ActiveDateContext.Provider>;
}

export function useActiveDate(): ActiveDateContextValue {
  const ctx = useContext(ActiveDateContext);
  if (!ctx) throw new Error("useActiveDate must be used within an ActiveDateProvider");
  return ctx;
}
