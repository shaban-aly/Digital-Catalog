/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../../server/db/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Translates Supabase authentication errors into clear, friendly Arabic messages.
 */
export function mapSupabaseError(error: AuthError | Error | string): string {
  const msg = typeof error === 'string' ? error : error?.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إلى صندوق الوارد.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  }
  return msg || 'حدث خطأ أثناء معالجة المصادقة. يرجى المحاولة لاحقاً.';
}

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch initial session from Supabase (backed by localStorage in browser)
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) {
          console.warn('[Supabase Auth] getSession error:', sessionError.message);
          setError(mapSupabaseError(sessionError));
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[Supabase Auth] Failed to retrieve session:', err);
        setIsLoading(false);
      });

    // 2. Subscribe to auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      const arabicMsg = mapSupabaseError(signInError);
      setError(arabicMsg);
      setIsLoading(false);
      throw new Error(arabicMsg);
    }

    setUser(data.user);
    setSession(data.session);
    setIsLoading(false);
    return data;
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (signUpError) {
      const arabicMsg = mapSupabaseError(signUpError);
      setError(arabicMsg);
      setIsLoading(false);
      throw new Error(arabicMsg);
    }

    setUser(data.user ?? null);
    setSession(data.session ?? null);
    setIsLoading(false);
    return data;
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Supabase Auth] Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsLoading(false);
      setError(null);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);

    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?type=recovery`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      const arabicMsg = mapSupabaseError(resetError);
      setError(arabicMsg);
      throw new Error(arabicMsg);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful fallback for initial renders or isolated testing
    return {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      signIn: async () => {
        throw new Error('AuthProvider is not mounted');
      },
      signUp: async () => {
        throw new Error('AuthProvider is not mounted');
      },
      signOut: async () => {},
      resetPassword: async () => {},
      clearError: () => {},
    };
  }
  return context;
}
