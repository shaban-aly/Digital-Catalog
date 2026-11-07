# Feature Specification: Core Digital Catalog & QR Platform (MVP Integration Index)

**Feature Branch**: `001-core-catalog-platform`

**Created**: 2026-11-05

**Status**: Superseded as an implementation source by `docs/specifications/feature-registry.md`

> This file is a consolidated source index only. New work must use the independently scoped feature specifications in `docs/specifications/feature-registry.md`; do not create a plan or tasks from this document.

**Input**: User description: "Establish the complete core foundation of the Free-First Digital Catalog & QR Platform, including merchant onboarding, multi-tenant catalog and inventory management, dynamic permanent QR codes, public mobile-first catalog browsing with direct WhatsApp ordering, and basic visitor insights."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Merchant Registration & Inventory Setup (Priority: P1)

A small business owner (such as a restaurant manager, supermarket owner, or fashion boutique retailer) registers an account on the platform, establishes their business profile, creates product categories, and adds products with images, base prices, variants (sizes, colors), and customizable options (such as meal add-ons or preparation choices). The system enforces the permanent free plan quota (up to 100 master products, 15 categories, and 3 images per product).

**Why this priority**: Without merchant onboarding and catalog population, no consumer-facing catalog can exist. This is the foundational supply-side value of the platform.

**Independent Test**: Can be fully tested by creating a new merchant account, populating 10 products with images and options across 3 categories, and verifying that the store data is safely saved and accessible.

**Acceptance Scenarios**:

1. **Given** an unregistered merchant with a valid email and password, **When** they submit the registration form and specify their store name, business type, and currency, **Then** a new business profile with an active default branch is created and the merchant is granted immediate access to their management dashboard.
2. **Given** an authenticated merchant in their dashboard, **When** they add a new product with title, description, base price, category, and upload up to 3 images, **Then** the product is successfully created, images are optimized, and the product count reflects the new total against their 100-product quota.
3. **Given** a merchant who already has 100 active products, **When** they attempt to create the 101st product, **Then** the system gracefully rejects the creation with a clear message indicating that the free plan limit of 100 products has been reached.

---

### User Story 2 - Consumer Public Catalog Browsing (Priority: P2)

An end consumer navigates to a store's public catalog link on their smartphone (or desktop). The catalog page loads immediately, displaying the business logo, cover image, and store information. The customer can browse categories using a sticky navigation bar, search for items by name, view high-quality images and clear prices, and tap a product to view detailed descriptions, select sizes/colors, or choose add-ons with real-time price updates.

**Why this priority**: The public catalog is the primary consumer touchpoint. If it is slow, confusing, or fails on mobile networks, customers will bounce and merchants will abandon the platform.

**Independent Test**: Can be tested independently by navigating to a published store link on a mobile browser, verifying that all products load in under 1.5 seconds, filtering by category, and opening product detail cards.

**Acceptance Scenarios**:

1. **Given** an active published catalog, **When** a consumer opens `https://digitalmenu.daleel-al-suez.com/c/:catalogSlug` on a mobile device, **Then** the full page content (store info, category pills, and product cards) is displayed without requiring user login or application download.
2. **Given** a product with multiple size variants (e.g., Small: 20 ج.م, Large: 35 ج.م) and optional modifiers (e.g., Extra Cheese: +5 ج.م), **When** a consumer selects "Large" and checks "Extra Cheese", **Then** the displayed total price immediately updates to 40 ج.م.
3. **Given** a consumer sharing the catalog link on WhatsApp or social media, **When** the link preview renders, **Then** an accurate title, description, and store logo image are displayed.

---

### User Story 3 - Permanent Dynamic QR Code Generation & Routing (Priority: P3)

A merchant generates and downloads a permanent QR code for their catalog. The QR code encodes a stable short redirect URL (`https://digitalmenu.daleel-al-suez.com/q/:shortCode`). When a customer scans the physical QR code with their mobile phone camera, the system instantly redirects them to the store's current active catalog without noticeable delay, while privately and asynchronously recording the visit.

**Why this priority**: Physical QR codes printed on table tents, menus, or shop windows cannot be reprinted every time a catalog title or slug changes. A stable redirect is essential for real-world viability.

**Independent Test**: Can be tested by generating a QR code for a store, downloading it as PNG/SVG, scanning it with a phone, confirming immediate redirection to the correct catalog, and verifying that modifying the store's slug does not invalidate the original QR code.

