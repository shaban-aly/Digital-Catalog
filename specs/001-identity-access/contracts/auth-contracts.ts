/**
 * Interface Contracts: Identity and Access (IDN-001)
 * 
 * Formal interface contracts and type definitions for merchant identity,
 * session management, error translation, and redirect protection.
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface MerchantUser {
  id: string;
  email: string;
  emailConfirmedAt?: string | null;
  createdAt: string;
  lastSignInAt?: string | null;
}

export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  user: MerchantUser;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface IAuthService {
  /**
   * Authenticates a merchant using email and password.
   * Throws friendly Arabic error upon failure.
   */
  signIn(email: string, password: string): Promise<{ user: User; session: Session }>;

  /**
   * Registers a new merchant account with email and password.
   */
  signUp(email: string, password: string): Promise<{ user: User | null; session: Session | null }>;

  /**
   * Safely revokes active tokens and clears client session storage.
   */
  signOut(): Promise<void>;

  /**
   * Requests a password reset link sent to the merchant's email.
   * Always resolves cleanly without disclosing email existence (anti-enumeration).
   */
  resetPassword(email: string): Promise<void>;

  /**
   * Clears any active error state from the auth context.
   */
  clearError(): void;
}

export interface IRedirectProtector {
  /**
   * Validates and sanitizes a requested redirect path.
   * Neutralizes external URLs, protocol-relative paths, and backslashes.
   * Returns a guaranteed-safe relative application path or the default fallback.
   */
  sanitizeRedirect(rawRedirect: string | null | undefined, fallback?: string): string;
}

export interface IErrorMapper {
  /**
   * Translates provider error codes/messages into polite, natural Arabic.
   */
  mapError(error: AuthError | Error | string): string;
}

