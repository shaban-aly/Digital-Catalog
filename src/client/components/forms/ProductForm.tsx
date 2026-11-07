import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VariantEditor } from './VariantEditor';
import { compressImageToWebP } from '../../utils/image-compressor';
import { storageService } from '../../../server/services/storage';
import { formatCurrencySymbol } from '../../../shared/currency';
import type { CreateProductInput, ProductVariant, ProductOptionGroup } from '../../../shared/schemas';
import type { Category, Product } from '../../../shared/types';
import { Upload, X, Loader2 } from 'lucide-react';

interface ProductFormProps {
  categories: Category[];
  currency: string;
  initialValues?: Partial<Product> | null;
  onSubmit: (values: CreateProductInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  categories,
  currency,
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const [nameAr, setNameAr] = useState(initialValues?.name?.ar || '');
  const [nameEn, setNameEn] = useState(initialValues?.name?.en || '');
  const [descriptionAr, setDescriptionAr] = useState(initialValues?.description?.ar || '');
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id || categories[0]?.id || ''
  );
  const [basePrice, setBasePrice] = useState<string>(
    initialValues?.base_price !== undefined && initialValues?.base_price !== null
      ? String(initialValues.base_price)
      : ''
  );
  const [compareAtPrice, setCompareAtPrice] = useState<string>(
    initialValues?.compare_at_price ? String(initialValues.compare_at_price) : ''
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    (initialValues as any)?.variants || []
  );
  const [optionGroups] = useState<ProductOptionGroup[]>(
    (initialValues as any)?.option_groups || []
  );
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if ((initialValues as any)?.media && Array.isArray((initialValues as any).media)) {
      return (initialValues as any).media.map((m: any) => m.public_url).filter(Boolean);
    }
    return [];
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialValues?.id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 3) {
      setError('الحد الأقصى هو 3 صور لكل منتج في باقة الانطلاق الأساسية');
      return;
    }

    setIsCompressing(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 1. Client-side compression to WebP (< 100KB)
        const compressed = await compressImageToWebP(file);

        // 2. Upload to Supabase Storage via abstraction
        const storagePath = `products/${Date.now()}-${compressed.file.name}`;
        const uploadResult = await storageService.upload(compressed.blob, storagePath, {
          contentType: 'image/webp',
        });

        setImageUrls((prev) => [...prev, uploadResult.publicUrl]);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل ضغط أو رفع الصورة');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      setError('اسم المنتج بالعربية مطلوب');
      return;
    }
    if (!categoryId) {
      setError('يرجى اختيار تصنيف للمنتج');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        category_id: categoryId,
        name: {
          ar: nameAr.trim(),
          en: nameEn.trim() || undefined,
        },
        description: descriptionAr.trim() ? { ar: descriptionAr.trim() } : undefined,
        base_price: basePrice ? parseFloat(basePrice) : undefined,
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        variants,
        option_groups: optionGroups,
        image_urls: imageUrls,
        status: initialValues?.status || 'active',
        unit: initialValues?.unit || 'piece',
        attributes: initialValues?.attributes || {},
      });
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ المنتج');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-right">
      {error && (
        <div
          role="alert"
          className="p-3 text-xs font-semibold text-[var(--accent-promo)] bg-[var(--bg-surface-subtle)] border border-[var(--accent-promo)] rounded-[var(--radius-md)]"
        >
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="product-name-ar"
          label="اسم المنتج (بالعربية) *"
          placeholder="مثال: بيتزا مارجريتا، كفتة مشوية"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
        />
        <Input
          id="product-name-en"
          label="اسم المنتج (بالإنجليزية - اختياري)"
          placeholder="e.g. Margherita Pizza, Grilled Kofta"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>

      {/* Category Selection */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="product-category"
          className="text-xs font-semibold text-[var(--text-secondary)]"
        >
          التصنيف / القسم *
        </label>
        <select
          id="product-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-all"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.ar}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="product-base-price"
          type="number"
          step="0.01"
          label={`السعر الأساسي (${formatCurrencySymbol(currency)})`}
          placeholder="0.00"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
        />
        <Input
          id="product-compare-price"
          type="number"
          step="0.01"
          label={`السعر قبل الخصم (${formatCurrencySymbol(currency)} - اختياري)`}
          placeholder="0.00"
          value={compareAtPrice}
          onChange={(e) => setCompareAtPrice(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="product-description"
          className="text-xs font-semibold text-[var(--text-secondary)]"
        >
          الوصف والمكونات (اختياري)
        </label>
        <textarea
          id="product-description"
          rows={3}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          placeholder="مكونات الوجبة، تفاصيل العرض، الخ..."
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] resize-none"
        />
      </div>

      {/* Image Upload with Client-Side WebP Compression */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          صور المنتج (حتى 3 صور - تُضغط تلقائياً بصيغة WebP لتسريع التحميل)
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          {imageUrls.map((url, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)] shadow-xs"
            >
              <img src={url} alt={`صورة المنتج ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`حذف الصورة ${i + 1}`}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}

          {imageUrls.length < 3 && (
            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--border-focus)]">
              {isCompressing ? (
                <Loader2 size={20} className="animate-spin text-[var(--primary)]" aria-hidden="true" />
              ) : (
                <>
                  <Upload size={20} aria-hidden="true" />
                  <span className="text-[11px] font-bold mt-1">رفع صورة</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={isCompressing || isLoading}
                className="sr-only"
                aria-label="اختيار ملف صورة للمنتج"
              />
            </label>
          )}
        </div>
      </div>

      {/* Variants (Sizes/Options) */}
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <VariantEditor variants={variants} onChange={setVariants} currency={currency} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading || isCompressing}
            className="min-h-[44px]"
          >
            إلغاء
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || isCompressing}
          className="min-h-[44px]"
        >
          {isLoading
            ? 'جاري الحفظ...'
            : isEditing
              ? 'حفظ تعديلات الصنف'
              : 'حفظ ونشر الصنف'}
        </Button>
      </div>
    </form>
  );
}
