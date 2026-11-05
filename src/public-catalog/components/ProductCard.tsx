import type { PublicProduct } from '../../shared/schemas';
import { Card, Badge } from '../../client/components/ui/Card';

interface ProductCardProps {
  product: PublicProduct;
  currency: string;
  onSelect: (product: PublicProduct) => void;
}

export function ProductCard({ product, currency, onSelect }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  const startingPrice = hasVariants
    ? Math.min(...product.variants.map((v) => v.price))
    : product.effective_price;

  return (
    <Card
      onClick={() => product.is_available && onSelect(product)}
      className={`flex flex-row items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow select-none ${
        !product.is_available ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      {/* Product Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-[var(--bg-surface-subtle)]">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.name.ar}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
            لا توجد صورة
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded">
              غير متوفر
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-between flex-grow min-h-[96px] text-right">
        <div>
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">
              {product.name.ar}
            </h3>
            {product.is_featured && (
              <Badge variant="default" className="text-[9px] px-1.5 py-0">
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
        <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-[var(--text-primary)]">
              {hasVariants ? `من ${startingPrice}` : startingPrice}
            </span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">
              {currency}
            </span>

            {product.compare_at_price && product.compare_at_price > startingPrice && (
              <span className="text-xs text-[var(--text-muted)] line-through">
                {product.compare_at_price}
              </span>
            )}
          </div>

          {hasVariants && (
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              خيارات متعددة
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
