import { useState, useEffect } from 'react';
import type { PublicProduct, ProductVariant } from '../../shared/schemas';
import { Button } from '../../client/components/ui/Button';
import { useDialog } from '../../client/components/ui/Dialog';
import { buildWhatsAppOrderUrl } from '../utils/whatsapp-formatter';
import { formatCurrencySymbol } from '../../shared/currency';
import { X, Check, Plus, Minus, AlertCircle } from 'lucide-react';

interface ItemDetailDrawerProps {
  product: PublicProduct | null;
  storeName: string;
  storePhone: string | null;
  currency: string;
  onClose: () => void;
  onAddToCart?: (item: {
    productId: string;
    productName: string;
    coverImageUrl?: string | null;
    unitPrice: number;
    quantity: number;
    variantId?: string;
    variantName?: string;
    selectedOptions?: Array<{
      groupId: string;
      groupName: string;
      valueId: string;
      optionName: string;
      priceDelta: number;
    }>;
  }) => void;
}

export function ItemDetailDrawer({
  product,
  storeName,
  storePhone,
  currency,
  onClose,
  onAddToCart,
}: ItemDetailDrawerProps) {
  const dialog = useDialog();
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Selected option values state: Map of groupId -> valueId[]
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  // Reset state when a new product is opened
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null);
      setSelectedOptions({});
      setQuantity(1);
      setImageError(false);
      setValidationAttempted(false);
    }
  }, [product]);

  // Keyboard accessibility: Escape key to dismiss drawer
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  // Calculate dynamic total price
  const basePrice = selectedVariant ? selectedVariant.price : product.effective_price;

  let totalOptionDeltas = 0;
  const structuredSelectedOptions: Array<{
    groupId: string;
    groupName: string;
    valueId: string;
    optionName: string;
    priceDelta: number;
  }> = [];

  product.option_groups.forEach((group) => {
    const selectedIds = selectedOptions[group.id || ''] || [];
    group.values.forEach((val) => {
      if (selectedIds.includes(val.id || '')) {
        totalOptionDeltas += val.price_delta || 0;
        structuredSelectedOptions.push({
          groupId: group.id || '',
          groupName: group.name.ar,
          valueId: val.id || '',
          optionName: val.name.ar,
          priceDelta: val.price_delta || 0,
        });
      }
    });
  });

  const unitPrice = basePrice + totalOptionDeltas;
  const finalTotalPrice = unitPrice * quantity;

  // Check required modifier groups
  const missingRequiredGroups = product.option_groups.filter((group) => {
    if (!group.is_required) return false;
    const selected = selectedOptions[group.id || ''] || [];
    return selected.length === 0;
  });

  const isValid = missingRequiredGroups.length === 0;

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

  const handleAddToCart = () => {
    if (!isValid) {
      setValidationAttempted(true);
      return;
    }

    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        productName: product.name.ar,
        coverImageUrl: product.cover_image_url,
        unitPrice,
        quantity,
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name.ar,
        selectedOptions: structuredSelectedOptions,
      });
      onClose();
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!isValid) {
      setValidationAttempted(true);
      return;
    }

    if (!storePhone) {
      await dialog.alert({
        title: 'رقم واتساب غير متوفر',
        message: 'لم يقم المتجر بإضافة رقم واتساب للتواصل المباشر بعد.',
        variant: 'warning',
      });
      return;
    }

    const orderUrl = buildWhatsAppOrderUrl({
      storeName,
      storePhone,
      productName: `${product.name.ar} (الكمية: ${quantity})`,
      variantName: selectedVariant?.name.ar,
      selectedOptions: structuredSelectedOptions,
      totalPrice: finalTotalPrice,
      currency,
      catalogUrl: window.location.href,
    });

    window.open(orderUrl, '_blank');
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
        aria-labelledby="product-drawer-title"
        className="w-full sm:max-w-md max-h-[92vh] bg-[var(--bg-surface)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col text-right animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Product Image */}
        <div className="relative h-48 sm:h-56 bg-slate-900 shrink-0 overflow-hidden">
          {product.cover_image_url && !imageError ? (
            <img
              src={product.cover_image_url}
              alt={product.name.ar}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] gap-2">
              <span className="text-3xl font-black text-[var(--primary)] opacity-40">
                {product.name.ar.slice(0, 2)}
              </span>
              <span className="text-xs font-semibold">قائمة طعام إلكترونية</span>
            </div>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق تفاصيل الصنف"
            className="absolute top-3 left-3 bg-black/60 text-white min-w-[44px] min-h-[44px] rounded-full hover:bg-black/80 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-grow">
          <div>
            <h2 id="product-drawer-title" className="text-lg font-black text-[var(--text-primary)]">
              {product.name.ar}
            </h2>
            {product.description?.ar && (
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {product.description.ar}
              </p>
            )}
          </div>

          {/* Validation Warning Alert */}
          {validationAttempted && !isValid && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-[var(--radius-md)] flex items-center gap-2 text-rose-900 text-xs font-bold animate-in fade-in"
            >
              <AlertCircle size={16} className="text-[var(--accent-promo)] shrink-0" />
              <span>يرجى اختيار الخيارات الإجبارية المحددة باللون الأحمر للمتابعة.</span>
            </div>
          )}

          {/* Variants Selector (e.g. Sizes) */}
          {product.variants.length > 0 && (
            <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
              <span className="text-xs font-black text-[var(--text-primary)] block">
                اختر الحجم / النوع:
              </span>
              <div role="radiogroup" aria-label="أحجام الصنف" className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between p-3 rounded-[var(--radius-md)] border text-xs font-bold transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      <span>{variant.name.ar}</span>
                      <span dir="ltr">
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
            const isSingleChoice = group.max_selections === 1;
            const isGroupMissing =
              validationAttempted && group.is_required && selectedIds.length === 0;

            return (
              <div
                key={group.id}
                className={`space-y-2 border-t border-[var(--border-subtle)] pt-3 rounded-lg p-1.5 transition-colors ${
                  isGroupMissing ? 'bg-rose-50/70 border-rose-200' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[var(--text-primary)]">{group.name.ar}</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">
                      ({isSingleChoice ? 'اختيار واحد' : `حتى ${group.max_selections} خيارات`})
                    </span>
                  </div>
                  {group.is_required ? (
                    <span className="text-[11px] text-[var(--accent-promo)] font-black bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      إجباري
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">اختياري</span>
                  )}
                </div>

                <div
                  role={isSingleChoice ? 'radiogroup' : 'group'}
                  aria-label={group.name.ar}
                  className="space-y-1.5"
                >
                  {group.values.map((val) => {
                    const isChecked = selectedIds.includes(val.id || '');
                    return (
                      <button
                        key={val.id}
                        type="button"
                        role={isSingleChoice ? 'radio' : 'checkbox'}
                        aria-checked={isChecked}
                        onClick={() =>
                          handleOptionToggle(group.id || '', val.id || '', group.max_selections)
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] border text-xs transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
                          isChecked
                            ? 'border-[var(--primary)] bg-[var(--bg-surface-subtle)] font-bold text-[var(--text-primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Visual Radio (Round) vs Checkbox (Square) */}
                          {isSingleChoice ? (
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'border-[var(--primary)] bg-white'
                                  : 'border-[var(--border-subtle)]'
                              }`}
                            >
                              {isChecked && (
                                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                              )}
                            </div>
                          ) : (
                            <div
                              className={`w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                                  : 'border-[var(--border-subtle)]'
                              }`}
                            >
                              {isChecked && <Check size={12} />}
                            </div>
                          )}
                          <span>{val.name.ar}</span>
                        </div>

                        {val.price_delta > 0 && (
                          <span className="text-xs font-bold text-[var(--text-primary)]" dir="ltr">
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

          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <span className="text-xs font-black text-[var(--text-primary)]">الكمية:</span>
            <div className="flex items-center gap-3 bg-[var(--bg-surface-subtle)] p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
              <button
                type="button"
                aria-label="إنقاص الكمية"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-xs hover:bg-[var(--border-subtle)] disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-black text-[var(--text-primary)]" dir="ltr">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="زيادة الكمية"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-xs hover:bg-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar with Price & Order/Cart Buttons */}
        <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 shadow-lg">
          <div className="text-right">
            <span className="text-[11px] text-[var(--text-muted)] block font-semibold">الإجمالي:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-[var(--text-primary)]" dir="ltr">
                {finalTotalPrice.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {formatCurrencySymbol(currency)}
              </span>
            </div>
          </div>

          {onAddToCart ? (
            <div className="flex items-center gap-2 flex-grow max-w-[280px]">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleAddToCart}
                className="flex-1 text-xs font-bold min-h-[44px]"
              >
                إضافة إلى السلة
              </Button>
              <Button
                type="button"
                variant="whatsapp"
                size="md"
                onClick={handleWhatsAppOrder}
                className="shrink-0 text-xs px-3 min-h-[44px]"
                title="طلب فوري مباشر عبر واتساب"
              >
                طلب فوري
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="whatsapp"
              size="md"
              onClick={handleWhatsAppOrder}
              className="flex-grow max-w-[220px] min-h-[44px]"
            >
              الطلب عبر WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
