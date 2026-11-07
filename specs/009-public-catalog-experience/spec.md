# Feature Specification: Public Catalog Experience (PUB-001)

**Feature ID**: `PUB-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: CAT-001, PRD-001, MED-001, LIF-001, DOM-001

---

## 1. Purpose and Business Value

Provide customers and diners in Suez with a blazingly fast, mobile-optimized, Arabic-first digital menu and catalog. Customers can instantly view merchant branding, browse categories, inspect product details and variants, dynamically calculate prices with add-ons, and initiate direct WhatsApp inquiries with zero account creation or app installation.

---

## 2. Actors and Permissions

- **Public Visitor / Customer**: Unauthenticated public user accessing storefront via mobile or desktop. Can browse categories, search products, configure modifiers, and initiate WhatsApp orders.
- **Merchant**: Provides catalog content, branding, images, and prices through admin features (`CAT-001`, `PRD-001`, `MED-001`).

---

## 3. User Stories

### User Story 1: Merchant Branding & Storefront Presentation (P0 - Priority: Highest)
**As a** customer visiting a store link or scanning a QR code,  
**I want to** see the merchant's brand logo, cover banner, Arabic store name, phone number, and share options,  
**So that** I know I am viewing the correct business and can share the menu with friends or family.

- **Acceptance Criteria**:
  - Displays cover banner, business logo, store name, and currency.
  - Native Web Share API integration with clipboard fallback button.
  - Responsive layout optimized for mobile viewports (max width `max-w-lg` centered).

### User Story 2: Category Navigation & Real-Time Filtering (P0 - Priority: Highest)
**As a** customer browsing a large catalog,  
**I want to** tap category pills in a sticky horizontal scroll bar,  
**So that** I can instantly filter products by department without page reloads.

- **Acceptance Criteria**:
  - Horizontal sticky pills bar with "الكل" (All) and individual categories.
  - Shows active category indicator and product count badges.
  - Filtering updates the product grid instantly with zero latency.

### User Story 3: Product Card Presentation & Effective Pricing (P0 - Priority: Highest)
**As a** customer,  
**I want to** view product cards with cover images, localized names, descriptions, and correct prices,  
**So that** I have clear purchasing information at a glance.

- **Acceptance Criteria**:
  - Displays cover image with lazy loading and fallback placeholder.
  - Displays Arabic name, description snippet, and effective price.
  - Strikethrough compare-at price when discount is active.
  - Out-of-stock badge when `is_available = false`.

### User Story 4: Product Detail Drawer & Dynamic Price Calculation (P0 - Priority: Highest)
**As a** customer,  
**I want to** tap any product to open a detailed drawer to choose variants and modifiers,  
**So that** I can customize my order and see the exact updated total price in real time.

- **Acceptance Criteria**:
  - Mobile bottom sheet / modal drawer with image gallery, full description, and unit.
  - Variant selector updates base price dynamically.
  - Option groups enforce single-select / multi-select rules (`min_selections`, `max_selections`).
  - Total price dynamically aggregates: `variant_price + sum(selected_option_deltas)`.

### User Story 5: Direct WhatsApp Inquiry Formatting (P0 - Priority: Highest)
**As a** customer ready to order or inquire,  
**I want to** click "طلب عبر واتساب" (Order via WhatsApp),  
**So that** a pre-filled Arabic WhatsApp message opens directly with the store owner.

- **Acceptance Criteria**:
  - Cleaned phone number (`replace(/\D/g, '')`) targeting `https://wa.me/{phone}`.
  - Structured message includes: Store name, product name, chosen variant, list of selected options with price deltas, computed total price, and product URL.
  - Graceful fallback alert if merchant has not configured a phone number.

### User Story 6: Empty & Graceful Recovery States (P1 - Priority: High)
**As a** customer viewing an empty category or a new store,  
**I want to** see an encouraging Arabic empty state message,  
**So that** I know more items are coming soon instead of assuming a broken page.

- **Acceptance Criteria**:
  - Renders friendly message: "لا توجد منتجات معروضة في هذا القسم حالياً."
  - Viral platform branding badge in footer.

---

## 4. Functional Requirements

- **FR-001**: Single round-trip SSR hydration via `PublicCatalogService.getCatalogBySlug` returning typed `PublicCatalogPayload`.
- **FR-002**: Mobile-first responsive presentation adhering to Suez design system tokens (`--primary: #047857`, RTL layout).
- **FR-003**: Dynamic price computation in the drawer MUST match exact server calculations (`PRD-001`).
- **FR-004**: WhatsApp message formatting MUST safely URI-encode all characters including Arabic text and emojis.
- **FR-005**: Public catalog route MUST emit Edge Caching headers: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.

---

## 5. Non-Functional & Constitutional Requirements

- **Principle I (Arabic RTL First)**: Authentic Egyptian phrasing, RTL direction, Cairo/system-ui font stack.
- **Principle II ($0 Infrastructure)**: Edge caching via Cloudflare Worker and direct Supabase database calls.
- **Principle VII (Strict Type Safety)**: 100% typed using `PublicCatalogPayload` and Zod schemas.
