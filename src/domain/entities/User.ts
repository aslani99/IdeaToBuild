/**
 * Domain entity: User / Guest identity.
 * Pure TypeScript — no Supabase/React imports (see docs/ARCHITECTURE.md).
 */

export type AuthMode = "guest" | "authenticated";

export interface AppUser {
  id: string; // Supabase auth user id, or a locally-generated guest id
  mode: AuthMode;
  email: string | null; // null for guests
  emailVerified: boolean;
  displayName: string | null;
  createdAt: string; // ISO 8601
}

export interface AppSession {
  userId: string;
  accessToken: string | null; // null in guest mode
  refreshToken: string | null;
  expiresAt: string | null; // ISO 8601
  deviceId: string;
  createdAt: string;
}

export function createGuestUser(guestId: string): AppUser {
  return {
    id: guestId,
    mode: "guest",
    email: null,
    emailVerified: false,
    displayName: null,
    createdAt: new Date().toISOString(),
  };
}
