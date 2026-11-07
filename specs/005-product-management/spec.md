# Feature Specification: Product, Variant, and Modifier Management (PRD-001)

**Feature Branch**: `005-product-management`

**Feature ID**: `PRD-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "PRD-001 Product, Variant, and Modifier Management: Allow merchants to create reusable product records with accurate pricing, variations, and customer selections."

---

## Purpose and Business Value

Allow merchants to establish, price, and maintain their core product inventory—the items that populate their digital menus and online catalogs. Supports multi-size/multi-attribute variations (e.g., Small / Medium / Large, Colors, Flavors) and customizable customer modifier groups (e.g., Extra Cheese, Sugar Level, Cooking Preference) with deterministic price calculations. Strictly enforces the Free-First platform quota (maximum 100 active products per business) and maintains full Arabic-first typography.

---

## Scope and Boundaries

- **In Scope**:
  - Master product lifecycle: Create, update, toggle availability, archive, and delete products.
  - Localized attributes: Mandatory Arabic name (`ar`) with optional English name (`en`), and localized description.
  - Pricing & Commercial Fields: Base price (`base_price`), compare-at discount price (`compare_at_price`), SKU, barcode, unit (e.g., `piece`, `kg`).
  - Product Variants (`product_variants`): Distinct commercial variations with individual prices, compare-at prices, availability flags, and custom attributes.
  - Option Groups & Modifiers (`product_option_groups`, `product_option_values`): Customer choices with single/multi-selection rules, min/max selection constraints, and price adjustments (`price_delta`).
  - Free Tier Quota Enforcement: Hard limit of maximum 100 products per business (`LMT-001`).
  - Effective Price Calculation: Deterministic resolution across base price, variant price, and modifier deltas.
- **Out of Scope (Deferred to Separate Features)**:
  - Media upload, compression, and WebP storage (owned by `MED-001`).
  - Presentation catalog placement and category assignments (owned by `CAT-001`).
  - Public storefront display and SSR rendering (owned by `PUB-001`).
  - Shopping cart aggregation and WhatsApp order formatting (owned by `COM-001`).
  - Stock decrements, warehouse inventory, and POS barcode hardware integration (deferred).

---

## Actors and Permissions

- **Store Owner (`owner`) & Store Admin (`admin`)**: Can create, edit, price, configure variants/options, and delete/archive products.
- **Store Editor (`editor`)**: Can update prices, descriptions, and availability, but cannot delete products.
- **Store Viewer (`viewer`)**: Can inspect product details in the merchant dashboard in read-only mode.
- **Public Customer**: Can view active products, choose variants, select valid modifier combinations, and view effective calculated prices.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Product Definition & Availability (Priority: P1) 🎯 MVP

A merchant creates a product (e.g., "بيتزا مارجريتا") with an Arabic name, selects an existing category ("بيتزا وفطائر"), enters a base price (95.00 EGP), and sets a compare-at price (110.00 EGP) to display a discount badge. The merchant can toggle the product's availability ("متوفر" / "نفد من المخزون") at any time.

**Why this priority**: Products are the fundamental transactional items in every catalog. Without basic product records, no catalog can display items or take orders.

**Independent Test**: Can be tested by creating a product with name, price, and category, querying the business's product list, verifying price fields, and toggling availability between `active` and `out_of_stock`.

**Acceptance Scenarios**:

1. **Given** an authenticated merchant with an existing category, **When** they submit a product with Arabic name "شاورما دجاج" and base price 65.00 EGP, **Then** a product record is created with `status = 'active'` scoped to their business ID.
2. **Given** a business on the Free plan with 100 existing products, **When** the merchant attempts to create a 101st product, **Then** the system rejects the operation with an Arabic limit alert ("تم الوصول للحد الأقصى للمنتجات في الخطة المجانية (100 منتج)").
3. **Given** an active product, **When** the merchant marks it as out of stock, **Then** the product status transitions to `out_of_stock` and its catalog availability flag updates accordingly.
4. **Given** an existing product, **When** the merchant archives it, **Then** `status` is set to `archived` and it is excluded from dashboard default lists and public menus.

---

### User Story 2 - Product Variants (Sizes & Flavors) (Priority: P1) 🎯 MVP

A merchant sells a product that comes in multiple sizes (e.g., "وسط", "كبير", "عائلي"). The merchant defines variants for the product, assigning a specific price to each variant. When a customer selects "كبير", the storefront price updates to the variant's price.

**Why this priority**: The vast majority of restaurants, cafes, and retail shops sell items with size or model variations; variants are essential for real-world ordering.

**Independent Test**: Can be tested by attaching 3 variants with prices (50, 75, 100 EGP) to a product, verifying that variant records are saved and linked to the parent product ID with ascending sort order.

**Acceptance Scenarios**:

1. **Given** a master product, **When** the merchant adds variants ("صغير" at 40 EGP, "كبير" at 60 EGP), **Then** variant records are stored in `product_variants` referencing `product_id`.
2. **Given** a variant, **When** the merchant sets `is_available = false` on that specific variant, **Then** only that variant is marked unavailable while the parent product and remaining variants remain available.
3. **Given** a product with variants, **When** effective price is calculated with a selected variant, **Then** the variant's price overrides the parent product's `base_price`.

---

### User Story 3 - Option Groups & Modifiers with Selection Bounds (Priority: P2)

A merchant configures customization options for a product, such as "الإضافات" (Extra Cheese +15 EGP, Mushrooms +10 EGP) with rules: `is_required = false`, `min_selections = 0`, `max_selections = 3`. For a beverage, the merchant sets "درجة السكر" (No Sugar, Medium, Extra) with `is_required = true`, `min_selections = 1`, `max_selections = 1`.

**Why this priority**: Modifiers provide essential menu customization, increasing average order value and customer satisfaction.

**Independent Test**: Can be tested by creating an option group with min/max bounds and option values with price deltas, validating that option groups and values are stored with parent relationships, and calculating the final price including modifier deltas.

**Acceptance Scenarios**:

1. **Given** a product, **When** the merchant creates an option group "نوع الخبز" with `is_required = true`, `min_selections = 1`, and `max_selections = 1`, **Then** the group is saved with exact selection constraints.
2. **Given** an option group, **When** option values with `price_delta` (e.g. +10.00 EGP) are added, **Then** selecting this modifier increases the total item price by 10.00 EGP.
3. **Given** customer selections for an option group, **When** fewer than `min_selections` or more than `max_selections` are chosen, **Then** the selection validator rejects the combination.

---

### Edge Cases

- **Free Tier Quota Boundary (100 Products)**: Attempting to insert a 101st product throws an Arabic exception before database insertion, prompting the merchant to upgrade via WhatsApp.
- **Product with Variants but No Base Price**: When a product defines variants, `base_price` on the master record is optional; the system displays "يبدأ من [أقل سعر متغير]".
- **Option Group Constraint Inversion**: System validates that `min_selections <= max_selections` and `min_selections >= 0`. Any inverted bounds (e.g. min 2, max 1) are rejected at schema validation.
- **Product Deletion Cascades**: Deleting a product automatically cascades to its `product_variants`, `product_option_groups`, `product_option_values`, and `catalog_items`, leaving zero orphan modifier or variant records.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require a valid `category_id` (UUID referencing an existing category) and a non-empty Arabic name (`name.ar`) for every master product.
- **FR-002**: System MUST enforce a maximum limit of 100 active products per business on the `free` plan tier.
- **FR-003**: System MUST support product status transitions between `active`, `out_of_stock`, and `archived`.
- **FR-004**: System MUST store prices as non-negative decimal values with 2 decimal places (`NUMERIC(12, 2)`).
- **FR-005**: System MUST allow optional `compare_at_price` to represent original/pre-discount prices for promotional discount calculation.
- **FR-006**: System MUST support up to 10 variants per product in `product_variants`, each with mandatory localized name and positive price.
- **FR-007**: System MUST allow individual availability toggling (`is_available`) per variant independently of parent product status.
- **FR-008**: System MUST support multiple option groups per product, each with `is_required`, `min_selections`, `max_selections`, and `sort_order`.
- **FR-009**: System MUST support option values within each group, each with a localized name, a non-negative `price_delta`, and a default selection flag (`is_default`).
- **FR-010**: System MUST validate that customer modifier selections conform to group bounds: `min_selections <= selections.length <= max_selections`.
- **FR-011**: System MUST resolve effective item prices deterministically according to the formula:
  $$\text{Effective Price} = (\text{Variant Price} \text{ or } \text{Base Price}) + \sum \text{Selected Option Deltas}$$
- **FR-012**: All product forms, modifier builders, variant grids, and validation alerts MUST strictly conform to Arabic RTL typography.

---

### Key Entities

- **Product (`public.products`)**:
  - `id`: UUID (Primary Key)
  - `business_id`: UUID (Foreign Key -> `businesses(id)`)
  - `category_id`: UUID (Foreign Key -> `categories(id)`)
  - `name`: JSONB (`{ ar: string, en?: string }`)
  - `description`: JSONB (`{ ar?: string, en?: string }`, Nullable)
  - `base_price`: NUMERIC(12, 2) (Nullable if variants exist)
  - `compare_at_price`: NUMERIC(12, 2) (Nullable)
  - `barcode`: TEXT (Nullable)
  - `sku`: TEXT (Nullable)
  - `unit`: TEXT (Default `'piece'`)
  - `status`: TEXT (`'active'`, `'out_of_stock'`, `'archived'`, Default `'active'`)
  - `attributes`: JSONB (Default `{}`)
  - `created_at`: TIMESTAMPTZ, `updated_at`: TIMESTAMPTZ
- **ProductVariant (`public.product_variants`)**:
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Foreign Key -> `products(id) ON DELETE CASCADE`)
  - `name`: JSONB (`{ ar: string, en?: string }`)
  - `price`: NUMERIC(12, 2) (Required, > 0)
  - `compare_at_price`: NUMERIC(12, 2) (Nullable)
  - `is_available`: BOOLEAN (Default `true`)
  - `attributes`: JSONB (Default `{}`)
  - `sort_order`: INT (Default `0`)
- **ProductOptionGroup (`public.product_option_groups`)**:
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Foreign Key -> `products(id) ON DELETE CASCADE`)
  - `name`: JSONB (`{ ar: string, en?: string }`)
  - `is_required`: BOOLEAN (Default `false`)
  - `min_selections`: INT (Default `0`)
  - `max_selections`: INT (Default `1`)
  - `sort_order`: INT (Default `0`)
- **ProductOptionValue (`public.product_option_values`)**:
  - `id`: UUID (Primary Key)
  - `group_id`: UUID (Foreign Key -> `product_option_groups(id) ON DELETE CASCADE`)
  - `name`: JSONB (`{ ar: string, en?: string }`)
  - `price_delta`: NUMERIC(12, 2) (Default `0.00`)
  - `is_default`: BOOLEAN (Default `false`)
  - `sort_order`: INT (Default `0`)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Merchants can create a standard product with price and category in under 15 seconds.
- **SC-002**: Complex products with 3 variants and 2 modifier groups can be created in under 60 seconds.
- **SC-003**: 100% of price calculations across variants and modifiers resolve with mathematical precision and zero floating-point rounding errors.
- **SC-004**: Free tier quota enforcement successfully blocks the 101st product with 100% accuracy.
- **SC-005**: Product deletion cleanly cascades without leaving orphan variants or option records in the database.

---

## Assumptions & Dependencies

- **Dependency on BIZ-001**: Master products must belong to an active business tenant.
- **Dependency on CAT-001**: Every product requires a valid foreign key referencing an existing `category_id`.
- **Downstream Consumer MED-001**: Images and media assets are associated with products in `MED-001`.
- **Downstream Consumer COM-001**: WhatsApp cart calculates totals using the price hierarchy established in `PRD-001`.
