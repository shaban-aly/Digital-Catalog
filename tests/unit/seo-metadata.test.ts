import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CanonicalUrlSchema,
  SeoMetadataItemSchema,
} from '../../src/shared/schemas.ts';
import {
  getCanonicalCatalogUrl,
  buildCatalogJsonLd,
  buildCatalogMeta,
} from '../../src/public-catalog/seo/structured-data.ts';
import { handleRobotsTxt } from '../../src/server/routes/robots.txt.ts';
import { handleSitemapXml } from '../../src/server/routes/sitemap.xml.ts';
import type { PublicCatalogPayload } from '../../src/shared/schemas.ts';

describe('SEO and Metadata (SEO-001)', () => {
  const mockRestaurantPayload: PublicCatalogPayload = {
    business: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'مشويات السويس',
      slug: 'suez-grills',
      currency_code: 'EGP',
      phone_number: '01012345678',
      logo_url: 'https://cdn.example.com/logo.png',
      cover_url: 'https://cdn.example.com/cover.png',
      industry_type: 'restaurant',
    },
    catalog: {
      id: 'c0000000-0000-4000-8000-000000000001',
      slug: 'menu',
      theme_config: {},
    },
    categories: [
      {
        id: 'd0000000-0000-4000-8000-000000000001',
        name: { ar: 'مشويات' },
        sort_order: 1,
        product_count: 2,
      },
    ],
    products: [
      {
        id: 'e0000000-0000-4000-8000-000000000001',
        name: { ar: 'كباب ضاني' },
        description: { ar: 'كباب طازج مشوي على الفحم' },
        effective_price: 320,
        compare_at_price: null,
        unit: 'كيلو',
        is_available: true,
        is_featured: true,
        cover_image_url: 'https://cdn.example.com/kebab.png',
        gallery_image_urls: [],
        category_id: 'd0000000-0000-4000-8000-000000000001',
        attributes: {},
        variants: [],
        option_groups: [],
      },
      {
        id: 'e0000000-0000-4000-8000-000000000002',
        name: { ar: 'ريش ضاني' },
        description: null,
        effective_price: 380,
        compare_at_price: null,
        unit: 'كيلو',
        is_available: false,
        is_featured: false,
        cover_image_url: null,
        gallery_image_urls: [],
        category_id: 'd0000000-0000-4000-8000-000000000001',
        attributes: {},
        variants: [],
        option_groups: [],
      },
    ],
  };

  describe('CanonicalUrlSchema Validation', () => {
    it('accepts valid businessSlug', () => {
      const res = CanonicalUrlSchema.parse({ businessSlug: 'suez-grills' });
      assert.equal(res.businessSlug, 'suez-grills');
    });

    it('rejects businessSlug shorter than 3 characters', () => {
      assert.throws(
        () => CanonicalUrlSchema.parse({ businessSlug: 'ab' }),
        /اسم المتجر قصير جداً/
      );
    });
  });

  describe('getCanonicalCatalogUrl Resolution', () => {
    it('resolves dedicated merchant subdomain URL', () => {
      const url = getCanonicalCatalogUrl('suez-grills');
      assert.equal(url, 'https://suez-grills.digitalmenu.daleel-al-suez.com/');
    });

    it('normalizes uppercase and surrounding whitespace in businessSlug', () => {
      const url = getCanonicalCatalogUrl('  Ahmed-Cafe  ');
      assert.equal(url, 'https://ahmed-cafe.digitalmenu.daleel-al-suez.com/');
    });

    it('respects matching custom requestHost when provided', () => {
      const url = getCanonicalCatalogUrl('suez-grills', 'suez-grills.digitalmenu.daleel-al-suez.com');
      assert.equal(url, 'https://suez-grills.digitalmenu.daleel-al-suez.com/');
    });
  });

  describe('buildCatalogJsonLd (Schema.org Structured Data)', () => {
    it('generates Restaurant Schema.org JSON-LD with hasMenu for restaurant industry', () => {
      const canonicalUrl = 'https://suez-grills.digitalmenu.daleel-al-suez.com/';
      const jsonLd = buildCatalogJsonLd(mockRestaurantPayload, canonicalUrl) as any;

      assert.equal(jsonLd['@context'], 'https://schema.org');
      assert.equal(jsonLd['@type'], 'Restaurant');
      assert.equal(jsonLd.name, 'مشويات السويس');
      assert.equal(jsonLd.url, canonicalUrl);
      assert.equal(jsonLd.telephone, '01012345678');
      assert.equal(jsonLd.hasMenu['@type'], 'Menu');
      assert.equal(jsonLd.hasMenu.hasMenuItem.length, 2);

      const item1 = jsonLd.hasMenu.hasMenuItem[0];
      assert.equal(item1.name, 'كباب ضاني');
      assert.equal(item1.offers.price, 320);
      assert.equal(item1.offers.availability, 'https://schema.org/InStock');

      const item2 = jsonLd.hasMenu.hasMenuItem[1];
      assert.equal(item2.name, 'ريش ضاني');
      assert.equal(item2.offers.availability, 'https://schema.org/OutOfStock');
    });

    it('generates Store Schema.org JSON-LD with makesOffer for retail/grocery industry', () => {
      const retailPayload: PublicCatalogPayload = {
        ...mockRestaurantPayload,
        business: {
          ...mockRestaurantPayload.business,
          industry_type: 'grocery',
          name: 'سوبر ماركت القناة',
        },
      };

      const canonicalUrl = 'https://kanaa.digitalmenu.daleel-al-suez.com/';
      const jsonLd = buildCatalogJsonLd(retailPayload, canonicalUrl) as any;

      assert.equal(jsonLd['@context'], 'https://schema.org');
      assert.equal(jsonLd['@type'], 'Store');
      assert.equal(jsonLd.name, 'سوبر ماركت القناة');
      assert.equal(jsonLd.makesOffer.length, 2);
      assert.equal(jsonLd.makesOffer[0].itemOffered['@type'], 'Product');
      assert.equal(jsonLd.makesOffer[0].price, 320);
    });
  });

  describe('buildCatalogMeta (OpenGraph & Twitter Cards)', () => {
    it('builds full meta tags array with cover_url priority', () => {
      const canonicalUrl = 'https://suez-grills.digitalmenu.daleel-al-suez.com/';
      const meta = buildCatalogMeta(mockRestaurantPayload, canonicalUrl);

      const ogTitle = meta.find((m: any) => m.property === 'og:title') as any;
      assert.ok(ogTitle.content.includes('مشويات السويس'));

      const ogImage = meta.find((m: any) => m.property === 'og:image') as any;
      assert.equal(ogImage.content, 'https://cdn.example.com/cover.png');

      const ogUrl = meta.find((m: any) => m.property === 'og:url') as any;
      assert.equal(ogUrl.content, canonicalUrl);

      const twitterCard = meta.find((m: any) => m.name === 'twitter:card') as any;
      assert.equal(twitterCard.content, 'summary_large_image');
    });

    it('falls back to logo_url when cover_url is missing', () => {
      const noCoverPayload: PublicCatalogPayload = {
        ...mockRestaurantPayload,
        business: {
          ...mockRestaurantPayload.business,
          cover_url: null,
        },
      };

      const meta = buildCatalogMeta(noCoverPayload, 'https://suez-grills.digitalmenu.daleel-al-suez.com/');
      const ogImage = meta.find((m: any) => m.property === 'og:image') as any;
      assert.equal(ogImage.content, 'https://cdn.example.com/logo.png');
    });

    it('falls back to platform default banner when both images are missing', () => {
      const noImagePayload: PublicCatalogPayload = {
        ...mockRestaurantPayload,
        business: {
          ...mockRestaurantPayload.business,
          cover_url: null,
          logo_url: null,
        },
      };

      const meta = buildCatalogMeta(noImagePayload, 'https://suez-grills.digitalmenu.daleel-al-suez.com/');
      const ogImage = meta.find((m: any) => m.property === 'og:image') as any;
      assert.equal(ogImage.content, 'https://digitalmenu.daleel-al-suez.com/og-default.png');
    });
  });

  describe('handleRobotsTxt & handleSitemapXml Directives', () => {
    it('renders robots.txt allowing public storefronts and disallowing internal routes', async () => {
      const response = handleRobotsTxt();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
      assert.equal(response.headers.get('Cache-Control'), 'public, max-age=86400');

      const text = await response.text();
      assert.ok(text.includes('Allow: /'));
      assert.ok(text.includes('Allow: /c/'));
      assert.ok(text.includes('Disallow: /dashboard/'));
      assert.ok(text.includes('Disallow: /auth/'));
      assert.ok(text.includes('Disallow: /api/'));
      assert.ok(text.includes('Disallow: /q/'));
      assert.ok(text.includes('Sitemap: https://digitalmenu.daleel-al-suez.com/sitemap.xml'));
    });

    it('renders valid XML sitemap with 24-hour edge cache headers', async () => {
      const response = await handleSitemapXml();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
      assert.ok(response.headers.get('Cache-Control')!.includes('max-age=86400'));

      const xml = await response.text();
      assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
      assert.ok(xml.includes('https://digitalmenu.daleel-al-suez.com/'));
      assert.ok(xml.includes('</urlset>'));
    });
  });
});

