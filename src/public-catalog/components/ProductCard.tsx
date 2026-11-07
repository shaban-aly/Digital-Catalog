import { useState } from 'react';
import type { PublicProduct } from '../../shared/schemas';
import { Card, Badge } from '../../client/components/ui/Card';
import { formatCurrencySymbol } from '../../shared/currency';

interface ProductCardProps {
  product: PublicProduct;
  currency: string;
  onSelect: (product: PublicProduct) => void;
}

export function ProductCard({ product, currency, onSelect }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasVariants = product.variants && product.variants.length > 0;
  const startingPrice = hasVariants
    ? Math.min(...product.variants.map((v) => v.price))
    : product.effective_price;

  const handleClick = () => {
    if (product.is_available) {
      onSelect(product);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!product.is_available) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(product);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={product.is_available ? 0 : -1}
      aria-disabled={!product.is_available}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex flex-row items-center gap-3 p-3.5 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
        product.is_available
          ? 'cursor-pointer hover:shadow-md hover:border-[var(--text-secondary)] active:scale-[0.99]'
          : 'opacity-60 cursor-not-allowed bg-[var(--bg-surface-subtle)]'
      }`}
    >
      {/* Product Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
        {product.cover_image_url && !imageFailed ? (
          <img
            src={product.cover_image_url}
            alt={product.name.ar}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-xs gap-1 p-2 text-center">
            <span className="font-bold text-[11px] text-[var(--text-muted)]">
              {product.name.ar.slice(0, 1)}
            </span>
            <span className="text-[11px]">بدون صورة</span>
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-1">
            <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-[var(--radius-sm)] shadow-xs">
              غير متوفر
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-between flex-grow min-h-[96px] text-right">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] line-clamp-2 leading-snug">
              {product.name.ar}
            </h3>
            {product.is_featured && (
              <Badge variant="default" className="text-[11px] px-2 py-0.5 shrink-0">
                مميز
              </Badge>
            )}
          </div>

          {product.description?.ar && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
              {product.description.ar}
            </p>
          )}
        </div>

        {/* Pricing & Call to Action */}
        <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-[var(--border-subtle)]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-[var(--text-primary)]" dir="ltr">
              {hasVariants ? `من ${startingPrice}` : startingPrice}
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">
              {formatCurrencySymbol(currency)}
            </span>

            {product.compare_at_price && product.compare_at_price > startingPrice && (
              <span className="text-xs text-[var(--text-muted)] line-through" dir="ltr">
                {product.compare_at_price}
              </span>
            )}
          </div>

          {hasVariants && (
            <span className="text-[11px] text-[var(--text-muted)] font-bold bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
              خيارات وأحجام
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
