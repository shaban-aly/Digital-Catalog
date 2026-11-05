import { Share2, Phone } from 'lucide-react';

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
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: `تصفح كتالوج ${business.name} الرقمي وقائمة الأسعار`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored if user dismissed share dialog
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الكتالوج إلى الحافظة بنجاح!');
    }
  };

  return (
    <header className="relative bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-right">
      {/* Cover Banner */}
      <div className="h-32 sm:h-44 w-full bg-slate-900 overflow-hidden relative">
        {business.cover_url ? (
          <img
            src={business.cover_url}
            alt={business.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-950" />
        )}

        {/* Share Button Floating */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="مشاركة الكتالوج"
          className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition-colors shadow-sm"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Profile & Info Bar */}
      <div className="px-4 pb-4 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        {/* Logo and Name */}
        <div className="flex items-end gap-3 -mt-10 sm:-mt-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-lg)] border-4 border-[var(--bg-surface)] bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-[var(--primary)]">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="pb-1">
            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
              {business.name}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              قائمة الأسعار والمنتجات الرسمية
            </p>
          </div>
        </div>

        {/* Contact info pill */}
        {business.phone_number && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={`tel:${business.phone_number}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
            >
              <Phone size={13} className="text-[var(--primary)]" />
              <span dir="ltr">{business.phone_number}</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
