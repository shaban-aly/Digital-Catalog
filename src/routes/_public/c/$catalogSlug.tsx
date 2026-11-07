import { useState, useEffect } from 'react';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { publicCatalogService } from '@/server/services/public-catalog';
import { CatalogHeader } from '@/public-catalog/components/CatalogHeader';
import { CategoryPills } from '@/public-catalog/components/CategoryPills';
import { ProductCard } from '@/public-catalog/components/ProductCard';
import { ItemDetailDrawer } from '@/public-catalog/components/ItemDetailDrawer';
import { FloatingCartBar } from '@/public-catalog/components/FloatingCartBar';
import { CartDrawer } from '@/public-catalog/components/CartDrawer';
import { useCart } from '@/public-catalog/hooks/use-cart';
import { Button } from '@/client/components/ui/Button';
import {
  buildCatalogMeta,
  buildCatalogJsonLd,
  getCanonicalCatalogUrl,
} from '@/public-catalog/seo/structured-data';
import { Search, UtensilsCrossed, XCircle } from 'lucide-react';
import type { PublicProduct } from '@/shared/schemas';

interface CatalogSearchParams {
  table?: string;
}

export const Route = createFileRoute('/_public/c/$catalogSlug')({
  validateSearch: (search: Record<string, unknown>): CatalogSearchParams => ({
    table: typeof search.table === 'string' ? search.table : undefined,
  }),
  loader: async ({ params }) => {
    const catalogData = await publicCatalogService.getCatalogBySlug(params.catalogSlug);
    if (!catalogData) {
      throw notFound();
    }
    return catalogData;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const businessSlug = loaderData.business?.slug || params.catalogSlug;
    const canonicalUrl = getCanonicalCatalogUrl(businessSlug);
    return {
      meta: buildCatalogMeta(loaderData, canonicalUrl),
      links: [
        {
          rel: 'canonical',
          href: canonicalUrl,
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildCatalogJsonLd(loaderData, canonicalUrl)),
        },
      ],
    };
  },
  headers: () => ({
    // Edge Cache: 5 minutes in Cloudflare CDN, stale-while-revalidate 10 minutes
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  }),
  pendingComponent: CatalogLoadingSkeleton,
  component: PublicCatalogPage,
});

function CatalogLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] pb-24 max-w-lg mx-auto p-4 space-y-4 animate-pulse">
      {/* Cover & Header Skeleton */}
      <div className="h-36 bg-[var(--border-subtle)] rounded-[var(--radius-lg)]" />
      <div className="h-10 bg-[var(--border-subtle)] rounded-full w-3/4 mx-auto" />
      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden py-2">
        <div className="h-10 w-20 bg-[var(--border-subtle)] rounded-full shrink-0" />
        <div className="h-10 w-24 bg-[var(--border-subtle)] rounded-full shrink-0" />
        <div className="h-10 w-24 bg-[var(--border-subtle)] rounded-full shrink-0" />
      </div>
      {/* Product Cards Skeleton */}
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex items-center p-3 gap-3"
          >
            <div className="w-24 h-24 bg-[var(--border-subtle)] rounded-[var(--radius-md)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--border-subtle)] rounded w-2/3" />
              <div className="h-3 bg-[var(--border-subtle)] rounded w-1/2" />
              <div className="h-4 bg-[var(--border-subtle)] rounded w-1/4 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicCatalogPage() {
  const catalogData = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cart = useCart(catalogData.business.slug);

  // Auto-capture table number if present in query parameters (e.g. ?table=4)
  useEffect(() => {
    if (searchParams.table && !cart.fulfillmentNotes) {
      cart.setFulfillmentNotes(`طاولة رقم: ${searchParams.table}`);
    }
  }, [searchParams.table, cart.fulfillmentNotes, cart.setFulfillmentNotes]);

  // Synchronize cart with latest catalog prices and availability on mount
  useEffect(() => {
    if (cart.isLoaded && catalogData.products && catalogData.products.length > 0) {
      cart.syncWithCatalog(catalogData.products);
    }
  }, [cart.isLoaded, catalogData.products, cart.syncWithCatalog]);

  // Filter products by category and live search query
  const filteredProducts = catalogData.products.filter((product) => {
    const matchesCategory = activeCategoryId ? product.category_id === activeCategoryId : true;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = product.name.ar.toLowerCase().includes(q);
    const descMatch = product.description?.ar ? product.description.ar.toLowerCase().includes(q) : false;
    return nameMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-app)] pb-24 max-w-lg mx-auto shadow-md">
      {/* Header Banner & Logo */}
      <CatalogHeader business={catalogData.business} />

      {/* Table Welcome Notice when accessed via table QR stand */}
      {searchParams.table && (
        <div className="bg-[var(--primary)] text-white text-xs px-4 py-2 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--whatsapp-green)] animate-ping" />
            <span>طلب مباشر من الصالة — طاولة رقم {searchParams.table}</span>
          </div>
          <span className="text-[11px] opacity-80">خدمة سريعة</span>
        </div>
      )}

      {/* Search Bar for Fast Menu Browsing */}
      <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في أصناف ومشروبات المنيو..."
            aria-label="البحث في أصناف المنيو"
            className="w-full text-xs min-h-[44px] pr-9 pl-9 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] focus:bg-[var(--bg-surface)] focus:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] text-right font-medium transition-colors"
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            aria-hidden="true"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Sticky Category Pills */}
      <CategoryPills
        categories={catalogData.categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={(catId) => {
          setActiveCategoryId(catId);
          // Scroll slightly down to list top if user selected a category
          window.scrollTo({ top: 160, behavior: 'smooth' });
        }}
      />

      {/* Product List Landmark */}
      <main id="main-catalog-content" className="p-3 space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] space-y-3 my-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <UtensilsCrossed size={22} aria-hidden="true" />
            </div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أصناف في هذا القسم حالياً'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? `لم يتم العثور على أي صنف يحتوي على "${searchQuery}". جرب البحث بكلمة أخرى.`
                : 'يمكنك الانتقال لقسم آخر أو استعراض كل الأصناف المتوفرة.'}
            </p>
            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setActiveCategoryId(null);
                  setSearchQuery('');
                }}
                className="min-h-[44px] text-xs font-bold px-4"
              >
                عرض كل الأصناف
              </Button>
            </div>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={catalogData.business.currency_code}
              onSelect={setSelectedProduct}
            />
          ))
        )}
      </main>

      {/* Item Detail & Modifier Drawer */}
      <ItemDetailDrawer
        product={selectedProduct}
        storeName={catalogData.business.name}
        storePhone={catalogData.business.phone_number}
        currency={catalogData.business.currency_code}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => {
          cart.addItem(item);
          setSelectedProduct(null);
        }}
      />

      {/* Persistent Floating Bottom Cart Bar */}
      <FloatingCartBar
        totalQuantity={cart.totalQuantity}
        totalAmount={cart.totalAmount}
        currency={catalogData.business.currency_code}
        storeName={catalogData.business.name}
        storePhone={catalogData.business.phone_number}
        orderSubmitted={cart.orderSubmitted}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Slide-over Multi-Item Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        storeName={catalogData.business.name}
        storePhone={catalogData.business.phone_number}
        currency={catalogData.business.currency_code}
        items={cart.items}
        totalAmount={cart.totalAmount}
        totalQuantity={cart.totalQuantity}
        customerName={cart.customerName}
        fulfillmentNotes={cart.fulfillmentNotes}
        orderSubmitted={cart.orderSubmitted}
        hasOutOfStockItems={cart.hasOutOfStockItems}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
        onSetCustomerName={cart.setCustomerName}
        onSetFulfillmentNotes={cart.setFulfillmentNotes}
        onOrderSubmitted={cart.setOrderSubmitted}
      />

      {/* Subtle Brand & Platform Footer */}
      <footer className="text-center py-6 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] space-y-1">
        <div>
          <span>قائمة إلكترونية ذكية مدعومة من </span>
          <a
            href="/"
            className="font-extrabold text-[var(--text-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)]"
          >
            ديجيتال منيو
          </a>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] opacity-75">
          دليل السويس الرقمي للمطاعم والأنشطة التجارية
        </p>
      </footer>
    </div>
  );
}
