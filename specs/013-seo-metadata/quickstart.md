# Quickstart Guide: SEO and Metadata (SEO-001)

## 1. Overview
SEO and Metadata ensures every published digital catalog in Suez is indexed by search engines with rich Schema.org snippets, produces branded social cards on WhatsApp/Facebook, and outputs a dynamic XML sitemap that strictly excludes unpublished or suspended businesses.

---

## 2. Usage Examples

### Generating Canonical Storefront URL
```typescript
import { getCanonicalCatalogUrl } from '@/public-catalog/seo/structured-data';

const url = getCanonicalCatalogUrl('al-baraka');
console.log(url); // https://al-baraka.digitalmenu.daleel-al-suez.com/
```

### Generating Schema.org JSON-LD
```typescript
import { buildCatalogJsonLd } from '@/public-catalog/seo/structured-data';

const jsonLd = buildCatalogJsonLd(catalogPayload, 'https://al-baraka.digitalmenu.daleel-al-suez.com/');
// Returns Schema.org Restaurant or Store object
```

### Rendering Sitemap and Robots at Edge
```typescript
import { handleSitemapXml } from '@/server/routes/sitemap.xml';
import { handleRobotsTxt } from '@/server/routes/robots.txt';

const sitemapResponse = await handleSitemapXml(); // XML with active published stores
const robotsResponse = handleRobotsTxt(); // TXT directives
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/seo-metadata.test.ts
```

