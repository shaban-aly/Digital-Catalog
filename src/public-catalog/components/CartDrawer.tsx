import { useEffect } from 'react';
import type { CartItemType } from '../../shared/schemas.ts';
import { Button } from '../../client/components/ui/Button';
import { useDialog } from '../../client/components/ui/Dialog';
import { buildMultiItemWhatsAppOrderUrl } from '../utils/whatsapp-cart-formatter.ts';
import { formatCurrencySymbol } from '../../shared/currency.ts';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  storePhone: string | null;
  currency: string;
  items: CartItemType[];
  totalAmount: number;
  totalQuantity: number;
  customerName: string;
  fulfillmentNotes: string;
  orderSubmitted?: boolean;
  hasOutOfStockItems?: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSetCustomerName: (name: string) => void;
  onSetFulfillmentNotes: (notes: string) => void;
  onOrderSubmitted?: (submitted: boolean) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  storeName,
  storePhone,
  currency,
  items,
  totalAmount,
  totalQuantity,
  customerName,
  fulfillmentNotes,
  orderSubmitted = false,
  hasOutOfStockItems = false,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSetCustomerName,
  onSetFulfillmentNotes,
  onOrderSubmitted,
}: CartDrawerProps) {
  const dialog = useDialog();

  // Handle Escape key to dismiss drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayCurrency = formatCurrencySymbol(currency);
  const outOfStockPresent = hasOutOfStockItems || items.some((i) => i.isAvailable === false);

  const handleSendWhatsAppOrder = async () => {
    if (!storePhone) {
      await dialog.alert({
        title: 'رقم واتساب غير متوفر',
        message: 'لم يقم المتجر بتفعيل رقم واتساب لتلقي الطلبات بعد.',
        variant: 'warning',
      });
      return;
    }

    if (items.length === 0) {
      await dialog.alert({
        title: 'سلة الطلبات فارغة',
        message: 'سلة المشتريات فارغة. يرجى إضافة أصناف أولاً للمتابعة.',
        variant: 'info',
      });
      return;
    }

    if (outOfStockPresent) {
      await dialog.alert({
        title: 'أصناف غير متوفرة',
        message: 'يرجى حذف أو تعديل الأصناف غير المتوفرة من السلة لتتمكن من إرسال الطلب.',
        variant: 'warning',
      });
      return;
    }

    const orderUrl = buildMultiItemWhatsAppOrderUrl({
      storeName,
      storePhone,
      items,
      customerName,
      fulfillmentNotes,
      totalAmount,
      currency,
      catalogUrl: window.location.href,
    });

    window.open(orderUrl, '_blank');
    onOrderSubmitted?.(true);
  };

  const handleClearCartPrompt = async () => {
    const confirmed = await dialog.confirm({
      title: 'إفراغ سلة الطلبات',
      message: 'هل أنت متأكد من رغبتك في إفراغ سلة المشتريات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'نعم، إفراغ السلة',
      cancelText: 'تراجع',
      variant: 'danger',
    });
    if (confirmed) {
      onClearCart();
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="w-full sm:max-w-lg max-h-[92vh] bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col text-right animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[var(--primary)]" aria-hidden="true" />
            <h2 id="cart-drawer-title" className="text-base font-black text-[var(--text-primary)]">
              سلة الطلبات ({totalQuantity})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCartPrompt}
                className="text-xs text-[var(--accent-promo)] hover:bg-rose-50 font-bold min-h-[44px] px-3"
              >
                إفراغ السلة
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] cursor-pointer"
              aria-label="إغلاق سلة الطلبات"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Post-Submission Success Banner */}
        {orderSubmitted && items.length > 0 && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3.5 flex items-center justify-between gap-3 text-emerald-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-[var(--badge-avail)] shrink-0" aria-hidden="true" />
              <div>
                <span className="text-xs font-black block">تم فتح الطلب في WhatsApp بنجاح</span>
                <span className="text-[11px] text-emerald-800 block">
                  طلبك محفوظ هنا كمرجع، ويمكنك إفراغ السلة عند الانتهاء.
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="text-xs font-bold bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 min-h-[40px] px-3 shrink-0"
            >
              إفراغ السلة
            </Button>
          </div>
        )}

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {items.length === 0 ? (
            <div className="py-14 text-center space-y-3 bg-[var(--bg-surface-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6 my-4">
              <ShoppingBag size={40} className="mx-auto text-[var(--text-muted)] opacity-50" aria-hidden="true" />
              <p className="text-base font-extrabold text-[var(--text-primary)]">سلة مشترياتك فارغة حالياً</p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
                تصفح قائمة الطعام أو المنتجات وأضف الأصناف التي ترغب بطلبها بسهولة.
              </p>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-[var(--border-subtle)]">
              {items.map((item) => {
                const isOutOfStock = item.isAvailable === false;
                return (
                  <div
                    key={item.id}
                    className={`pt-3 first:pt-0 flex items-start justify-between gap-3 ${
                      isOutOfStock ? 'opacity-80 bg-rose-50/70 p-2.5 rounded-[var(--radius-md)] border border-rose-200' : ''
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                        <span>{item.productName}</span>
                        {item.variantName && (
                          <span className="text-xs text-[var(--text-secondary)] font-bold bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            {item.variantName}
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[11px] font-black bg-rose-100 text-[var(--accent-promo)] px-2 py-0.5 rounded-full border border-rose-200">
                            غير متوفر حالياً
                          </span>
                        )}
                        {item.priceChanged && (
                          <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            تم تحديث السعر
                          </span>
                        )}
                      </div>

                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-[var(--text-secondary)] font-medium">
                          {item.selectedOptions.map((opt) => opt.optionName).join(' ، ')}
                        </div>
                      )}

                      <div className="text-xs font-black text-[var(--text-primary)] pt-0.5" dir="ltr">
                        {item.lineTotal.toFixed(2)} {displayCurrency}
                      </div>
                    </div>

                    {/* Ergonomic Quantity Controls (>= 44px min-h) */}
                    <div className="flex items-center gap-1.5 bg-[var(--bg-surface-subtle)] rounded-[var(--radius-md)] p-1 border border-[var(--border-subtle)] shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity === 1
                            ? onRemoveItem(item.id)
                            : onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-xs hover:bg-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] cursor-pointer"
                        aria-label={item.quantity === 1 ? 'حذف الصنف من السلة' : 'تقليل الكمية'}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 size={16} className="text-[var(--accent-promo)]" />
                        ) : (
                          <Minus size={16} />
                        )}
                      </button>
                      <span className="w-7 text-center text-xs font-black text-[var(--text-primary)]" dir="ltr">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-xs hover:bg-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] cursor-pointer"
                        aria-label="زيادة الكمية"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Optional Order Details */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <h3 className="text-xs font-black text-[var(--text-primary)]">
                بيانات إضافية للتوصيل أو تحضير الطلب:
              </h3>
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="cart-customer-name" className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                    اسم العميل (اختياري)
                  </label>
                  <input
                    id="cart-customer-name"
                    type="text"
                    placeholder="مثال: محمد أحمد"
                    value={customerName}
                    onChange={(e) => onSetCustomerName(e.target.value)}
                    className="w-full text-xs min-h-[44px] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] focus:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] text-right"
                  />
                </div>
                <div>
                  <label htmlFor="cart-notes" className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                    ملاحظات الطلب (رقم الطاولة، العنوان، أو تعليمات خاصة)
                  </label>
                  <textarea
                    id="cart-notes"
                    placeholder="مثال: طاولة رقم 4، بدون بصل، أو العنوان بالتفصيل..."
                    value={fulfillmentNotes}
                    onChange={(e) => onSetFulfillmentNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] focus:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] text-right"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Total and Order Button */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shrink-0 shadow-lg">
            {outOfStockPresent && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-[var(--radius-md)] p-3 flex items-center gap-2 text-rose-900 text-xs font-bold"
              >
                <AlertTriangle size={16} className="text-[var(--accent-promo)] shrink-0" aria-hidden="true" />
                <span>يحتوي الطلب على أصناف غير متوفرة حالياً؛ يرجى حذفها لإرسال الطلب.</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[var(--text-secondary)]">الإجمالي النهائي:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[var(--text-primary)]" dir="ltr">
                  {totalAmount.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {displayCurrency}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="whatsapp"
              size="lg"
              disabled={outOfStockPresent}
              onClick={handleSendWhatsAppOrder}
              className="w-full min-h-[48px] gap-2.5 font-black text-sm"
            >
              <MessageCircle size={20} />
              <span>إرسال الطلب عبر WhatsApp</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
