import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { sanitizeRedirectUrl } from '@/client/utils/redirect';
import { validateSlugFormat, normalizeSlug } from '@/client/utils/slug-validator';
import { mapSupabaseError } from '@/client/utils/auth-error-mapper';
import { businessService } from '@/server/services/business';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';
import {
  Mail,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';

interface RegisterSearch {
  redirect?: string;
}

interface RegisterFieldErrors {
  storeName?: string;
  storeSlug?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
}

const SUPPORT_WHATSAPP_NUMBER = '201012345678';
const SUPPORT_WHATSAPP_MESSAGE = encodeURIComponent(
  'مرحباً إدارة ديجيتال منيو، أحتاج إلى مساعدة في تسجيل متجر جديد وتفعيل حسابي.'
);
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${SUPPORT_WHATSAPP_MESSAGE}`;

export const Route = createFileRoute('/auth/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    const rawRedirect = typeof search.redirect === 'string' ? search.redirect : undefined;
    return {
      redirect: rawRedirect ? sanitizeRedirectUrl(rawRedirect) : undefined,
    };
  },
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
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industryType, setIndustryType] = useState<'restaurant' | 'grocery' | 'fashion' | 'services'>('restaurant');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailConfirmationSent, setIsEmailConfirmationSent] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendConfirmationMessage, setResendConfirmationMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const storeNameInputRef = useRef<HTMLInputElement>(null);

  // Desktop adaptation: Autofocus only on fine pointer devices (desktop with keyboard), not on mobile touch
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      storeNameInputRef.current?.focus();
    }
  }, []);

  // Cooldown countdown for resending email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Debounced real-time slug validation with cancellation against race conditions
  useEffect(() => {
    const slug = storeSlug.trim().toLowerCase();
    if (!slug) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    // Instant client-side validation against DNS RFC 1123 & reserved platform subdomains
    const formatValidation = validateSlugFormat(slug);
    if (!formatValidation.valid) {
      setSlugStatus('unavailable');
      setSlugMessage(formatValidation.error || 'الرابط غير صالح');
      return;
    }

    setSlugStatus('checking');
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await businessService.checkSlugAvailability(slug);
        if (!isCancelled) {
          if (res.available) {
            setSlugStatus('available');
            setSlugMessage('الرابط متاح للحجز!');
          } else {
            setSlugStatus('unavailable');
            setSlugMessage(res.reason || 'الرابط غير متاح');
          }
        }
      } catch {
        if (!isCancelled) {
          setSlugStatus('idle');
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [storeSlug]);

  // Auto-generate slug suggestion from business name (supports Arabic phonetics and English)
  const handleNameChange = (val: string) => {
    setStoreName(val);
    if (!storeSlug) {
      const suggested = normalizeSlug(val);
      if (suggested.length >= 3) {
        setStoreSlug(suggested);
      }
    }
  };

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isAuthLoading && user) {
      const destination = sanitizeRedirectUrl(search.redirect, '/dashboard');
      navigate({ to: destination as never, replace: true });
    }
  }, [user, isAuthLoading, navigate, search.redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanStoreName = storeName.trim();
    const cleanSlug = storeSlug.trim().toLowerCase() || normalizeSlug(cleanStoreName);
    const cleanPhone = phoneNumber.trim();

    // Client-side Custom Validation: prevents generic/English native browser tooltips
    const newErrors: RegisterFieldErrors = {};
    if (!cleanStoreName) {
      newErrors.storeName = 'يرجى إدخال اسم النشاط التجاري أو المتجر';
    }
    if (!cleanSlug) {
      newErrors.storeSlug = 'يرجى إدخال رابط المتجر';
    } else {
      const slugValidation = validateSlugFormat(cleanSlug);
      if (!slugValidation.valid) {
        newErrors.storeSlug = slugValidation.error;
      }
    }
    if (!cleanPhone) {
      newErrors.phoneNumber = 'يرجى إدخال رقم WhatsApp للتواصل';
    } else if (cleanPhone.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'يرجى إدخال رقم هاتف صحيح (10 أرقام على الأقل)';
    }
    if (!cleanEmail) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }
    if (!password) {
      newErrors.password = 'يرجى إدخال كلمة المرور';
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      // Accessible focus to the first invalid field
      if (newErrors.storeName) storeNameInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // 1. Create Supabase Auth Account
      const authData = await signUp(cleanEmail, password);
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
        name: cleanStoreName,
        slug: cleanSlug,
        industryType,
        currencyCode: 'EGP',
        phoneNumber: cleanPhone || undefined,
      });

      const destination = sanitizeRedirectUrl(search.redirect, '/dashboard');
      navigate({ to: destination as never, replace: true });
    } catch (err: unknown) {
      setError(mapSupabaseError(err as Error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResendingEmail) return;
    setIsResendingEmail(true);
    setResendConfirmationMessage(null);
    try {
      await signUp(email.trim(), password);
      setResendConfirmationMessage('تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.');
      setResendCooldown(60);
    } catch {
      setResendConfirmationMessage('تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.');
      setResendCooldown(60);
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Show confirmation screen if Supabase requires email verification
  if (isEmailConfirmationSent) {
    return (
      <main className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--bg-app)] overflow-y-auto">
        <Card className="w-full max-w-md my-auto p-6 sm:p-7 text-center space-y-5 bg-[var(--bg-surface)] shadow-md transition-all">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Mail className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
              تم إرسال رابط تأكيد الحساب
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              أرسلنا رابط التفعيل إلى{' '}
              <span className="font-bold text-[var(--text-primary)]" dir="ltr">
                {email.trim()}
              </span>
              . يرجى فتح بريدك والضغط على الرابط لتفعيل المتجر والبدء فوراً.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setIsEmailConfirmationSent(false)}
                className="min-h-[44px] inline-flex items-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
              >
                خطأ في كتابة البريد الإلكتروني؟ اضغط هنا لتعديله
              </button>
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-[var(--radius-md)] text-xs text-emerald-950 space-y-1 text-right"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 size={15} className="text-emerald-700 shrink-0" aria-hidden="true" />
              <span>خطوتك التالية:</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              بعد الضغط على الرابط في البريد، سيتم تحويلك تلقائياً للوحة تحكم متجرك.
            </p>
          </div>

          {resendConfirmationMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] text-center"
            >
              {resendConfirmationMessage}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Link to="/auth/login" className="block">
              <Button variant="primary" size="md" className="w-full">
                الذهاب إلى تسجيل الدخول
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isResendingEmail || resendCooldown > 0}
              onClick={handleResendEmail}
              className="w-full gap-2 text-xs"
            >
              {isResendingEmail ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw size={14} aria-hidden="true" />
              )}
              <span>
                {isResendingEmail
                  ? 'جاري إعادة الإرسال...'
                  : resendCooldown > 0
                    ? `إعادة الإرسال متاحة بعد ${resendCooldown} ثانية`
                    : 'إعادة إرسال رابط التأكيد'}
              </span>
            </Button>
          </div>

          <div className="pt-2 text-center border-t border-[var(--border-subtle)] space-y-1">
            <p className="text-[11px] text-[var(--text-secondary)]">لم تجد الرسالة أو تواجه صعوبة؟</p>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--whatsapp-dark)] hover:underline"
            >
              <MessageCircle size={15} aria-hidden="true" />
              <span>تواصل مع الدعم الفني عبر واتساب للمساعدة</span>
            </a>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--bg-app)] overflow-y-auto">
      <Card className="w-full max-w-md my-auto p-5 sm:p-7 text-right space-y-5 bg-[var(--bg-surface)] shadow-md transition-all">
        {/* Branding Header */}
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
          <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
            إنشاء منيو إلكتروني ومتجر جديد
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            ابدأ تجهيز متجرك الآن وبدون الحاجة لبطاقة بنكية
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Step 1: Store Configuration */}
          <div className="space-y-3 pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>١. بيانات المتجر والقائمة</span>
            </h2>

            <Input
              id="register-store-name"
              ref={storeNameInputRef}
              label="اسم النشاط التجاري / المتجر *"
              placeholder="مثال: مطعم المصري، كافيه السويس، بوتيك ستايل"
              value={storeName}
              onChange={(e) => {
                handleNameChange(e.target.value);
                if (fieldErrors.storeName) {
                  setFieldErrors((prev) => ({ ...prev, storeName: undefined }));
                }
              }}
              error={fieldErrors.storeName}
              autoComplete="organization"
            />

            <div className="space-y-1">
              <Input
                id="register-store-slug"
                label="رابط متجرك الإلكتروني المطبوع على كود QR *"
                placeholder="almisriu"
                value={storeSlug}
                onChange={(e) => {
                  setStoreSlug(e.target.value);
                  if (fieldErrors.storeSlug) {
                    setFieldErrors((prev) => ({ ...prev, storeSlug: undefined }));
                  }
                }}
                error={fieldErrors.storeSlug}
                dir="ltr"
              />
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-between text-[11px] px-1"
              >
                <span className="text-[var(--text-secondary)] font-mono" dir="ltr">
                  {storeSlug
                    ? `${storeSlug.toLowerCase()}.digitalmenu.daleel-al-suez.com`
                    : 'your-store.digitalmenu.daleel-al-suez.com'}
                </span>
                {slugStatus === 'checking' && (
                  <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    جاري التحقق...
                  </span>
                )}
                {slugStatus === 'available' && (
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <Check size={12} aria-hidden="true" />
                    {slugMessage}
                  </span>
                )}
                {slugStatus === 'unavailable' && (
                  <span className="flex items-center gap-1 text-rose-800 font-semibold">
                    <X size={12} aria-hidden="true" />
                    {slugMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-right">
              <label
                htmlFor="register-industry-type"
                className="text-xs font-semibold text-[var(--text-secondary)] select-none"
              >
                نوع النشاط التجاري *
              </label>
              <select
                id="register-industry-type"
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value as any)}
                className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-base sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-all"
              >
                <option value="restaurant">مطعم / كافيه (وجبات، أحجام، إضافات)</option>
                <option value="grocery">سوبرماركت / بقالة (باركود، أوزان، وحدات)</option>
                <option value="fashion">ملابس وأزياء (ألوان، مقاسات، أقمشة)</option>
                <option value="services">خدمات وصالونات تجميل (مدد، باقات)</option>
              </select>
            </div>

            <Input
              id="register-phone"
              type="tel"
              inputMode="tel"
              label="رقم WhatsApp للتواصل واستلام الطلبات *"
              placeholder="مثال: 01012345678"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (fieldErrors.phoneNumber) {
                  setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                }
              }}
              error={fieldErrors.phoneNumber}
              dir="ltr"
              autoComplete="tel"
            />
          </div>

          {/* Step 2: Authentication Credentials */}
          <div className="space-y-3 pt-1">
            <h2 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>٢. بيانات تأمين الحساب</span>
            </h2>

            <Input
              id="register-email"
              type="email"
              label="البريد الإلكتروني *"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={fieldErrors.email}
              dir="ltr"
              autoComplete="email"
            />

            <div className="space-y-1">
              <label
                htmlFor="register-password"
                className="text-xs font-semibold text-[var(--text-secondary)] select-none block"
              >
                كلمة المرور (6 أحرف على الأقل) *
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={fieldErrors.password}
                  dir="ltr"
                  autoComplete="new-password"
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
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || isAuthLoading}
            className="w-full gap-2 mt-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            <span>{isSubmitting ? 'جاري تجهيز متجرك...' : 'إنشاء المتجر والبدء مجاناً'}</span>
          </Button>
        </form>

        {/* Footer Actions */}
        <div className="text-center pt-3 border-t border-[var(--border-subtle)] space-y-1">
          <div>
            <span className="text-xs text-[var(--text-secondary)]">لديك حساب بالفعل؟ </span>
            <Link
              to="/auth/login"
              className="min-h-[44px] inline-flex items-center text-xs font-bold text-[var(--text-primary)] hover:underline"
            >
              تسجيل الدخول
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
              <span>تحتاج مساعدة في التسجيل؟ تواصل معنا</span>
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
