import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CategoryInput } from '../../../shared/schemas';

interface CategoryFormProps {
  initialValues?: Partial<CategoryInput> | null;
  onSubmit: (values: CategoryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialValues, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [nameAr, setNameAr] = useState(initialValues?.name?.ar || '');
  const [nameEn, setNameEn] = useState(initialValues?.name?.en || '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialValues?.name?.ar);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setError('اسم التصنيف بالعربية مطلوب');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        name: {
          ar: nameAr.trim(),
          en: nameEn.trim() || undefined,
        },
        sort_order: initialValues?.sort_order || 0,
        is_active: initialValues?.is_active ?? true,
      });
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ التصنيف');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right">
      {error && (
        <div
          role="alert"
          className="p-3 text-xs font-semibold text-[var(--accent-promo)] bg-[var(--bg-surface-subtle)] border border-[var(--accent-promo)] rounded-[var(--radius-md)]"
        >
          {error}
        </div>
      )}

      <Input
        id="category-name-ar"
        label="اسم القسم / التصنيف (بالعربية) *"
        placeholder="مثال: المشويات، المشروبات، وجبات التوفير"
        value={nameAr}
        onChange={(e) => setNameAr(e.target.value)}
        error={error || undefined}
        required
      />

      <Input
        id="category-name-en"
        label="اسم القسم (بالإنجليزية - اختياري)"
        placeholder="e.g. Grills, Drinks, Family Meals"
        value={nameEn}
        onChange={(e) => setNameEn(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-[44px]"
          >
            إلغاء
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
          className="min-h-[44px]"
        >
          {isLoading
            ? 'جاري الحفظ...'
            : isEditing
              ? 'تحديث القسم'
              : 'حفظ التصنيف'}
        </Button>
      </div>
    </form>
  );
}
