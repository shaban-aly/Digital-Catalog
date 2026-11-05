import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { publicCatalogService } from '@/server/services/public-catalog';
import { CatalogHeader } from '@/public-catalog/components/CatalogHeader';
import { CategoryPills } from '@/public-catalog/components/CategoryPills';
import { ProductCard } from '@/public-catalog/components/ProductCard';
import { ItemDetailDrawer } from '@/public-catalog/components/ItemDetailDrawer';
import { WhatsAppStickyBar } from '@/public-catalog/components/WhatsAppStickyBar';
import { buildCatalogMeta, buildCatalogJsonLd } from '@/public-catalog/seo/structured-data';
import type { PublicProduct } from '@/shared/schemas';

export const Route = createFileRoute('/_public/c/$catalogSlug')({
  loader: async ({ params }) => {
    const catalogData = await publicCatalogService.getCatalogBySlug(params.catalogSlug);
    if (!catalogData) {
      throw new Response('الكتالوج غير موجود أو تم إيقاف نشره', { status: 404 });
    }
    return catalogData;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const canonicalUrl = `https://<my-name>.daleel-al-suez.com/c/${params.catalogSlug}`;
    return {
      meta: buildCatalogMeta(loaderData, canonicalUrl),
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
  component: PublicCatalogPage,
});

function PublicCatalogPage() {
  const catalogData = Route.useLoaderData();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);

  const filteredProducts = activeCategoryId
    ? catalogData.products.filter((p) => p.category_id === activeCategoryId)
    : catalogData.products;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] pb-24 max-w-lg mx-auto shadow-md">
      {/* Header Banner & Logo */}
      <CatalogHeader business={catalogData.business} />

      {/* Horizontal Sticky Category Pills */}
      <CategoryPills
        categories={catalogData.categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

      {/* Product List */}
      <main className="p-3 space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">
            لا توجد منتجات معروضة في هذا القسم حالياً.
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
      />

      {/* Floating Bottom WhatsApp Action Bar */}
      <WhatsAppStickyBar
        storeName={catalogData.business.name}
        storePhone={catalogData.business.phone_number}
      />

      {/* Viral Growth Badge */}
      <footer className="text-center py-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
        <span>أنشئ كتالوجك الرقمي مجاناً عبر </span>
        <a href="/" className="font-bold text-[var(--text-primary)] hover:underline">
          دليل السويس
        </a>
      </footer>
    </div>
  );
}
