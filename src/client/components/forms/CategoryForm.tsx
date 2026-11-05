import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CategoryInput } from '../../../shared/schemas';

interface CategoryFormProps {
  initialValues?: Partial<CategoryInput>;
  onSubmit: (values: CategoryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialValues, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [nameAr, setNameAr] = useState(initialValues?.name?.ar || '');
  const [nameEn, setNameEn] = useState(initialValues?.name?.en || '');
  const [error, setError] = useState<string | null>(null);

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
      <Input
        label="اسم القسم / التصنيف (بالعربية) *"
        placeholder="مثال: المشويات، المشروبات، الحلويات"
        value={nameAr}
        onChange={(e) => setNameAr(e.target.value)}
        error={error || undefined}
        required
      />

      <Input
        label="اسم القسم (بالإنجليزية - اختياري)"
        placeholder="e.g. Grills, Beverages, Desserts"
        value={nameEn}
        onChange={(e) => setNameEn(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ التصنيف'}
        </Button>
      </div>
    </form>
  );
}
