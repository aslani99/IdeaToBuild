import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AuthService } from "@application/services/AuthService";
import { SupabaseAuthRepository } from "@repository/implementations/SupabaseAuthRepository";
import type { AppUser } from "@domain/entities/User";

/**
 * Single shared authentication state for the whole app.
 *
 * BUGFIX (2026-08-26): `useAuth` used to be a plain hook, called separately
 * in both `App.tsx` and `SignInPage.tsx`/`SignUpPage.tsx`. Each call created
 * its OWN independent `useState` — so a successful sign-in inside
 * `SignInPage`'s copy of the hook never reached `App.tsx`'s copy. Fixed by
 * hoisting the state into this single Context.
 *
 * Also owns:
 * - Session persistence (AUTH-003): on mount, checks for an existing
 *   Supabase session and restores the authenticated user instead of
 *   defaulting to guest, so a returning user is never asked to sign in
 *   again unnecessarily.
 * - The "auth required" prompt (master spec Section 22): guests can browse
 *   the whole app; the moment a guest action needs to persist something,
 *   call `requireAuth()` — it opens the sign-in/sign-up modal and returns
 *   `false` so the caller can bail out of the save/create action. Once the
 *   user authenticates, the modal closes on its own (see `signIn`/`signUp`).
 */
interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  /** True once the initial session-restore check has finished (avoids a flash of the guest UI on load). */
  initializing: boolean;
  continueAsGuest: () => Promise<AppUser>;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (email: string, password: string) => Promise<{ user: AppUser; verificationSent: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  authModalOpen: boolean;
  authModalMode: "sign-in" | "sign-up";
  setAuthModalMode: (mode: "sign-in" | "sign-up") => void;
  closeAuthModal: () => void;
  /** Returns true if the user is authenticated; otherwise opens the auth modal and returns false. */
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authService = useMemo(() => new AuthService(new SupabaseAuthRepository()), []);

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");

  // Session persistence (AUTH-003): on first load, try to restore a real
  // Supabase session BEFORE falling back to guest mode.
  useEffect(() => {
    let cancelled = false;
    authService
      .restoreSession()
      .then(async (restored) => {
        if (cancelled) return;
        if (restored) {
          setUser(restored);
        } else {
          const guest = await authService.continueAsGuest();
          if (!cancelled) setUser(guest);
        }
      })
      .catch(async () => {
        // If session restoration itself fails (e.g. no network), still let
        // the user in as a guest rather than blocking the app.
        const guest = await authService.continueAsGuest();
        if (!cancelled) setUser(guest);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const continueAsGuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const guest = await authService.continueAsGuest();
      setUser(guest);
      return guest;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { user: signedInUser } = await authService.signIn(email, password);
        setUser(signedInUser);
        setAuthModalOpen(false);
        return signedInUser;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await authService.signUp(email, password);
        // If email confirmation is disabled (dev setting), signUp already
        // returns an authenticated user — reflect that immediately and
        // close the modal. If confirmation IS required, the modal stays
        // open showing the "check your email" message (see SignUpPage).
        if (!result.verificationSent) {
          setUser(result.user);
          setAuthModalOpen(false);
        }
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setLoading(true);
      setError(null);
      try {
        await authService.requestPasswordReset(email);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    const guest = await authService.continueAsGuest();
    setUser(guest);
  }, [authService]);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const requireAuth = useCallback((): boolean => {
    if (user?.mode === "authenticated") return true;
    setAuthModalMode("sign-in");
    setAuthModalOpen(true);
    return false;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      initializing,
      continueAsGuest,
      signIn,
      signUp,
      requestPasswordReset,
      signOut,
      authModalOpen,
      authModalMode,
      setAuthModalMode,
      closeAuthModal,
      requireAuth,
    }),
    [
      user,
      loading,
      error,
      initializing,
      continueAsGuest,
      signIn,
      signUp,
      requestPasswordReset,
      signOut,
      authModalOpen,
      authModalMode,
      closeAuthModal,
      requireAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
