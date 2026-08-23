import type { AppUser, AppSession } from "@domain/entities/User";

/**
 * Domain-level auth interface. Application/UI depend on this only — never on
 * the Supabase SDK directly (see docs/ARCHITECTURE.md, AD-006).
 *
 * Covers: AUTH-001 (guest mode), AUTH-002 (email/password + verification +
 * recovery), AUTH-003 (session management) — see
 * docs/REQUIREMENTS_TRACEABILITY.md.
 */
export interface IAuthRepository {
  /** Creates or restores a local guest identity. No network call required. */
  continueAsGuest(): Promise<AppUser>;

  signUp(params: { email: string; password: string }): Promise<{ user: AppUser; verificationSent: boolean }>;

  signIn(params: { email: string; password: string }): Promise<{ user: AppUser; session: AppSession }>;

  signOut(): Promise<void>;

  requestPasswordReset(email: string): Promise<void>;

  resetPassword(params: { token: string; newPassword: string }): Promise<void>;

  getCurrentSession(): Promise<AppSession | null>;

  /** Revokes a specific session/device (see docs/SECURITY.md — session/device management). */
  revokeSession(sessionId: string): Promise<void>;

  /**
   * Migrates locally-stored guest data to a newly authenticated account.
   * Guest data must never be silently discarded (master spec Section 22).
   */
  migrateGuestData(params: { guestId: string; newUserId: string }): Promise<void>;
}
