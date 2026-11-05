import { useState } from 'react';
import type { PublicProduct, ProductVariant } from '../../shared/schemas';
import { Button } from '../../client/components/ui/Button';
import { buildWhatsAppOrderUrl } from '../utils/whatsapp-formatter';
import { formatCurrencySymbol } from '../../shared/currency';
import { X, Check } from 'lucide-react';

interface ItemDetailDrawerProps {
  product: PublicProduct | null;
  storeName: string;
  storePhone: string | null;
  currency: string;
  onClose: () => void;
}

export function ItemDetailDrawer({
  product,
  storeName,
  storePhone,
  currency,
  onClose,
}: ItemDetailDrawerProps) {
  if (!product) return null;

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );

  // Selected option values state: Map of groupId -> valueId[]
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  // Calculate dynamic total price
  const basePrice = selectedVariant ? selectedVariant.price : product.effective_price;

  let totalOptionDeltas = 0;
  const structuredSelectedOptions: Array<{ groupName: string; optionName: string; priceDelta: number }> = [];

  product.option_groups.forEach((group) => {
    const selectedIds = selectedOptions[group.id || ''] || [];
    group.values.forEach((val) => {
      if (selectedIds.includes(val.id || '')) {
        totalOptionDeltas += val.price_delta || 0;
        structuredSelectedOptions.push({
          groupName: group.name.ar,
          optionName: val.name.ar,
          priceDelta: val.price_delta || 0,
        });
      }
    });
  });

  const finalTotalPrice = basePrice + totalOptionDeltas;

  // Toggle option selection
  const handleOptionToggle = (groupId: string, valueId: string, maxSelections: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(valueId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== valueId) };
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [valueId] };
      }
      if (current.length < maxSelections) {
        return { ...prev, [groupId]: [...current, valueId] };
      }
      return prev;
    });
  };

  const handleWhatsAppOrder = () => {
    if (!storePhone) {
      alert('لم يقم المتجر بإضافة رقم واتساب للتواصل المباشر بعد.');
      return;
    }

    const orderUrl = buildWhatsAppOrderUrl({
      storeName,
      storePhone,
      productName: product.name.ar,
      variantName: selectedVariant?.name.ar,
      selectedOptions: structuredSelectedOptions,
      totalPrice: finalTotalPrice,
      currency,
      catalogUrl: window.location.href,
    });

    window.open(orderUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full sm:max-w-md max-h-[90vh] bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col text-right animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Image */}
        <div className="relative h-48 sm:h-56 bg-slate-900 shrink-0">
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.name.ar}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
              لا توجد صورة
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 left-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-grow">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{product.name.ar}</h2>
            {product.description?.ar && (
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {product.description.ar}
              </p>
            )}
          </div>

          {/* Variants Selector (e.g. Sizes) */}
          {product.variants.length > 0 && (
            <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
              <span className="text-xs font-bold text-[var(--text-secondary)]">اختر الحجم / المتغير:</span>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <span>{variant.name.ar}</span>
                      <span>
                        {variant.price} {formatCurrencySymbol(currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option Groups (Modifiers / Add-ons) */}
          {product.option_groups.map((group) => {
            const selectedIds = selectedOptions[group.id || ''] || [];
            return (
              <div key={group.id} className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-secondary)]">{group.name.ar}</span>
                  {group.is_required && (
                    <span className="text-[10px] text-[var(--accent-promo)] font-semibold">إجباري</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {group.values.map((val) => {
                    const isChecked = selectedIds.includes(val.id || '');
                    return (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() => handleOptionToggle(group.id || '', val.id || '', group.max_selections)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-[var(--radius-md)] border text-xs transition-all ${
                          isChecked
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 font-bold text-[var(--primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border-subtle)]'
                            }`}
                          >
                            {isChecked && <Check size={12} />}
                          </div>
                          <span>{val.name.ar}</span>
                        </div>
                        {val.price_delta > 0 && (
                          <span className="text-xs font-semibold">
                            +{val.price_delta} {formatCurrencySymbol(currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar with Price & WhatsApp Button */}
        <div className="p-4 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block">الإجمالي:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[var(--text-primary)]">
                {finalTotalPrice.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {formatCurrencySymbol(currency)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="whatsapp"
            onClick={handleWhatsAppOrder}
            className="flex-grow max-w-[220px]"
          >
            الطلب عبر WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
