import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDirection } from "@i18n/localeMetadata";
import { useAuth } from "@application/hooks/useAuth";
import { GuestBanner } from "@presentation/components/GuestBanner";
import { SignInPage } from "@presentation/pages/SignInPage";
import { SignUpPage } from "@presentation/pages/SignUpPage";

type Screen = "guest-banner" | "sign-in" | "sign-up" | "dashboard";

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, continueAsGuest, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>("guest-banner");

  useEffect(() => {
    document.documentElement.dir = getDirection(i18n.language);
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Restore a guest identity on load so a returning guest lands on the
  // dashboard instead of the banner every time (see AUTH-001).
  useEffect(() => {
    continueAsGuest().then(() => setScreen("dashboard"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user?.mode === "authenticated" || (user?.mode === "guest" && screen === "dashboard")) {
    return (
      <main className="container">
        <h1>{t("app.name")}</h1>
        {user.mode === "guest" && (
          <GuestBanner onSignIn={() => setScreen("sign-in")} onCreateAccount={() => setScreen("sign-up")} />
        )}
        {user.mode === "authenticated" && (
          <p>
            {user.email} — <button onClick={() => signOut().then(() => setScreen("guest-banner"))}>{t("auth.signOut")}</button>
          </p>
        )}
        <p>Phase 1 — authentication wired. See docs/ROADMAP.md for what's next.</p>
      </main>
    );
  }

  if (screen === "sign-in") {
    return (
      <div className="container">
        <SignInPage />
        <button onClick={() => setScreen("sign-up")}>{t("auth.createAccount")}</button>
      </div>
    );
  }

  if (screen === "sign-up") {
    return (
      <div className="container">
        <SignUpPage />
        <button onClick={() => setScreen("sign-in")}>{t("auth.signIn")}</button>
      </div>
    );
  }

  return (
    <main className="container">
      <h1>{t("app.name")}</h1>
      <p>{t("auth.guestBannerMessage")}</p>
    </main>
  );
}
