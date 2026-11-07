import { useState } from 'react';
import { Button } from '../ui/Button';
import { useDialog } from '../ui/Dialog';
import { productService } from '@/server/services/product';
import { CheckCircle2, XCircle, Edit3, Trash2, Loader2 } from 'lucide-react';

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  isAvailable: boolean;
  onRefresh: () => void;
  onEdit?: (productId: string) => void;
  onToggleAvailability?: (productId: string, newStatus: boolean) => Promise<void> | void;
}

export function ProductRowActions({
  productId,
  productName,
  isAvailable,
  onRefresh,
  onEdit,
  onToggleAvailability,
}: ProductRowActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const dialog = useDialog();

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      if (onToggleAvailability) {
        await onToggleAvailability(productId, !isAvailable);
      } else {
        await productService.setAvailability(productId, !isAvailable);
        onRefresh();
      }
    } catch (err: any) {
      console.error('Failed to toggle product status:', err);
      await dialog.alert({
        title: 'تعذر تعديل الحالة',
        message: err?.message || 'حدث خطأ غير متوقع أثناء تعديل حالة التوفر. يرجى المحاولة مرة أخرى.',
        variant: 'danger',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await dialog.confirm({
      title: 'حذف الصنف نهائياً',
      message: `هل أنت متأكد من رغبتك في حذف "${productName}"؟ سيتم حذفه من قائمة طعام الزبائن فوراً ولا يمكن التراجع عن هذه الخطوة.`,
      confirmText: 'نعم، حذف الصنف',
      cancelText: 'إلغاء',
      variant: 'danger',
    });

    if (confirmed) {
      setIsUpdating(true);
      try {
        await productService.deleteProduct(productId);
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete product:', err);
        await dialog.alert({
          title: 'تعذر حذف الصنف',
          message: err?.message || 'حدث خطأ أثناء محاولة الحذف. يرجى المحاولة مرة أخرى.',
          variant: 'danger',
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Toggle Availability Button */}
      <Button
        type="button"
        variant="ghost"
        size="md"
        disabled={isUpdating}
        onClick={handleToggle}
        aria-label={
          isAvailable
            ? `تعطيل الصنف "${productName}" وجعله غير متوفر`
            : `تفعيل الصنف "${productName}" وجعله متوفراً`
        }
        className={`min-h-[44px] px-3 text-xs gap-1.5 hover:bg-[var(--bg-surface-subtle)] font-bold transition-all ${
          isAvailable
            ? 'text-[var(--badge-avail)]'
            : 'text-[var(--accent-promo)]'
        }`}
        title={isAvailable ? 'تعطيل الصنف (غير متوفر)' : 'تفعيل الصنف (متوفر للطلب)'}
      >
        {isUpdating ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : isAvailable ? (
          <>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>متوفر</span>
          </>
        ) : (
          <>
            <XCircle size={16} aria-hidden="true" />
            <span>غير متوفر</span>
          </>
        )}
      </Button>

      {/* Edit Button */}
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => onEdit(productId)}
          aria-label={`تعديل بيانات الصنف "${productName}"`}
          className="min-h-[44px] min-w-[44px] p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
          title="تعديل الصنف"
        >
          <Edit3 size={16} aria-hidden="true" />
        </Button>
      )}

      {/* Delete Button */}
      <Button
        type="button"
        variant="ghost"
        size="md"
        disabled={isUpdating}
        onClick={handleDelete}
        aria-label={`حذف الصنف "${productName}"`}
        className="min-h-[44px] min-w-[44px] p-2.5 text-[var(--text-muted)] hover:text-[var(--accent-promo)] hover:bg-[var(--bg-surface-subtle)]"
        title="حذف الصنف"
      >
        <Trash2 size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
