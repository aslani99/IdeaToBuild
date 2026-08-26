import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { AuthService } from "@application/services/AuthService";
import { SupabaseAuthRepository } from "@repository/implementations/SupabaseAuthRepository";
import type { AppUser } from "@domain/entities/User";

/**
 * Single shared authentication state for the whole app.
 *
 * BUGFIX (2026-08-26): `useAuth` used to be a plain hook, called separately
 * in both `App.tsx` and `SignInPage.tsx`/`SignUpPage.tsx`. Each call created
 * its OWN independent `useState` — so a successful sign-in inside
 * `SignInPage`'s copy of the hook never reached `App.tsx`'s copy, and the
 * screen never advanced past the sign-in form even though Supabase had
 * actually authenticated the user (confirmed via the Supabase dashboard's
 * "Last signed in" timestamp updating). The fix is the standard one for
 * this class of bug: hoist the state into a single Context so every
 * component reads/writes the same instance.
 */
interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  continueAsGuest: () => Promise<AppUser>;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (email: string, password: string) => Promise<{ user: AppUser; verificationSent: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authService = useMemo(() => new AuthService(new SupabaseAuthRepository()), []);

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return await authService.signUp(email, password);
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
    setUser(null);
  }, [authService]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, continueAsGuest, signIn, signUp, requestPasswordReset, signOut }),
    [user, loading, error, continueAsGuest, signIn, signUp, requestPasswordReset, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
