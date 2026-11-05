import { useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Card } from '@/client/components/ui/Card';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)]">
      <Card className="w-full max-w-sm p-6 text-right space-y-5 bg-white shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-black text-[var(--text-primary)]">دليل السويس</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">تسجيل الدخول إلى لوحة إدارة المتجر</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold text-[var(--accent-promo)] bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" variant="primary" size="md" disabled={isLoading} className="w-full">
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)]">ليس لديك حساب؟ </span>
          <a href="/auth/register" className="text-xs font-bold text-[var(--text-primary)] hover:underline">
            إنشاء متجر جديد مجاناً
          </a>
        </div>
      </Card>
    </div>
  );
}
