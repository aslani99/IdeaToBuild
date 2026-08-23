import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getDirection } from "@i18n/localeMetadata";

export default function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = getDirection(i18n.language);
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <main>
      <h1>{t("app.name")}</h1>
      <p>Phase 0 — foundation scaffold. See docs/ROADMAP.md for what's next.</p>
    </main>
  );
}
