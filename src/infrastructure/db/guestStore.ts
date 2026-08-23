/**
 * Minimal local persistence for the guest identity, so a guest user's local
 * data survives an app restart before they ever create an account
 * (master spec Section 22 — guest data must not disappear silently).
 *
 * Phase 0/1 placeholder: uses localStorage on web builds. Once the SQLite
 * layer lands (Phase 9, docs/ROADMAP.md), this should move to the local DB
 * so it's consistent across Desktop/Web/Mobile — tracked as a follow-up,
 * not silently left on localStorage long-term.
 */

const GUEST_ID_KEY = "ideatobuild.guestId";

export async function getOrCreateGuestId(): Promise<string> {
  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;

  const newId = crypto.randomUUID();
  window.localStorage.setItem(GUEST_ID_KEY, newId);
  return newId;
}
