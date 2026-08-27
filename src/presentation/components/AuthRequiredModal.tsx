import { useTranslation } from "react-i18next";
import { useAuth } from "@application/context/AuthContext";
import { SignInPage } from "@presentation/pages/SignInPage";
import { SignUpPage } from "@presentation/pages/SignUpPage";

/**
 * Shown the instant a guest attempts to save/create anything (master spec
 * Section 22 — guests are never forced to log in immediately, but ARE
 * prompted the moment they try to persist data). Rendered once at the top
 * of the app (App.tsx) and controlled entirely through AuthContext, so any
 * component can trigger it via `requireAuth()` without prop-drilling.
 */
export function AuthRequiredModal() {
  const { t } = useTranslation();
  const { authModalOpen, authModalMode, setAuthModalMode, closeAuthModal } = useAuth();

  if (!authModalOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <button className="modal-close" onClick={closeAuthModal} aria-label={t("idea.cancel")}>
          ×
        </button>
        <p>{t("auth.guestBannerMessage")}</p>
        {authModalMode === "sign-in" ? (
          <>
            <SignInPage />
            <button onClick={() => setAuthModalMode("sign-up")}>{t("auth.createAccount")}</button>
          </>
        ) : (
          <>
            <SignUpPage />
            <button onClick={() => setAuthModalMode("sign-in")}>{t("auth.signIn")}</button>
          </>
        )}
      </div>
    </div>
  );
}
