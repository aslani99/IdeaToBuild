import { useTranslation } from "react-i18next";

/**
 * Shown when a guest attempts an action that requires persistent storage
 * (master spec Section 22 — guests are never forced to log in immediately,
 * but are prompted when they try to save).
 */
export function GuestBanner({ onSignIn, onCreateAccount }: { onSignIn: () => void; onCreateAccount: () => void }) {
  const { t } = useTranslation();

  return (
    <div role="status" className="guest-banner">
      <p>{t("auth.guestBannerMessage")}</p>
      <button onClick={onCreateAccount}>{t("auth.createAccount")}</button>
      <button onClick={onSignIn}>{t("auth.signIn")}</button>
    </div>
  );
}
