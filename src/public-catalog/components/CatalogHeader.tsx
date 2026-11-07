import { useState } from 'react';
import { Share2, Phone } from 'lucide-react';
import { useDialog } from '../../client/components/ui/Dialog';

interface CatalogHeaderProps {
  business: {
    name: string;
    logo_url: string | null;
    cover_url: string | null;
    phone_number: string | null;
    currency_code: string;
  };
}

export function CatalogHeader({ business }: CatalogHeaderProps) {
  const dialog = useDialog();
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: `تصفح منيو ${business.name} الرقمي وقائمة الأسعار`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored if user dismissed share dialog
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      await dialog.alert({
        title: 'تم نسخ الرابط',
        message: 'تم نسخ رابط الكتالوج إلى الحافظة بنجاح، يمكنك الآن لصقه ومشاركته مع عملائك.',
        variant: 'success',
      });
    }
  };

  return (
    <header className="relative bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-right">
      {/* Cover Banner */}
      <div className="h-32 sm:h-44 w-full bg-slate-900 overflow-hidden relative">
        {business.cover_url && !coverFailed ? (
          <img
            src={business.cover_url}
            alt={business.name}
            onError={() => setCoverFailed(true)}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-950" />
        )}

        {/* Share Button Floating (44px touch target) */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="مشاركة رابط الكتالوج"
          className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white min-w-[44px] min-h-[44px] rounded-full hover:bg-black/70 transition-colors shadow-sm flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Profile & Info Bar */}
      <div className="px-4 pb-4 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        {/* Logo and Name */}
        <div className="flex items-end gap-3 -mt-10 sm:-mt-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-lg)] border-4 border-[var(--bg-surface)] bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
            {business.logo_url && !logoFailed ? (
              <img
                src={business.logo_url}
                alt={business.name}
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-[var(--primary)]">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="pb-1">
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
              {business.name}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
              المنيو الإلكتروني وقائمة الأسعار الرسمية
            </p>
          </div>
        </div>

        {/* Contact info pill (44px touch target) */}
        {business.phone_number && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={`tel:${business.phone_number}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <Phone size={14} className="text-[var(--primary)]" aria-hidden="true" />
              <span dir="ltr">{business.phone_number}</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
