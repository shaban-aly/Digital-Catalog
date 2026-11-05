import { useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { signUp, isLoading } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industryType, setIndustryType] = useState<'restaurant' | 'grocery' | 'fashion' | 'services'>('restaurant');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create Supabase Auth Account
      const authData = await signUp(email, password);
      const userId = authData.user?.id;

      if (!userId) {
        throw new Error('تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى تأكيد الحساب.');
      }

      // 2. Create Business & Default Branch
      await businessService.createBusiness(userId, {
        name: storeName.trim(),
        slug: storeSlug.trim() || storeName.trim(),
        industryType,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
      <Card className="w-full max-w-md p-6 text-right space-y-5 bg-white shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-black text-[var(--text-primary)]">دليل السويس</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">إنشاء كتالوج رقمي مجاني لنشاطك التجاري</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold text-[var(--accent-promo)] bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم النشاط التجاري / المطعم *"
            placeholder="مثال: مطعم الفانوس، بوتيك ستايل"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />

          <Input
            label="الرابط المختصر المطلوب (Slug) *"
            placeholder="alfanoos"
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value)}
            dir="ltr"
            required
          />

          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">نوع النشاط *</label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value as any)}
              className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <option value="restaurant">مطعم / كافيه (وجبات، أحجام، إضافات)</option>
              <option value="grocery">سوبرماركت / بقالة (باركود، أوزان، وحدات)</option>
              <option value="fashion">ملابس وأزياء (ألوان، مقاسات، أقمشة)</option>
              <option value="services">خدمات وصالونات تجميل (مدد، باقات)</option>
            </select>
          </div>

          <Input
            label="رقم WhatsApp للتواصل واستلام الطلبات *"
            placeholder="مثال: 966501234567 أو 201012345678"
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
          />

          <Input
            type="password"
            label="كلمة المرور *"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'جاري تجهيز متجرك...' : 'إنشاء المتجر مجاناً (Free Forever)'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)]">لديك حساب بالفعل؟ </span>
          <a href="/auth/login" className="text-xs font-bold text-[var(--text-primary)] hover:underline">
            تسجيل الدخول
          </a>
        </div>
      </Card>
    </div>
  );
}
