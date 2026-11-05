import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VariantEditor } from './VariantEditor';
import { compressImageToWebP } from '../../utils/image-compressor';
import { storageService } from '../../../server/services/storage';
import { formatCurrencySymbol } from '../../../shared/currency';
import type { CreateProductInput, ProductVariant, ProductOptionGroup } from '../../../shared/schemas';
import type { Category } from '../../../shared/types';
import { Upload, X, Loader2 } from 'lucide-react';

interface ProductFormProps {
  categories: Category[];
  currency: string;
  onSubmit: (values: CreateProductInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProductForm({ categories, currency, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [basePrice, setBasePrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [optionGroups] = useState<ProductOptionGroup[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 3) {
      setError('الحد الأقصى هو 3 صور لكل منتج في الخطة المجانية');
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
        status: 'active',
        unit: 'piece',
        attributes: {},
      });
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ المنتج');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-right">
      {error && (
        <div className="p-3 text-xs font-semibold text-[var(--accent-promo)] bg-rose-50 border border-rose-200 rounded-[var(--radius-md)]">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="اسم المنتج (بالعربية) *"
          placeholder="مثال: بيتزا مارجريتا، شاي كرك"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
        />
        <Input
          label="اسم المنتج (بالإنجليزية - اختياري)"
          placeholder="e.g. Margherita Pizza"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>

      {/* Category Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">التصنيف / القسم *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
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
          type="number"
          step="0.01"
          label={`السعر الأساسي (${formatCurrencySymbol(currency)})`}
          placeholder="0.00"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
        />
        <Input
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
        <label className="text-xs font-semibold text-[var(--text-secondary)]">الوصف (اختياري)</label>
        <textarea
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
            <div key={i} className="relative w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)]">
              <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {imageUrls.length < 3 && (
            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--primary)]">
              {isCompressing ? (
                <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
              ) : (
                <>
                  <Upload size={20} />
                  <span className="text-[10px] mt-1">رفع صورة</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={isCompressing || isLoading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Variants (Sizes/Colors) */}
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <VariantEditor variants={variants} onChange={setVariants} currency={currency} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading || isCompressing}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading || isCompressing}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ ونشر المنتج'}
        </Button>
      </div>
    </form>
  );
}
