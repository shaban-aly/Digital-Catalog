# Architecture & Implementation Plan: Public Catalog Experience (PUB-001)

## 1. Executive Summary
Feature `PUB-001` provides the mobile-first customer storefront for merchants in Suez. It integrates responsive category navigation, presentation pricing, variant/modifier customization via a slide-up drawer, structured WhatsApp ordering handoff, and Cloudflare Edge caching with zero cold start penalty.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Storefront, drawers, badges, and WhatsApp messages are natively Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Edge caching via Cloudflare Worker (`s-maxage=300`), free CDN asset serving, zero paid server runtime.
- [x] **Gate 3: Zod 4 Compliance**: Input/output models and WhatsApp details schema conform to Zod 4 syntax.
- [x] **Gate 4: Mobile Viewport Optimization**: Constrained `max-w-lg mx-auto` container provides a native app-like experience on phones.
- [x] **Gate 5: Decoupled Domain Architecture**: Product presentation respects `catalog_items.price_override` and category association.
- [x] **Gate 6: Dynamic Modifier Arithmetic**: Precise decimal calculation for base price + variant delta + modifier sums.
- [x] **Gate 7: Safe Fallbacks & Recovery States**: Friendly Arabic empty state for categories without active products.
- [x] **Gate 8: Phone Number Sanitization**: Automatically normalizes Egyptian mobile numbers for `wa.me` compatibility.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `PublicCatalogPayload`, `PublicProduct`, and `PublicCategory`.
- [x] **Gate 10: Automated Test Coverage**: Complete test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Validation**:
   - Align `WhatsAppOrderDetailsSchema` in `specs/009-public-catalog-experience/contracts/public-catalog-contracts.ts` and `src/shared/schemas.ts`.
2. **Components & Utilities**:
   - Verify `src/public-catalog/utils/whatsapp-formatter.ts` handles Arabic text encoding, emojis, phone sanitation, and currency display.
   - Verify `src/routes/_public/c/$catalogSlug.tsx` and public components (`CatalogHeader`, `CategoryPills`, `ProductCard`, `ItemDetailDrawer`, `WhatsAppStickyBar`).
3. **Automated Unit Testing (`tests/unit/public-catalog.test.ts`)**:
   - Test `PublicCatalogPayloadSchema` hydration validation.
   - Test `WhatsAppOrderDetailsSchema` validation.
   - Test `buildWhatsAppOrderUrl` phone normalization, message encoding, modifier deltas, and URL generation.
   - Test dynamic drawer total price calculation logic.
4. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

