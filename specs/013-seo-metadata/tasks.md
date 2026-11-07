# Tasks: SEO and Metadata (SEO-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align `CanonicalUrlSchema` and `SeoMetadataItemSchema` in `specs/013-seo-metadata/contracts/seo-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align Schema.org and OpenGraph types in `src/public-catalog/seo/structured-data.ts`.

## Phase 2: SEO Utilities & Edge Route Handlers
- [x] **TASK-003**: Verify `getCanonicalCatalogUrl` normalizes slugs and formats subdomain URLs.
- [x] **TASK-004**: Verify `buildCatalogJsonLd` distinguishes `Restaurant` vs `Store` and formats item offers.
- [x] **TASK-005**: Verify `buildCatalogMeta` constructs full OpenGraph and Twitter cards array with image fallback.
- [x] **TASK-006**: Verify `handleRobotsTxt` renders text/plain with disallowed paths and sitemap link.
- [x] **TASK-007**: Verify `handleSitemapXml` renders valid XML with active published stores only.

## Phase 3: Automated Testing & Verification
- [x] **TASK-008**: Create comprehensive test suite `tests/unit/seo-metadata.test.ts` covering:
  - Canonical URL resolution.
  - Schema.org Restaurant vs Store structured data JSON-LD.
  - OpenGraph meta tags array and fallbacks.
  - Robots.txt directives and headers.
  - Sitemap XML formatting and caching headers.
  - Zod 4 schema validation.
- [x] **TASK-009**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-010**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-011**: Update `docs/specifications/feature-registry.md` marking `SEO-001` as `Implemented & Verified`.
