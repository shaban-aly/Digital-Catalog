import { useState } from 'react';
import { Button } from '../ui/Button';
import { productService } from '@/server/services/product';
import { CheckCircle2, XCircle, Edit3, Loader2 } from 'lucide-react';

interface ProductRowActionsProps {
  productId: string;
  isAvailable: boolean;
  onRefresh: () => void;
  onEdit?: (productId: string) => void;
}

export function ProductRowActions({
  productId,
  isAvailable,
  onRefresh,
  onEdit,
}: ProductRowActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAvailability = async () => {
    setIsUpdating(true);
    try {
      await productService.setAvailability(productId, !isAvailable);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      alert('حدث خطأ أثناء تعديل حالة التوفر.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* Toggle Availability */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isUpdating}
        onClick={handleToggleAvailability}
        className={`h-8 px-2 text-xs gap-1 ${
          isAvailable ? 'text-[var(--badge-avail)] hover:bg-emerald-50' : 'text-[var(--accent-promo)] hover:bg-rose-50'
        }`}
        title={isAvailable ? 'تعطيل المنتج (غير متوفر)' : 'تفعيل المنتج (متوفر)'}
      >
        {isUpdating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isAvailable ? (
          <>
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">متوفر</span>
          </>
        ) : (
          <>
            <XCircle size={14} />
            <span className="hidden sm:inline">غير متوفر</span>
          </>
        )}
      </Button>

      {/* Edit */}
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(productId)}
          className="h-8 w-8 p-0 text-[var(--text-secondary)]"
          title="تعديل المنتج"
        >
          <Edit3 size={14} />
        </Button>
      )}
    </div>
  );
}
