import type { IAuthRepository } from "@domain/repositories/IAuthRepository";
import type { AppUser, AppSession } from "@domain/entities/User";
import { createGuestUser } from "@domain/entities/User";
import { getSupabaseClient } from "@infrastructure/api/supabaseClient";
import { getOrCreateGuestId } from "@infrastructure/db/guestStore";

function mapSupabaseUser(u: { id: string; email?: string | null; email_confirmed_at?: string | null; created_at: string }): AppUser {
  return {
    id: u.id,
    mode: "authenticated",
    email: u.email ?? null,
    emailVerified: !!u.email_confirmed_at,
    displayName: null,
    createdAt: u.created_at,
  };
}

/**
 * Real Supabase Auth implementation. No fake/mocked auth per
 * docs/PROJECT_MEMORY.md ("no fake implementations").
 */
export class SupabaseAuthRepository implements IAuthRepository {
  private client = getSupabaseClient();

  async continueAsGuest(): Promise<AppUser> {
    const guestId = await getOrCreateGuestId();
    return createGuestUser(guestId);
  }

  async signUp(params: { email: string; password: string }) {
    const { data, error } = await this.client.auth.signUp({
      email: params.email,
      password: params.password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign up did not return a user");
    return {
      user: mapSupabaseUser(data.user),
      verificationSent: !data.user.email_confirmed_at,
    };
  }

  async signIn(params: { email: string; password: string }) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) throw error;
    if (!data.user || !data.session) throw new Error("Sign in did not return a session");
    const session: AppSession = {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      deviceId: await getOrCreateGuestId(), // TODO(AUTH-003): replace with a proper device-id abstraction, not guest storage
      createdAt: new Date().toISOString(),
    };
    return { user: mapSupabaseUser(data.user), session };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async resetPassword(_params: { token: string; newPassword: string }): Promise<void> {
    // Supabase handles the token exchange via the redirect URL session;
    // once the recovery session is active, updateUser sets the new password.
    const { error } = await this.client.auth.updateUser({ password: _params.newPassword });
    if (error) throw error;
  }

  async getCurrentSession(): Promise<AppSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;
    return {
      userId: data.session.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      deviceId: await getOrCreateGuestId(),
      createdAt: new Date().toISOString(),
    };
  }

  async restoreSession(): Promise<AppUser | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) return null;
    return mapSupabaseUser(data.session.user);
  }

  async revokeSession(_sessionId: string): Promise<void> {
    // NOTE (Phase 1 follow-up, AUTH-004): per-device session revocation needs
    // a dedicated `user_sessions` table + Edge Function, since Supabase Auth's
    // client SDK only exposes signing out the *current* session. Track this
    // in docs/REQUIREMENTS_TRACEABILITY.md before shipping.
    throw new Error("Per-device session revocation not implemented yet — see AUTH-004");
  }

  async migrateGuestData(_params: { guestId: string; newUserId: string }): Promise<void> {
    // NOTE (Phase 1 follow-up, AUTH-005): actual data migration depends on
    // the local storage schema (SQLite/IndexedDB) built in later phases.
    // Do not silently discard guest data — see master spec Section 22.
    throw new Error("Guest data migration not implemented yet — see AUTH-005");
  }
}
