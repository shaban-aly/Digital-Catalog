import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { supabase } from '@/server/db/supabase';
import { mapSupabaseError } from '@/client/utils/auth-error-mapper';
import { Button } from '@/client/components/ui/Button';
import { Card } from '@/client/components/ui/Card';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function handleAuthVerification() {
      try {
        if (typeof window === 'undefined') return;

        // 1. Check for query parameters (PKCE code exchange)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        // 2. Check for URL hash fragments (implicit flow / magic link tokens)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) {
              throw setSessionError;
            }
          }
        }

        // 3. Verify active session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          if (isSubscribed) {
            setStatus('success');
            // Brief success state before redirecting to merchant dashboard
            setTimeout(() => {
              navigate({ to: '/dashboard', replace: true });
            }, 1200);
          }
        } else {
          // If no session after exchange attempt
          if (isSubscribed) {
            setStatus('error');
            setErrorMessage('لم يتم العثور على جلسة صالحة. قد يكون الرابط منتهي الصلاحية.');
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? mapSupabaseError(err) : 'فشل التحقق من صحة الرابط. قد يكون منتهي الصلاحية.';
        console.error('[Supabase Auth Callback] Verification failed:', err);
        if (isSubscribed) {
          setStatus('error');
          setErrorMessage(message);
        }
      }
    }

    handleAuthVerification();

    return () => {
      isSubscribed = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
      <Card className="w-full max-w-md p-6 text-center space-y-5 bg-white shadow-md">
        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h1 className="text-lg font-black text-[var(--text-primary)]">
              جاري تأكيد الحساب وتجهيز الجلسة...
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              يرجى الانتظار ثوانٍ معدودة لتحويلك إلى لوحة التحكم.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-black text-[var(--text-primary)]">
              تم التحقق من الحساب بنجاح!
            </h1>
            <p className="text-xs text-emerald-700 font-semibold">
              جاري نقلك إلى لوحة إدارة متجرك الآن...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4 text-right">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h1 className="text-base font-black text-[var(--text-primary)]">
                تعذر تأكيد الرابط
              </h1>
              <p className="text-xs text-rose-600 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link to="/auth/login">
                <Button variant="primary" size="md" className="w-full gap-2">
                  <span>الانتقال لتسجيل الدخول</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
