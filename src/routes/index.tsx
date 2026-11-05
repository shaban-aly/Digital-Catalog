import { createFileRoute, Link } from '@tanstack/react-router';
import { QrCode, Smartphone, MessageCircle, Zap, ArrowLeft, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/client/hooks/use-auth';
import { Button } from '@/client/components/ui/Button';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center text-white font-black text-lg shadow-sm">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg text-[var(--brand-primary)] leading-tight">ديجيتال منيو</span>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold -mt-0.5">Digital Menu | دليل السويس</span>
            </div>
          </div>

          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="gap-1.5 font-bold">
                <LayoutDashboard size={14} />
                <span>لوحة إدارة المتجر</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">تسجيل الدخول</Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">ابدأ مجاناً</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>منصة مجانية 100% للتجار وأصحاب الأنشطة</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[var(--brand-primary)] leading-tight tracking-tight">
          المنيو الإلكتروني وقائمة أسعارك <br />
          <span className="text-[var(--brand-accent)]">برمز QR واحد دائم</span> لا يتغير
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          انقل مطعمك أو متجرك إلى العصر الرقمي في دقائق معدودة. أنشئ منيو منتجاتك وقائمتك، واطبع رمز الاستجابة السريعة (QR)، واستقبل طلبات العملاء فوراً على واتساب بدون أي عمولات.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2 font-bold shadow-lg shadow-emerald-700/20">
                <LayoutDashboard className="w-4 h-4" />
                <span>الذهاب إلى لوحة إدارة المتجر</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 gap-2 font-bold shadow-lg shadow-emerald-700/20">
                  <span>أنشئ كتالوجك مجاناً الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                  لوحة إدارة المتجر
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>بدون أي رسوم اشتراك</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>سرعة فائقة على Edge CDN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>متوافق تماماً مع الهواتف</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-4 py-12 bg-white border-y border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-black text-[var(--brand-primary)]">كل ما تحتاجه لإبراز نشاطك التجاري</h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">أدوات مصممة خصيصاً للمطاعم، المخابز، السوبرماركت، محلات الملابس والخدمات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--brand-accent)] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">رمز QR ذكي وثابت</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                اطبع الرمز على طاولاتك أو واجهة محلك مرة واحدة. يمكنك تحديث الأسعار والمنتجات في أي وقت دون الحاجة لإعادة طباعة الرمز مجدداً.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">كتالوج مخصص للهاتف</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                تجربة تصفح سلسة وسريعة تعمل على أي هاتف متصل بالإنترنت في أجزاء من الثانية مع دعم التصنيفات والصور وتفاصيل الخيارات.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">طلبات واتساب بنقرة واحدة</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                يختار الزبون طلباته وخياراته ثم يرسل رسالة منسقة وواضحة مباشرة إلى رقم واتساب الخاص بمتجرك لإتمام الطلب فوراً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 max-w-5xl mx-auto text-center text-xs text-[var(--text-muted)] space-y-2">
        <p>© {new Date().getFullYear()} ديجيتال منيو (Digital Menu) - دليل السويس - جميع الحقوق محفوظة.</p>
        <p>منصة سحابية فائقة السرعة مبنية على أحدث تقنيات Cloudflare Workers و React 19.</p>
      </footer>
    </div>
  );
}
