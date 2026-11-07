import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { sanitizeRedirectUrl } from '@/client/utils/redirect';
import { mapSupabaseError } from '@/client/utils/auth-error-mapper';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

interface LoginSearch {
  redirect?: string;
}

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const SUPPORT_WHATSAPP_NUMBER = '201012345678';
const SUPPORT_WHATSAPP_MESSAGE = encodeURIComponent(
  'مرحباً إدارة ديجيتال منيو، أواجه صعوبة في تسجيل الدخول إلى حساب متجري وأحتاج إلى مساعدة.'
);
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${SUPPORT_WHATSAPP_MESSAGE}`;

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const rawRedirect = typeof search.redirect === 'string' ? search.redirect : undefined;
    return {
      redirect: rawRedirect ? sanitizeRedirectUrl(rawRedirect) : undefined,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading: isAuthLoading, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  // Password Recovery mode toggle
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Ref for intelligent focus adaptation on desktop
  const emailInputRef = useRef<HTMLInputElement>(null);

  // If user is already logged in, redirect directly to dashboard or target path
  useEffect(() => {
    if (!isAuthLoading && user) {
      const destination = sanitizeRedirectUrl(search.redirect, '/dashboard');
      navigate({ to: destination as never, replace: true });
    }
  }, [user, isAuthLoading, navigate, search.redirect]);

  // Desktop adaptation: Escape key dismisses reset mode back to login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isResetMode) {
        setError(null);
        setFieldErrors({});
        setResetSuccess(false);
        setIsResetMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetMode]);

  // Desktop adaptation: Autofocus only on fine pointer devices (mouse/keyboard), not on mobile touch (prevents virtual keyboard jump)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      emailInputRef.current?.focus();
    }
  }, [isResetMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const newErrors: LoginFieldErrors = {};

    if (!cleanEmail) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!password) {
      newErrors.password = 'يرجى إدخال كلمة المرور';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (newErrors.email) {
        emailInputRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await signIn(cleanEmail, password);
      const destination = sanitizeRedirectUrl(search.redirect, '/dashboard');
      navigate({ to: destination as never, replace: true });
    } catch (err: unknown) {
      setError(mapSupabaseError(err as Error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setFieldErrors({ email: 'يرجى إدخال البريد الإلكتروني لإرسال رابط الاستعادة.' });
      emailInputRef.current?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFieldErrors({ email: 'صيغة البريد الإلكتروني غير صحيحة' });
      emailInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsResetting(true);

    try {
      await resetPassword(cleanEmail);
      setResetSuccess(true);
    } catch {
      // Anti-enumeration: reveal zero information regarding account existence
      setResetSuccess(true);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--bg-app)] overflow-y-auto">
      <Card className="w-full max-w-sm my-auto p-5 sm:p-6 text-right space-y-5 bg-[var(--bg-surface)] shadow-md transition-all">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <Link
            to="/"
            className="min-h-[44px] inline-flex items-center gap-2 mb-1 py-1"
            aria-label="ديجيتال منيو - الصفحة الرئيسية"
          >
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-xs"
              aria-hidden="true"
            >
              M
            </div>
            <span className="font-extrabold text-base text-[var(--primary)]">ديجيتال منيو</span>
          </Link>
          <h1 className="text-lg font-black text-[var(--text-primary)]">
            {isResetMode ? 'استعادة كلمة المرور' : 'تسجيل الدخول'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {isResetMode
              ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور'
              : 'لوحة إدارة متجرك الإلكتروني وقوائم الأسعار'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-secondary)] mt-1.5">
            <ShieldCheck size={13} className="text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
            <span>منصة القوائم والكتالوجات الرقمية الذكية</span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 text-xs font-semibold text-rose-900 bg-rose-50 border border-rose-200 rounded-[var(--radius-md)] flex items-start gap-2"
          >
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" aria-hidden="true" />
            <span>تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني في حال كان الحساب مسجلاً لدينا.</span>
          </div>
        )}

        {!isResetMode ? (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-4 transition-all duration-200" noValidate>
            <Input
              id="login-email"
              ref={emailInputRef}
              type="email"
              label="البريد الإلكتروني *"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={fieldErrors.email}
              dir="ltr"
              autoComplete="email"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-[var(--text-secondary)] select-none">
                  كلمة المرور *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setFieldErrors({});
                    setResetSuccess(false);
                    setIsResetMode(true);
                  }}
                  className="min-h-[44px] px-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline font-bold inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-[var(--radius-sm)]"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  error={fieldErrors.password}
                  dir="ltr"
                  autoComplete="current-password"
                  className="pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-0 top-0 h-11 w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-l-[var(--radius-md)] transition-colors select-none"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || isAuthLoading}
              className="w-full gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              <span>{isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}</span>
            </Button>
          </form>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleResetPassword} className="space-y-4 transition-all duration-200" noValidate>
            <Input
              id="reset-email"
              ref={emailInputRef}
              type="email"
              label="البريد الإلكتروني *"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={fieldErrors.email}
              dir="ltr"
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isResetting}
              className="w-full gap-2"
            >
              {isResetting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <KeyRound size={15} />}
              <span>{isResetting ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}</span>
            </Button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setResetSuccess(false);
                setIsResetMode(false);
              }}
              className="w-full min-h-[44px] flex items-center justify-center text-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-[var(--radius-sm)]"
            >
              العودة لتسجيل الدخول
            </button>

            {/* Direct WhatsApp Help Fallback in Reset Mode */}
            <div className="pt-2 text-center border-t border-[var(--border-subtle)] space-y-1">
              <p className="text-[11px] text-[var(--text-secondary)]">
                لا تستطيع الوصول إلى بريدك الإلكتروني؟
              </p>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--whatsapp-dark)] hover:underline"
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span>تواصل مع الدعم الفني عبر واتساب</span>
              </a>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="text-center pt-3 border-t border-[var(--border-subtle)] space-y-1">
          <div>
            <span className="text-xs text-[var(--text-secondary)]">ليس لديك متجر بعد؟ </span>
            <Link
              to="/auth/register"
              className="min-h-[44px] inline-flex items-center text-xs font-bold text-[var(--text-primary)] hover:underline"
            >
              أنشئ متجرك مجاناً للأبد
            </Link>
          </div>
          <div>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
            >
              <MessageCircle size={14} className="text-[var(--whatsapp-dark)]" aria-hidden="true" />
              <span>تواجه مشكلة في الدخول؟ تواصل مع الدعم</span>
            </a>
          </div>
          <div>
            <Link
              to="/"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
              <span>العودة للصفحة الرئيسية</span>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
