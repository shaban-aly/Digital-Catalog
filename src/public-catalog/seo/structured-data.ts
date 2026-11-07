import type { PublicCatalogPayload } from '../../shared/schemas.ts';

/**
 * Resolves the primary canonical URL for a merchant's catalog.
 * Prefers the dedicated merchant subdomain (e.g., https://ahmed-cafe.daleel-al-suez.com/)
 * to maximize SEO value and avoid duplicate content indexing.
 */
export function getCanonicalCatalogUrl(businessSlug: string, requestHost?: string): string {
  const cleanSlug = businessSlug.toLowerCase().trim();
  if (requestHost && requestHost.toLowerCase().startsWith(`${cleanSlug}.`)) {
    return `https://${requestHost.toLowerCase()}/`;
  }
  return `https://${cleanSlug}.digitalmenu.daleel-al-suez.com/`;
}

/**
 * Builds Schema.org JSON-LD structured data for a public catalog
 */
export function buildCatalogJsonLd(catalogPayload: PublicCatalogPayload, currentUrl: string) {
  const { business, catalog, products } = catalogPayload;

  if (business.industry_type === 'restaurant') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: business.name,
      url: currentUrl,
      telephone: business.phone_number || undefined,
      image: business.cover_url || business.logo_url || undefined,
      hasMenu: {
        '@type': 'Menu',
        name: catalog.slug,
        hasMenuItem: products.map((p) => ({
          '@type': 'MenuItem',
          name: p.name.ar,
          description: p.description?.ar || undefined,
          image: p.cover_image_url || undefined,
          offers: {
            '@type': 'Offer',
            price: p.effective_price,
            priceCurrency: business.currency_code,
            availability: p.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        })),
      },
    };
  }

  // Standard Store / CollectionPage for other industries
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: business.name,
    url: currentUrl,
    telephone: business.phone_number || undefined,
    image: business.cover_url || business.logo_url || undefined,
    makesOffer: products.map((p) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Product',
        name: p.name.ar,
        description: p.description?.ar || undefined,
        image: p.cover_image_url || undefined,
      },
      price: p.effective_price,
      priceCurrency: business.currency_code,
      availability: p.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    })),
  };
}

/**
 * Builds OpenGraph & Meta Headers for Public Catalog SSR
 */
export function buildCatalogMeta(catalogPayload: PublicCatalogPayload, canonicalUrl: string) {
  const { business } = catalogPayload;
  const title = `${business.name} - ديجيتال منيو وقائمة الأسعار`;
  const description = `تصفح أحدث منتجات وقائمة أسعار ${business.name} عبر ديجيتال منيو، واطلب مباشرة عبر WhatsApp.`;
  const image = business.cover_url || business.logo_url || 'https://digitalmenu.daleel-al-suez.com/og-default.png';

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'ديجيتال منيو - Digital Menu (دليل السويس)' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'index, follow' },
  ];
}