**Acceptance Scenarios**:

1. **Given** a published catalog, **When** the merchant accesses the QR section of their dashboard, **Then** they can preview and download their unique QR code in high-resolution PNG and vector SVG formats.
2. **Given** a customer scanning `https://digitalmenu.daleel-al-suez.com/q/:shortCode`, **When** the request hits the server, **Then** an immediate HTTP 302 redirection is issued to the destination catalog URL within 100 milliseconds.
3. **Given** an automated preview crawler (such as the WhatsApp link preview bot), **When** it fetches the QR URL, **Then** the system serves the preview metadata without artificially inflating human scan analytics.

---

### User Story 4 - Direct WhatsApp Order & Inquiry Conversion (Priority: P4)

A consumer browsing a merchant's digital catalog decides to place an order or inquire about an item. From the sticky action bar or product detail sheet, the consumer taps "Order via WhatsApp". The system immediately launches WhatsApp on the customer's phone, addressing the merchant's WhatsApp phone number with a pre-formatted message detailing the selected product name, chosen variants, modifiers, and the total calculated price.

**Why this priority**: Small and medium merchants in the target market conduct daily commerce through WhatsApp rather than credit card checkouts. This feature delivers immediate commercial conversion without checkout friction.

**Independent Test**: Can be tested by customizing a product on a mobile catalog, clicking the WhatsApp button, and verifying that WhatsApp opens with the exact product specifications and merchant phone number.

**Acceptance Scenarios**:

1. **Given** a customer viewing a product with selected options, **When** they click "Order via WhatsApp", **Then** WhatsApp opens targeting the merchant's configured phone number with an encoded message: e.g., *"Hello [Store Name], I would like to order: 1x [Product Name] (Size: Large, Extras: Cheese) - Total: 40 ج.م"*.
2. **Given** a merchant who has not configured a WhatsApp phone number, **When** the catalog renders, **Then** the WhatsApp action gracefully adjusts to an inquiry or phone call button, or is omitted without breaking page layout.

---

### User Story 5 - Real-time Management & Basic Visitor Insights (Priority: P5)

A merchant logs into their dashboard to monitor engagement. They view total scan counts, unique daily catalog visitors, and WhatsApp click events. When they mark a product as "Unavailable" or change a price, the update is instantly reflected on the public catalog.

**Why this priority**: Merchants need immediate feedback that their catalog is generating customer engagement, as well as total control over out-of-stock items.

**Independent Test**: Can be tested by scanning a QR code twice, clicking the WhatsApp button once, logging into the merchant dashboard, and verifying that the analytics cards reflect the interactions accurately.

**Acceptance Scenarios**:

1. **Given** a merchant in the analytics tab, **When** they view their store metrics, **Then** they see accurate counts for total QR scans, total catalog page views, and total WhatsApp button clicks.
2. **Given** a merchant toggling a product's availability to "Out of Stock", **When** a customer refreshes the public catalog, **Then** the product immediately displays an "Out of Stock" badge and disable option selections.

---

### Edge Cases

