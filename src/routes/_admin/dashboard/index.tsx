import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { analyticsService, type AnalyticsSummary } from '@/server/services/analytics-summary';
import { qrService } from '@/server/services/qr';
import { productService } from '@/server/services/product';
import { QRDownloadModal } from '@/client/components/qr/QRDownloadModal';
import { Card } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import {
  QrCode,
  Eye,
  MessageCircle,
  Package,
  Loader2,
  Copy,
  Check,
  Plus,
  UtensilsCrossed,
  ArrowUpRight,
} from 'lucide-react';
import type { Business } from '@/shared/types';

export const Route = createFileRoute('/_admin/dashboard/')({
  component: DashboardOverviewPage,
});

function DashboardOverviewPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrRedirectUrl, setQrRedirectUrl] = useState('');
  const [qrShortCode, setQrShortCode] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!user) return;
      try {
        const b = await businessService.getBusinessByUserId(user.id);
        if (b && isMounted) {
          setBusiness(b);
          const [m, qr, prods] = await Promise.all([
            analyticsService.getBusinessMetrics(b.id),
            qrService.getOrCreateQRCode({ businessId: b.id }),
            productService.getProducts(b.id).catch(() => []),
          ]);

          if (isMounted) {
            setMetrics(m);
            setQrRedirectUrl(qr.redirect_url);
            setQrShortCode(qr.short_code);
            setProductsCount(prods.length);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (!isAuthLoading) {
      loadDashboardData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center"
      >
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" aria-hidden="true" />
        <p className="text-xs font-bold text-[var(--text-muted)]">
          جاري تحميل بيانات لوحة التحكم...
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] my-12 shadow-sm">
        <h1 className="text-base font-bold text-[var(--text-primary)]">
          لم يتم العثور على متجر مرتبط بهذا الحساب
        </h1>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          يبدو أنك لم تكمل إعداد بيانات متجرك بعد. يمكنك إنشاء وتجهيز نشاطك التجاري الآن لتفعيل قائمتك الرقمية.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] w-full"
        >
          إعداد متجرك التجاري الآن
        </Link>
      </div>
    );
  }

  const catalogPublicUrl = `/c/${business.slug}`;
  const subdomainUrl = `https://${business.slug}.digitalmenu.daleel-al-suez.com/`;

  const copySubdomain = async () => {
    try {
      await navigator.clipboard.writeText(subdomainUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-right max-w-5xl mx-auto">
      {/* Dedicated Store Menu Link Card */}
      <Card className="p-5 sm:p-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              <UtensilsCrossed size={16} className="text-[var(--primary)]" aria-hidden="true" />
              <span>رابط قائمة طعام متجرك (المنيو الرقمي)</span>
            </div>
            <div
              className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-wide bg-[var(--bg-surface-subtle)] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] inline-block select-all"
              dir="ltr"
            >
              {subdomainUrl}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={copySubdomain}
              className="gap-2 text-xs sm:text-sm font-bold min-h-[44px]"
              aria-label={copiedUrl ? 'تم نسخ رابط المنيو إلى الحافظة' : 'نسخ رابط المنيو الرقمي'}
            >
              {copiedUrl ? (
                <Check size={16} className="text-[var(--badge-avail)]" aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              <span>{copiedUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </Button>

            <a
              href={subdomainUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="زيارة المنيو الرقمي لمتجرك في نافذة جديدة"
              className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] gap-2"
            >
              <ArrowUpRight size={16} aria-hidden="true" />
              <span>زيارة المتجر</span>
            </a>
          </div>
        </div>

        {/* Screen Reader Live Feedback */}
        <div aria-live="polite" className="sr-only">
          {copiedUrl && 'تم نسخ رابط المنيو بنجاح'}
        </div>
      </Card>

      {/* Top Welcome & Quick Actions Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 sm:p-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">
            مرحباً، {business.name}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            الباقة الحالية:{' '}
            <span className="font-bold text-[var(--text-primary)]">
              باقة الانطلاق الأساسية
            </span>{' '}
            (سقف 100 صنف و15 تصنيفاً)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/dashboard/products"
            className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] gap-1.5"
          >
            <Plus size={16} aria-hidden="true" />
            <span>إضافة صنف جديد</span>
          </Link>

          <Button
            variant="outline"
            size="md"
            onClick={() => setQrModalOpen(true)}
            className="gap-1.5 min-h-[44px]"
          >
            <QrCode size={16} aria-hidden="true" />
            <span>رمز QR</span>
          </Button>

          <a
            href={catalogPublicUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="معاينة قائمة الطعام في نافذة جديدة"
            className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] gap-1.5"
          >
            <ArrowUpRight size={15} aria-hidden="true" />
            <span>معاينة المنيو</span>
          </a>
        </div>
      </header>

      {/* Metrics Cards Section */}
      <section aria-labelledby="metrics-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="metrics-heading" className="text-sm font-bold text-[var(--text-primary)]">
            مؤشرات التفاعل والأداء
          </h2>
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            (إجمالي التفاعل التراكمي منذ تدشين المتجر)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold">مسحات QR</span>
              <QrCode size={18} aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]" dir="ltr">
              {metrics?.totalScans ?? 0}
            </div>
            <p className="text-[11px] font-bold text-[var(--text-muted)]">
              إجمالي مسح الرمز الفعلي للطاولات
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold">زيارات الكتالوج</span>
              <Eye size={18} aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]" dir="ltr">
              {metrics?.totalViews ?? 0}
            </div>
            <p className="text-[11px] font-bold text-[var(--text-muted)]">
              مشاهدات وتصفح قائمة الطعام
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold">نقرات WhatsApp</span>
              <MessageCircle size={18} className="text-[var(--whatsapp-green)]" aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]" dir="ltr">
              {metrics?.totalWhatsAppClicks ?? 0}
            </div>
            <p className="text-[11px] font-bold text-[var(--text-muted)]">
              طلبات واستفسارات الواتساب المباشرة
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-semibold">سعة الأصناف</span>
              <Package size={18} aria-hidden="true" />
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]" dir="ltr">
              {productsCount !== null ? `${productsCount} / 100` : '...'}
            </div>
            <p className="text-[11px] font-bold text-[var(--text-muted)]">
              المستخدم في باقة الانطلاق الأساسية
            </p>
          </Card>
        </div>
      </section>

      {/* Quick Navigation Cards Section */}
      <section aria-labelledby="quick-actions-heading" className="space-y-3">
        <h2 id="quick-actions-heading" className="text-sm font-bold text-[var(--text-primary)]">
          الإجراءات الأساسية
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                إدارة الأصناف والوجبات
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                إضافة وجبات جديدة، ضبط الأسعار، وتحديد التوفر الفوري
              </p>
            </div>
            <Link
              to="/dashboard/products"
              className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] shrink-0"
            >
              فتح الأصناف
            </Link>
          </Card>

          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                رمز QR المطبوع للطاولات
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                تنزيل الرمز بجودة فائقة جاهز للطباعة على الطاولات
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setQrModalOpen(true)}
              className="min-h-[44px] shrink-0"
            >
              تنزيل الرمز
            </Button>
          </Card>
        </div>
      </section>

      {/* QR Modal */}
      {qrModalOpen && (
        <QRDownloadModal
          shortCode={qrShortCode}
          storeName={business.name}
          redirectUrl={qrRedirectUrl}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}
