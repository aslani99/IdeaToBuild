import { useCallback, useMemo, useState } from "react";
import { AuthService } from "@application/services/AuthService";
import { SupabaseAuthRepository } from "@repository/implementations/SupabaseAuthRepository";
import type { AppUser } from "@domain/entities/User";

/**
 * Thin React adapter over AuthService. Components should use this hook
 * instead of importing AuthService or the repository directly, so the
 * Presentation layer stays decoupled from wiring (see docs/ARCHITECTURE.md).
 */
export function useAuth() {
  // NOTE: for Phase 1 this instantiates the repository directly. Once the
  // app has a proper composition root / DI setup, this should be injected
  // via context instead of constructed here.
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

  return { user, loading, error, continueAsGuest, signIn, signUp, requestPasswordReset, signOut };
}
