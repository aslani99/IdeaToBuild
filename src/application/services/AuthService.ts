import type { IAuthRepository } from "@domain/repositories/IAuthRepository";
import type { AppUser, AppSession } from "@domain/entities/User";

/**
 * Use-case orchestration for authentication. Depends only on IAuthRepository
 * (see docs/ARCHITECTURE.md) so Presentation never talks to Supabase directly.
 */
export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  continueAsGuest(): Promise<AppUser> {
    return this.authRepository.continueAsGuest();
  }

  signUp(email: string, password: string) {
    return this.authRepository.signUp({ email, password });
  }

  signIn(email: string, password: string): Promise<{ user: AppUser; session: AppSession }> {
    return this.authRepository.signIn({ email, password });
  }

  signOut(): Promise<void> {
    return this.authRepository.signOut();
  }

  requestPasswordReset(email: string): Promise<void> {
    return this.authRepository.requestPasswordReset(email);
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return this.authRepository.resetPassword({ token, newPassword });
  }

  getCurrentSession(): Promise<AppSession | null> {
    return this.authRepository.getCurrentSession();
  }

  /**
   * Call after a guest successfully signs up/in, so their local data follows
   * them into the new account (master spec Section 22).
   */
  async upgradeGuestToAccount(guestId: string, newUserId: string): Promise<void> {
    await this.authRepository.migrateGuestData({ guestId, newUserId });
  }
}
