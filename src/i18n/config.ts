import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@i18n/locales/en/common.json";
import fa from "@i18n/locales/fa/common.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    fa: { common: fa },
  },
  lng: "en",
  fallbackLng: false, // per master spec Section 52: missing keys must NOT silently fall back to English in dev
  defaultNS: "common",
  interpolation: { escapeValue: false },
  parseMissingKeyHandler: (key) => `MISSING_TRANSLATION: ${key}`,
});

export default i18n;
