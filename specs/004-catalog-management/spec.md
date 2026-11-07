# Feature Specification: Catalog and Category Management (CAT-001)

**Feature Branch**: `004-catalog-management`

**Feature ID**: `CAT-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "CAT-001 Catalog and Category Management: Let a merchant organize inventory into categories and curate the published catalog seen by customers, including ordering, availability, and catalog-level price overrides."

---

## Purpose and Business Value

Enable merchants to structure and curate their commercial offerings into ordered categories (e.g. "مقبلات", "مشويات", "حلويات", "عصائر") and maintain the presentation catalogs that storefront visitors browse. Separates master inventory from presentation catalogs, allowing flexible product placement, category-based navigation, featured product badges, and catalog-specific price adjustments without corrupting core inventory records.

---

## Scope and Boundaries

- **In Scope**:
  - Category Management: Create, edit, reorder, toggle visibility (active/inactive), and delete categories.
  - Localized Category Names: Mandatory Arabic name (`ar`), optional English name (`en`).
  - Free Tier Quota Enforcement: Hard limit of maximum 15 categories for Free plan accounts (`LMT-001`).
  - Catalog Placement & Curation (`catalog_items`): Mapping master products to catalog categories with presentation order, featured flag (`is_featured`), and availability toggle (`is_available`).
  - Catalog Price Overrides: Optional presentation price override on `catalog_items` leaving the master product's base price intact.
- **Out of Scope (Deferred to Separate Features)**:
  - Master product creation, variants, and option groups (owned by `PRD-001`).
  - Product media upload, WebP conversion, and storage (owned by `MED-001`).
  - Public catalog storefront rendering and SSR (owned by `PUB-001`).
  - Subdomain routing and edge resolution (owned by `DOM-001`).
  - Bulk CSV/Excel category and product import (owned by `IMP-001`).

---

## Actors and Permissions

- **Store Owner (`owner`) & Store Admin (`admin`)**: Can create, update, reorder, and delete categories and curate catalog items.
- **Store Editor (`editor`)**: Can reorder categories and update catalog items, but cannot delete categories containing products.
- **Store Viewer (`viewer`)**: Can view categories and catalog structures in the merchant dashboard in read-only mode.
- **Public Customer**: Can view published, active categories and available catalog items via public catalog endpoints.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Category Lifecycle & Hierarchy (Priority: P1) 🎯 MVP

A merchant logs into their dashboard and creates product categories (e.g. "وجبات سريعة", "مشروبات ساخنة") with sort orders. The merchant can edit category titles in Arabic (and optional English), toggle a category's visibility on/off, or delete an empty category.

**Why this priority**: Categories are the structural foundation of every catalog and menu. Products cannot be organized or cleanly navigated without categories.

**Independent Test**: Can be tested by creating categories with sort order, updating their names, verifying that they appear in ascending sort order, and toggling `is_active` to hide them from public queries.

**Acceptance Scenarios**:

1. **Given** an authenticated merchant, **When** they add a category with an Arabic name "المشروبات" and sort order 1, **Then** the category is saved and scoped to the merchant's business ID.
2. **Given** a business on the Free plan with 15 existing categories, **When** the merchant attempts to create a 16th category, **Then** the system rejects the operation with an Arabic limit alert ("تم الوصول للحد الأقصى للتصنيفات في الخطة المجانية (15 تصنيفاً)").
3. **Given** an active category, **When** the merchant sets `is_active = false`, **Then** the category is immediately excluded from public storefront queries while remaining manageable in the merchant dashboard.
4. **Given** a category that currently contains products, **When** the merchant attempts to delete it, **Then** the system rejects deletion with a protective constraint warning preventing orphan products.

---

### User Story 2 - Curated Catalog Placement & Item Presentation (Priority: P1) 🎯 MVP

A merchant associates an existing master product with a catalog category, assigns a display sort order, and flags highlight products as "مميز" (`is_featured = true`) to appear at the top of the category or on the storefront showcase banner.

**Why this priority**: Decouples inventory management from storefront curation, allowing merchants to present products exactly as desired for customer browsing.

**Independent Test**: Can be tested by adding a product to a catalog item row, setting `is_featured = true`, and querying catalog items to verify correct ordering and category association.

**Acceptance Scenarios**:

1. **Given** a master product and a catalog, **When** the merchant adds the product to a catalog category, **Then** a `catalog_items` record is created linking the catalog, product, and category.
2. **Given** a catalog item, **When** the merchant toggles `is_available = false`, **Then** the product appears as unavailable/sold out in that catalog without deleting the product from inventory.
3. **Given** multiple catalog items in a category, **When** sort orders are updated (0, 1, 2, ...), **Then** catalog items are fetched and rendered according to their sequential sort order.

---

### User Story 3 - Presentation Price Overrides (Priority: P2)

A merchant runs a special promo or branch-specific promotion in a catalog and sets a promotional presentation price for a product in that catalog without changing the master product's base price.

**Why this priority**: Provides commercial flexibility for events, seasonal catalogs, or branch-specific pricing while maintaining master inventory pricing integrity.

**Independent Test**: Can be tested by setting `price_override = 85.00` on a catalog item whose master product `base_price = 100.00`. Verifying that the catalog presentation displays 85.00 while the master product record remains 100.00.

**Acceptance Scenarios**:

1. **Given** a catalog item with a master product price of 120 EGP, **When** the merchant specifies a `price_override` of 99 EGP, **Then** public catalog queries return an effective price of 99 EGP.
2. **Given** a catalog item with a `price_override`, **When** the merchant clears the override (`null`), **Then** public catalog queries revert to the master product's `base_price`.

---

### Edge Cases

- **Category Deletion with Active Products**: Attempting to delete a category that still has products linked in `products.category_id` or `catalog_items.category_id` is prevented by `ON DELETE RESTRICT`, returning a clear Arabic instruction to move or delete the products first.
- **Deactivated Category Cascades**: When a category has `is_active = false`, all catalog items assigned to that category are excluded from public storefront responses, but remain intact in the database.
- **Bilingual Name Fallback**: If an English name is not provided, the public storefront gracefully displays the mandatory Arabic name without rendering empty tags or placeholders.
- **Category Sort Order Collisions**: If two categories share the same `sort_order`, the system uses `created_at ASC` as a deterministic secondary sort key.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require a non-empty Arabic name (`name.ar`) for every category; English name (`name.en`) MUST be optional.
- **FR-002**: System MUST scope all categories to their owning `business_id` and enforce multi-tenant isolation via database RLS.
- **FR-003**: System MUST enforce a maximum limit of 15 categories per business for tenants on the `free` plan tier.
- **FR-004**: System MUST allow merchants to set an integer `sort_order` for categories to control visual presentation order.
- **FR-005**: System MUST allow merchants to toggle `is_active` boolean on any category to show or hide it from the public storefront.
- **FR-006**: System MUST prevent deletion of categories containing associated products unless those products are reassigned or deleted.
- **FR-007**: System MUST provide catalog curation linking `catalog_id`, `product_id`, and `category_id` in `catalog_items`.
- **FR-008**: System MUST support an optional `price_override` (numeric with 2 decimal places) on `catalog_items` that overrides master product `base_price` for that catalog view only.
- **FR-009**: System MUST support an `is_featured` boolean on `catalog_items` to highlight prominent items in storefront banners and categories.
- **FR-010**: System MUST support an `is_available` boolean on `catalog_items` to mark items temporarily sold out in a specific catalog without altering inventory status.
- **FR-011**: System MUST provide bulk category reordering allowing the merchant dashboard to persist updated category positions in a single transaction.
- **FR-012**: All category forms, validation errors, and empty states MUST strictly conform to Arabic RTL typography and design tokens.

---

### Key Entities

- **Category (`public.categories`)**:
  - `id`: UUID (Primary Key)
  - `business_id`: UUID (Foreign Key -> `businesses(id)`)
  - `name`: JSONB (`{ ar: string, en?: string }`)
  - `sort_order`: INT (Default `0`)
  - `is_active`: BOOLEAN (Default `true`)
  - `created_at`: TIMESTAMPTZ
- **Catalog (`public.catalogs`)**:
  - `id`: UUID (Primary Key)
  - `business_id`: UUID (Foreign Key -> `businesses(id)`)
  - `name`: TEXT
  - `slug`: TEXT
  - `is_published`: BOOLEAN (Default `true`)
  - `theme_config`: JSONB (Default `{}`)
  - `created_at`: TIMESTAMPTZ
- **CatalogItem (`public.catalog_items`)**:
  - `id`: UUID (Primary Key)
  - `catalog_id`: UUID (Foreign Key -> `catalogs(id)`)
  - `product_id`: UUID (Foreign Key -> `products(id)`)
  - `category_id`: UUID (Foreign Key -> `categories(id)`)
  - `price_override`: NUMERIC(12, 2) (Nullable)
  - `sort_order`: INT (Default `0`)
  - `is_featured`: BOOLEAN (Default `false`)
  - `is_available`: BOOLEAN (Default `true`)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Merchants can create or update a category in under 3 seconds in the merchant dashboard.
- **SC-002**: Reordering categories persists and reflects on the storefront in under 500ms.
- **SC-003**: 100% of category and catalog queries are strictly bounded by tenant RLS with zero cross-tenant leakage.
- **SC-004**: Price overrides cleanly take precedence on public catalogs while leaving 100% of master inventory prices unchanged.
- **SC-005**: 100% of Arabic category names render properly with zero layout shifts or RTL inversion bugs.

---

## Assumptions & Dependencies

- **Dependency on TEN-001**: RLS policies for `categories`, `catalogs`, and `catalog_items` rely on `is_business_member()` / `is_business_owner()`.
- **Dependency on BIZ-001**: A tenant business and primary catalog must exist before categories and catalog items can be created.
- **Downstream Consumer PRD-001**: Master products created in `PRD-001` link to `categories(id)`.
- **Downstream Consumer PUB-001**: Public catalog storefront fetches active categories and ordered catalog items.
