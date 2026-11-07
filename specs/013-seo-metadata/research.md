# Technical Research: SEO and Metadata (SEO-001)

## 1. Multi-Tenant Subdomain Canonical Indexing

In multi-tenant architectures where paths like `/c/ahmed-cafe` and subdomains like `ahmed-cafe.digitalmenu.daleel-al-suez.com` could serve the same content, search engines will penalize duplicate content unless a clear canonical link is provided.
- **Rule**: Every storefront sets:
  ```html
  <link rel="canonical" href="https://ahmed-cafe.digitalmenu.daleel-al-suez.com/" />
  <meta property="og:url" content="https://ahmed-cafe.digitalmenu.daleel-al-suez.com/" />
  ```
- **Sitemap Consistency**: All entries in `sitemap.xml` point to the canonical subdomain URL.

## 2. Industry-Specific Schema.org JSON-LD

Google's search console recognizes specific entities for restaurants vs general retail:
1. **Restaurant**:
   - `@type: "Restaurant"`
   - `hasMenu`: `@type: "Menu"`
   - `hasMenuItem`: `@type: "MenuItem"` with price, currency, and availability.
2. **Retail Store**:
   - `@type: "Store"`
   - `makesOffer`: `@type: "Offer"` wrapping `itemOffered: { "@type": "Product" }`.

## 3. Robots Directives
To protect tenant privacy and platform performance:
- Disallowed: `/dashboard/`, `/auth/`, `/api/`, `/q/`.
- Permitted: `/` (platform homepage), `/c/` (storefronts).

