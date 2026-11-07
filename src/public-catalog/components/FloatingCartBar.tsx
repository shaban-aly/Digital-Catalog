import { ShoppingBag, ArrowLeft, MessageCircle, Check } from 'lucide-react';
import { formatCurrencySymbol } from '../../shared/currency.ts';
import { Button } from '../../client/components/ui/Button';

interface FloatingCartBarProps {
  totalQuantity: number;
  totalAmount: number;
  currency: string;
  storeName: string;
  storePhone: string | null;
  orderSubmitted?: boolean;
  onOpenCart: () => void;
}

export function FloatingCartBar({
  totalQuantity,
  totalAmount,
  currency,
  storeName,
  storePhone,
  orderSubmitted = false,
  onOpenCart,
}: FloatingCartBarProps) {
  const displayCurrency = formatCurrencySymbol(currency);

  // If cart has items, render the persistent action bar
  if (totalQuantity > 0) {
    return (
      <aside
        aria-label="شريط سلة الطلبات العائم"
        className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                orderSubmitted
                  ? 'bg-emerald-50 text-[var(--badge-avail)] border border-emerald-200'
                  : 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {orderSubmitted ? <Check size={20} /> : <ShoppingBag size={20} />}
            </div>
            <span
              className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
              dir="ltr"
            >
              {totalQuantity}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] block">
              {orderSubmitted ? (
                <span className="text-[var(--badge-avail)] font-extrabold">تم فتح الطلب في واتساب</span>
              ) : (
                'إجمالي السلة'
              )}
            </span>
            <span className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1">
              <span dir="ltr">{totalAmount.toFixed(2)}</span>
              <span>{displayCurrency}</span>
            </span>
          </div>
        </div>

        {/* Primary ink button: opening cart preview is not WhatsApp action */}
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onOpenCart}
          className="gap-2 shrink-0 font-extrabold px-5 min-h-[44px]"
        >
          <span>معاينة السلة</span>
          <ArrowLeft size={16} className="rtl:rotate-0" />
        </Button>
      </aside>
    );
  }

  // Fallback when cart is empty: direct store inquiry
  if (!storePhone) return null;

  const handleOpenWhatsApp = () => {
    let cleanPhone = storePhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = `2${cleanPhone}`;
    }
    const message = encodeURIComponent(`مرحباً ${storeName}، أود الاستفسار عن المنتجات وقائمة الأسعار.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <aside
      aria-label="شريط التواصل المباشر السريع"
      className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 max-w-lg mx-auto shadow-lg"
    >
      <div className="text-right">
        <span className="text-xs font-bold text-[var(--text-primary)] block">طلب أو استفسار سريع؟</span>
        <span className="text-[11px] text-[var(--text-muted)]">تواصل مباشرة مع إدارة المتجر</span>
      </div>

      <Button
        type="button"
        variant="whatsapp"
        size="md"
        onClick={handleOpenWhatsApp}
        className="gap-2 shrink-0 min-h-[44px]"
      >
        <MessageCircle size={18} />
        <span>تواصل عبر WhatsApp</span>
      </Button>
    </aside>
  );
}