- **Concurrent Quota Bypass**: Multiple rapid product creation requests sent simultaneously must be handled atomically; the system must never permit a merchant to exceed 100 active products.
- **Network Interruption During Image Upload**: If a merchant loses connectivity during photo upload, the system must abort cleanly without leaving orphaned records, displaying a clear retry option.
- **Zero-Product Catalog**: If a merchant publishes an empty catalog, the public page must display an inviting branded empty state rather than a blank or broken screen.
- **Missing or Invalid WhatsApp Number**: If a merchant enters an invalid phone format, the validation layer must catch and guide them with an inline helper before saving.
- **Deleted Product with Active Link**: If a consumer accesses a direct link to a deleted product, the system must return a clean, user-friendly notice and redirect them to the store's main catalog.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow merchants to register and authenticate using secure email and password credentials.
- **FR-002**: System MUST automatically create a default business profile and initial default branch upon successful registration.
- **FR-003**: System MUST provide an interface for merchants to manage master product categories (up to a maximum of 15 active categories per business).
- **FR-004**: System MUST allow merchants to create and manage master products (up to a maximum of 100 active products per business).
- **FR-005**: System MUST automatically compress all uploaded merchant product images in the user's browser to the WebP format (<100KB per image) before transmission.
- **FR-006**: System MUST enforce an image quota of no more than 3 images per master product and no more than 50 MB total media per business.
- **FR-007**: System MUST support tiered product pricing: optional base price, explicit variant prices (e.g., sizes, colors), option modifier price deltas (e.g., add-ons), and catalog-level price overrides.
- **FR-008**: System MUST support product options with constraints: single-select (radio), multi-select (checkbox), minimum selection requirements, and maximum allowed selections.
- **FR-009**: System MUST render public catalog pages (`/c/:catalogSlug`) as fully formed, accessible HTML on the edge with complete OpenGraph metadata and JSON-LD structured data.
- **FR-010**: System MUST support dynamic permanent QR redirection through `/q/:shortCode` delivering an HTTP 302 redirect in under 100 milliseconds.
- **FR-011**: System MUST track analytics events (scans, views, WhatsApp clicks) asynchronously without blocking consumer navigation.
- **FR-012**: System MUST protect consumer privacy by estimating unique visitors using daily rotating cryptographic salts and MUST NEVER store raw IP addresses.
- **FR-013**: System MUST identify and separate automated search crawlers and social media preview bots from commercial human scan metrics.
- **FR-014**: System MUST format pre-populated WhatsApp order messages containing exact customer item selections, quantities, and calculated prices.
- **FR-015**: System MUST provide full Right-to-Left (RTL) Arabic language presentation as primary, with seamless English (LTR) language support.
- **FR-016**: System MUST serve a dynamic sitemap (`/sitemap.xml`) indexing only active published catalogs, and a valid `/robots.txt` restricting admin and redirect paths.

### Key Entities

- **Business**: Represents the tenant organization. Owns master categories, master products, catalogs, and media assets.
- **Branch**: Represents a physical location. Every business has at least one default branch.
- **Category**: Represents a classification grouping belonging to the business (e.g., "Main Dishes", "Drinks").
- **Product**: Canonical master item owned by the business. Holds name, description, barcode, SKU, brand, and status.
- **ProductVariant**: Specific sellable variation of a product (e.g., Size Medium, Color Navy) with distinct price and inventory availability.
- **ProductOptionGroup**: Group of customizations associated with a product (e.g., "Choose your dressing", "Extra toppings").
- **ProductOptionValue**: Individual selectable choice within an option group with an optional price delta (+5.00).
- **ProductMedia**: Image asset linked to a product, holding optimized storage path, cover flag, and sort order.
- **Catalog**: Curated presentation view of a business's offerings, holding slug, published status, and theme configurations.
- **CatalogItem**: Join entity placing a product within a catalog with catalog-specific category mapping, sort order, and optional price override.
- **QRCode**: Stable dynamic redirection record holding unique short code, destination link, and lifetime scan aggregates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new merchant can complete registration and publish their first catalog with at least 5 products in under 8 minutes.
- **SC-002**: Public catalog pages achieve a First Contentful Paint (FCP) of under 1.2 seconds on standard 4G mobile connections.
- **SC-003**: QR code scan redirection (`/q/:shortCode`) resolves to the destination catalog with a server response time under 100ms.
- **SC-004**: 100% of uploaded product images are converted and compressed to WebP under 150KB before reaching persistent storage.
- **SC-005**: Zero data leakage or cross-tenant visibility across distinct merchants under all read and write operations.
- **SC-006**: WhatsApp ordering button initiates a pre-filled chat with 100% correct item titles and price calculations in all user test scenarios.
- **SC-007**: System strictly prevents creation of the 101st product under concurrent submission conditions.

## Assumptions

- **Target Operating Budget**: The system operates at $0 initial monthly hosting cost utilizing the Cloudflare Workers Free and Supabase Free tiers.
- **Primary Domain Availability**: All public catalog, admin, and QR traffic routes through the designated primary domain `https://digitalmenu.daleel-al-suez.com/`.
- **Consumer Device Profile**: 90%+ of consumer catalog visits occur on smartphones (iOS and Android mobile browsers).
- **Payment Processing**: Merchant billing and consumer digital payments are explicitly deferred; all commercial transactions are finalized offline or via WhatsApp.
- **Language Priority**: Interface copy, error messaging, and layouts prioritize Arabic (RTL) first, with English (LTR) as a secondary option.

