import { useState, useEffect, type FormEvent } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';
import { Mail, CheckCircle2, ArrowLeft, Check, X, Loader2 } from 'lucide-react';

interface RegisterSearch {
  redirect?: string;
}

export const Route = createFileRoute('/auth/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : undefined,
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, isLoading: isAuthLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugMessage, setSlugMessage] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industryType, setIndustryType] = useState<'restaurant' | 'grocery' | 'fashion' | 'services'>('restaurant');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailConfirmationSent, setIsEmailConfirmationSent] = useState(false);

  // Debounced real-time slug validation
  useEffect(() => {
    const slug = storeSlug.trim().toLowerCase();
    if (!slug) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    if (slug.length < 3) {
      setSlugStatus('unavailable');
      setSlugMessage('الرابط قصير جداً (3 أحرف على الأقل)');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await businessService.checkSlugAvailability(slug);
        if (res.available) {
          setSlugStatus('available');
          setSlugMessage('الرابط متاح للحجز!');
        } else {
          setSlugStatus('unavailable');
          setSlugMessage(res.reason || 'الرابط غير متاح');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [storeSlug]);

  // Auto-generate slug suggestion from English business name if slug is empty
  const handleNameChange = (val: string) => {
    setStoreName(val);
    if (!storeSlug) {
      const suggested = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (suggested.length >= 3) {
        setStoreSlug(suggested);
      }
    }
  };

  // If already logged in, redirect to dashboard
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
      // 1. Create Supabase Auth Account
      const authData = await signUp(email, password);
      const userId = authData.user?.id;

      if (!userId) {
        setIsEmailConfirmationSent(true);
        return;
      }

      // Check if session is present (if email confirmation is required, session might be null)
      if (!authData.session) {
        setIsEmailConfirmationSent(true);
        return;
      }

      // 2. Initialize Business Profile & Default Branch
      await businessService.createBusiness(userId, {
        name: storeName.trim(),
        slug: storeSlug.trim() || storeName.trim(),
        industryType,
        currencyCode: 'EGP',
        phoneNumber: phoneNumber.trim() || undefined,
      });

      const destination = search.redirect || '/dashboard';
      navigate({ to: destination as never, replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show confirmation screen if Supabase requires email verification
  if (isEmailConfirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
        <Card className="w-full max-w-md p-6 text-center space-y-5 bg-white shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)]">
              تم إرسال رابط تأكيد الحساب
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              أرسلنا رابط التحقق إلى <span className="font-bold text-slate-900" dir="ltr">{email}</span>.
              يرجى فتح بريدك الإلكتروني والضغط على الرابط لتفعيل المتجر والبدء فوراً.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-[var(--radius-md)] text-xs text-emerald-800 space-y-1 text-right">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>خطوتك التالية:</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              بعد الضغط على الرابط، سيتم تحويلك تلقائياً إلى لوحة إدارة متجرك.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/auth/login">
              <Button variant="outline" size="md" className="w-full">
                الذهاب إلى تسجيل الدخول
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
      <Card className="w-full max-w-md p-6 text-right space-y-5 bg-white shadow-md">
        {/* Branding */}
        <div className="text-center space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-xs">
              M
            </div>
            <span className="font-extrabold text-base text-[var(--primary)]">ديجيتال منيو</span>
          </Link>
          <h1 className="text-lg font-black text-[var(--text-primary)]">
            إنشاء منيو إلكتروني ومتجر جديد
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            ابدأ مجاناً 100% بدون أي رسوم خفية أو بطاقة ائتمان
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم النشاط التجاري / المتجر *"
            placeholder="مثال: مطعم الفانوس، بوتيك ستايل"
            value={storeName}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />

          <div className="space-y-1">
            <Input
              label="الرابط الفرعي المطلوب لنطاق متجرك (Subdomain) *"
              placeholder="alfanoos"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              dir="ltr"
              required
            />
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-[var(--text-muted)] font-mono" dir="ltr">
                {storeSlug ? `${storeSlug.toLowerCase()}.daleel-al-suez.com` : 'your-store.daleel-al-suez.com'}
              </span>
              {slugStatus === 'checking' && (
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Loader2 size={12} className="animate-spin" />
                  جاري التحقق...
                </span>
              )}
              {slugStatus === 'available' && (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Check size={12} />
                  {slugMessage}
                </span>
              )}
              {slugStatus === 'unavailable' && (
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <X size={12} />
                  {slugMessage}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">نوع النشاط *</label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value as any)}
              className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-all"
            >
              <option value="restaurant">مطعم / كافيه (وجبات، أحجام، إضافات)</option>
              <option value="grocery">سوبرماركت / بقالة (باركود، أوزان، وحدات)</option>
              <option value="fashion">ملابس وأزياء (ألوان، مقاسات، أقمشة)</option>
              <option value="services">خدمات وصالونات تجميل (مدد، باقات)</option>
            </select>
          </div>

          <Input
            label="رقم WhatsApp للتواصل واستلام الطلبات *"
            placeholder="مثال: 01012345678 أو 966501234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            dir="ltr"
            required
          />

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

          <Input
            type="password"
            label="كلمة المرور (6 أحرف على الأقل) *"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || isAuthLoading}
            className="w-full"
          >
            {isSubmitting ? 'جاري تجهيز متجرك...' : 'إنشاء المتجر مجاناً (Free Forever)'}
          </Button>
        </form>

        <div className="text-center pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <div>
            <span className="text-xs text-[var(--text-muted)]">لديك حساب بالفعل؟ </span>
            <Link
              to="/auth/login"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              تسجيل الدخول
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
