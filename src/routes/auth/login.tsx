import { useState, useEffect, type FormEvent } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading: isAuthLoading, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Recovery mode toggle
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // If user is already logged in, redirect directly to dashboard or target path
  useEffect(() => {
    if (!isAuthLoading && user) {
      const destination = search.redirect || '/dashboard';
      navigate({ to: destination as never, replace: true });
    }
  }, [user, isAuthLoading, navigate, search.redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      const destination = search.redirect || '/dashboard';
      navigate({ to: destination as never, replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول. يرجى التحقق من صحة البريد وكلمة المرور.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني لإرسال رابط الاستعادة.');
      return;
    }

    setError(null);
    setIsResetting(true);

    try {
      await resetPassword(email);
      setResetSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل إرسال رابط استعادة كلمة المرور.';
      setError(message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
      <Card className="w-full max-w-sm p-6 text-right space-y-5 bg-white shadow-md">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-xs">
              M
            </div>
            <span className="font-extrabold text-base text-[var(--primary)]">ديجيتال منيو</span>
          </Link>
          <h1 className="text-lg font-black text-[var(--text-primary)]">
            {isResetMode ? 'استعادة كلمة المرور' : 'تسجيل الدخول'}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {isResetMode
              ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور'
              : 'لوحة إدارة متجرك الإلكتروني وقوائم الأسعار'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
            {error}
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.</span>
          </div>
        )}

        {!isResetMode ? (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="البريد الإلكتروني *"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              autoComplete="email"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  كلمة المرور *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetSuccess(false);
                    setIsResetMode(true);
                  }}
                  className="text-[11px] text-emerald-700 hover:underline font-bold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || isAuthLoading}
              className="w-full"
            >
              {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="email"
              label="البريد الإلكتروني *"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isResetting}
              className="w-full gap-1.5"
            >
              <KeyRound size={15} />
              <span>{isResetting ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}</span>
            </Button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setResetSuccess(false);
                setIsResetMode(false);
              }}
              className="w-full text-center text-xs font-bold text-[var(--text-secondary)] hover:underline pt-1"
            >
              العودة لتسجيل الدخول
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="text-center pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <div>
            <span className="text-xs text-[var(--text-muted)]">ليس لديك متجر بعد؟ </span>
            <Link
              to="/auth/register"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              أنشئ متجرك مجاناً (Free Forever)
            </Link>
          </div>
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <span>العودة للصفحة الرئيسية</span>
              <ArrowLeft size={12} />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
