# Architecture & Implementation Plan: SEO and Metadata (SEO-001)

## 1. Executive Summary
Feature `SEO-001` provides SEO, OpenGraph metadata, Schema.org JSON-LD structured data, dynamic XML sitemaps, and robots directives for published catalogs in Suez, ensuring maximum organic visibility while preventing duplicate indexing and data leakage.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: OpenGraph descriptions, site names, and titles are natively Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Edge XML and TXT rendering executed in Cloudflare Worker with 24h caching.
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax.
- [x] **Gate 4: Multi-Tenant Canonicalization**: Explicit canonical subdomain URLs prevent duplicate content penalties.
- [x] **Gate 5: Decoupled Entity Schema**: Automatically generates Schema.org `Restaurant` with `Menu` or `Store` with `Product/Offer`.
- [x] **Gate 6: Image Fallback Cascade**: Graceful fallback: cover image $\rightarrow$ logo image $\rightarrow$ platform default OG image.
- [x] **Gate 7: Safe Sitemap Boundaries**: Sitemap strictly filters `catalogs.is_published = true` AND `businesses.status = 'active'`.
- [x] **Gate 8: Disallow Private Routes**: Robots.txt rigorously disallows `/dashboard/`, `/auth/`, `/api/`, and `/q/`.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for Schema.org and OpenGraph meta items.
- [x] **Gate 10: Automated Test Coverage**: Complete test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - `CanonicalUrlSchema` and `SeoMetadataItemSchema` in `src/shared/schemas.ts`.
2. **SEO Utilities & Edge Routes Verification**:
   - Verify `getCanonicalCatalogUrl`, `buildCatalogJsonLd`, and `buildCatalogMeta` in `src/public-catalog/seo/structured-data.ts`.
   - Verify `handleSitemapXml` in `src/server/routes/sitemap.xml.ts` outputs valid XML and active stores only.
   - Verify `handleRobotsTxt` in `src/server/routes/robots.txt.ts` outputs text/plain with disallowed internal paths.
3. **Automated Unit Testing (`tests/unit/seo-metadata.test.ts`)**:
   - Test canonical URL generation and normalization.
   - Test Schema.org Restaurant vs Store structured data output.
   - Test OpenGraph meta tags generation and image fallback cascade.
   - Test `handleRobotsTxt` directives and sitemap linkage.
   - Test `handleSitemapXml` response format and headers.
4. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

