import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { analyticsService, type AnalyticsSummary } from '@/server/services/analytics-summary';
import { qrService } from '@/server/services/qr';
import { QRDownloadModal } from '@/client/components/qr/QRDownloadModal';
import { Card } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { QrCode, Eye, MessageCircle, Package, ExternalLink, Loader2 } from 'lucide-react';
import type { Business } from '@/shared/types';

export const Route = createFileRoute('/_admin/dashboard/')({
  component: DashboardOverviewPage,
});

export function DashboardOverviewPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrRedirectUrl, setQrRedirectUrl] = useState('');
  const [qrShortCode, setQrShortCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        const b = await businessService.getBusinessByUserId(user.id);
        if (b) {
          setBusiness(b);
          const [m, qr] = await Promise.all([
            analyticsService.getBusinessMetrics(b.id),
            qrService.getOrCreateQRCode({ businessId: b.id, catalogId: b.id }),
          ]);
          setMetrics(m);
          setQrRedirectUrl(qr.redirect_url);
          setQrShortCode(qr.short_code);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      loadDashboardData();
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        لم يتم العثور على نشاط تجاري مرتبط بهذا الحساب.
      </div>
    );
  }

  const catalogPublicUrl = `https://<my-name>.daleel-al-suez.com/c/${business.slug}`;

  return (
    <div className="p-4 sm:p-6 space-y-6 text-right max-w-5xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">مرحباً، {business.name}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            الباقة الحالية: <span className="font-bold text-emerald-600">Free Forever</span> (سقف 100 منتج و15 تصنيفاً)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setQrModalOpen(true)} className="gap-1.5">
            <QrCode size={16} /> رمز QR
          </Button>
          <a href={catalogPublicUrl} target="_blank" rel="noreferrer">
            <Button variant="primary" size="sm" className="gap-1.5">
              <ExternalLink size={14} /> عرض الكتالوج
            </Button>
          </a>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold">مسحات QR</span>
            <QrCode size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics?.totalScans || 0}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">إجمالي مسح الرمز الفعلي</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold">زيارات الكتالوج</span>
            <Eye size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics?.totalViews || 0}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">مشاهدات صفحات الكتالوج</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold">نقرات WhatsApp</span>
            <MessageCircle size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {metrics?.totalWhatsAppClicks || 0}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">طلبات واستفسارات الواتساب</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold">سعة المنتجات</span>
            <Package size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            / 100
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">المتاح في الخطة المجانية</p>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">إدارة المنتجات والأصناف</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">إضافة وجبات جديدة، تعديل الأسعار، وتحديد التوفر</p>
          </div>
          <a href="/dashboard/products">
            <Button variant="secondary" size="sm">فتح المنتجات</Button>
          </a>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">رمز QR المطبوع</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">تنزيل الرمز بجودة عالية للطباعة على الطاولات</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setQrModalOpen(true)}>
            تنزيل الرمز
          </Button>
        </Card>
      </div>

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
