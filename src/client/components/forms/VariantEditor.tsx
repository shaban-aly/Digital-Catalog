import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrencySymbol } from '../../../shared/currency';
import type { ProductVariant } from '../../../shared/schemas';

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  currency: string;
}

export function VariantEditor({ variants, onChange, currency }: VariantEditorProps) {
  const addVariant = () => {
    onChange([
      ...variants,
      {
        name: { ar: '' },
        price: 0,
        is_available: true,
        attributes: {},
        sort_order: variants.length,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          الأحجام أو المتغيرات (مثال: عادي، كبير / أبيض، أسود)
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={addVariant} className="gap-1">
          <Plus size={14} /> إضافة حجم / خيار
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] p-3 border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] text-center">
          لا توجد متغيرات. سيتم استخدام السعر الأساسي للمنتج.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2.5 bg-[var(--bg-surface-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
            >
              <Input
                placeholder="اسم الحجم (مثلاً: كبير)"
                value={variant.name.ar}
                onChange={(e) => updateVariant(index, { name: { ...variant.name, ar: e.target.value } })}
                className="h-9"
              />
              <div className="w-32">
                <Input
                  type="number"
                  placeholder={`السعر (${formatCurrencySymbol(currency)})`}
                  value={variant.price || ''}
                  onChange={(e) => updateVariant(index, { price: parseFloat(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(index)}
                className="text-[var(--accent-promo)] h-9 w-9 p-0 shrink-0"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
