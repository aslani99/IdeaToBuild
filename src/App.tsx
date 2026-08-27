import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getDirection } from "@i18n/localeMetadata";
import { AuthProvider, useAuth } from "@application/context/AuthContext";
import { ActiveDateProvider } from "@application/context/ActiveDateContext";
import { SyncEngine } from "@application/services/SyncEngine";
import { SupabaseIdeaRepository } from "@repository/implementations/SupabaseIdeaRepository";
import { AuthRequiredModal } from "@presentation/components/AuthRequiredModal";
import { DashboardPage } from "@presentation/pages/DashboardPage";

export default function App() {
  // AuthProvider and ActiveDateProvider wrap everything so every screen
  // shares the SAME auth and active-date state — not a separate copy per
  // component (see AuthContext.tsx bugfix note, and CAL-001/AD-009).
  return (
    <AuthProvider>
      <ActiveDateProvider>
        <AppInner />
      </ActiveDateProvider>
    </AuthProvider>
  );
}

function AppInner() {
  const { t, i18n } = useTranslation();
  const { user, initializing, signOut } = useAuth();
  const syncEngineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    document.documentElement.dir = getDirection(i18n.language);
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // SyncEngine only makes sense for an authenticated user (guests can't
  // write anything in the first place — see requireAuth() in
  // DashboardPage). Start it once on sign-in, stop it on sign-out.
  useEffect(() => {
    if (user?.mode === "authenticated" && !syncEngineRef.current) {
      const engine = new SyncEngine(new SupabaseIdeaRepository());
      engine.start();
      syncEngineRef.current = engine;
    }
    if (user?.mode !== "authenticated" && syncEngineRef.current) {
      syncEngineRef.current.stop();
      syncEngineRef.current = null;
    }
    return () => {
      syncEngineRef.current?.stop();
      syncEngineRef.current = null;
    };
  }, [user?.mode]);

  // Avoid a flash of empty UI while the session-restore check runs (see
  // AuthContext.tsx — AUTH-003 session persistence).
  if (initializing || !user) {
    return (
      <main className="container">
        <h1>{t("app.name")}</h1>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>{t("app.name")}</h1>
      {user.mode === "authenticated" && (
        <p>
          {user.email} — <button onClick={() => signOut()}>{t("auth.signOut")}</button>
        </p>
      )}
      {/*
        Guests can see and use the whole dashboard (master spec Section 22
        — never force login just to browse). DashboardPage/IdeasPanel call
        `requireAuth()` from AuthContext the instant a guest tries to
        create/save something, which opens AuthRequiredModal below instead
        of silently failing or blocking the whole screen.
      */}
      <DashboardPage ownerId={user.id} />
      <AuthRequiredModal />
    </main>
  );
}
