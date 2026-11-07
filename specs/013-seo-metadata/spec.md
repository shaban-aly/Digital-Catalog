# Feature Specification: SEO and Metadata (SEO-001)

**Feature ID**: `SEO-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: PUB-001, DOM-001, LIF-001

---

## 1. Purpose and Business Value

Maximize search engine visibility and social media shareability for Suez merchants. Published menus must automatically emit canonical subdomain URLs (preventing duplicate content penalties), Schema.org JSON-LD structured data (for rich Google snippets), OpenGraph and Twitter cards preview tags (for rich WhatsApp and Facebook link previews), and dynamic sitemap/robots directives with zero unpublished or suspended store leaks.

---

## 2. Actors and Permissions

- **Merchant**: Configures store profile, name, and images; benefits from rich previews when sharing storefront links on social media.
- **Search Crawlers & Preview Bots (Googlebot, WhatsApp, Facebook)**: Ingest canonical URLs, Schema.org entities, OpenGraph tags, and sitemaps.

---

## 3. User Stories

### User Story 1: Canonical Merchant Subdomain URL Resolution (P0 - Priority: Highest)
**As a** search engine crawler,  
**I want to** encounter a single, authoritative canonical URL for each merchant storefront (`https://{slug}.digitalmenu.daleel-al-suez.com/`),  
**So that** my indexing does not dilute ranking across legacy path routes or duplicate subdomains.

- **Acceptance Criteria**:
  - `getCanonicalCatalogUrl(businessSlug, requestHost)` returns `https://{slug}.digitalmenu.daleel-al-suez.com/`.
  - Normalizes uppercase or whitespace in business slug.
  - Automatically emitted in `<link rel="canonical">` and `og:url`.

### User Story 2: Schema.org JSON-LD Structured Data Generation (P0 - Priority: Highest)
**As a** search engine crawler,  
**I want to** parse standard Schema.org JSON-LD microdata,  
**So that** the merchant's dishes, prices, and stock status are eligible for Google search rich snippets.

- **Acceptance Criteria**:
  - For `restaurant` industry: emits `@type: 'Restaurant'` with `hasMenu` containing `MenuItem` array and `Offer` prices with availability (`https://schema.org/InStock` or `OutOfStock`).
  - For other industries: emits `@type: 'Store'` with `makesOffer` containing `Product` items and `Offer` prices.
  - Validates valid telephone and image fallback.

### User Story 3: Social Link Previews (OpenGraph & Twitter Cards) (P0 - Priority: Highest)
**As a** customer sharing a restaurant menu on WhatsApp or Facebook,  
**I want to** see an attractive card preview with the store's name, cover photo, and localized description,  
**So that** the recipient immediately recognizes the Suez business.

- **Acceptance Criteria**:
  - Emits `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, and `twitter:card: summary_large_image`.
  - Cover image falls back gracefully to store logo, then platform default OG banner (`/og-default.png`).

### User Story 4: Dynamic XML Sitemap Generation (P1 - Priority: High)
**As a** search engine indexer,  
**I want to** fetch `/sitemap.xml` and discover all active, published catalogs,  
**So that** new Suez merchants are rapidly crawled and indexed.

- **Acceptance Criteria**:
  - Lists main platform homepage with priority `1.0`.
  - Lists each active published catalog with canonical subdomain URL and priority `0.8`.
  - Excludes unpublished or suspended/archived businesses.
  - Emits `Content-Type: application/xml; charset=utf-8` and 24-hour cache header.

### User Story 5: Robots Directives (P1 - Priority: High)
**As a** platform operator,  
**I want to** guide web crawlers to public catalogs while disallowing private administrative paths,  
**So that** sensitive merchant dashboard paths and ephemeral endpoints are not indexed.

- **Acceptance Criteria**:
  - `/robots.txt` allows `/` and `/c/`.
  - Disallows `/dashboard/`, `/auth/`, `/api/`, and `/q/`.
  - Points to `Sitemap: https://digitalmenu.daleel-al-suez.com/sitemap.xml`.

---

## 4. Functional Requirements

- **FR-001**: `getCanonicalCatalogUrl` resolves canonical merchant subdomain URL.
- **FR-002**: `buildCatalogJsonLd` outputs valid Schema.org Restaurant / Store markup.
- **FR-003**: `buildCatalogMeta` constructs OpenGraph and meta tags for SSR rendering.
- **FR-004**: `handleSitemapXml` queries database and renders compliant XML sitemap.
- **FR-005**: `handleRobotsTxt` renders text/plain robots directives with platform domain.
- **FR-006**: All schemas conform to strict Zod 4 syntax (`SeoMetadataSchema`, `CanonicalUrlSchema`).

---

## 5. Non-Functional & Constitutional Requirements

- **Principle I (Arabic RTL First)**: Titles, descriptions, and site names are authentically Arabic.
- **Principle II ($0 Infrastructure)**: In-worker edge XML/TXT rendering; zero external SEO plugins.
- **Principle VII (Strict Type Safety)**: 100% typed with Zod 4 and TypeScript.
