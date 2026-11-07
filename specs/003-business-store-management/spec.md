# Feature Specification: Business and Store Management (BIZ-001)

**Feature Branch**: `003-business-store-management`

**Feature ID**: `BIZ-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "BIZ-001 Business and Store Management: Enable a merchant to create and maintain the business identity that owns its catalog, public URL, contact details, and default operational branch."

---

## Purpose and Business Value

Enable a merchant to establish and manage their store's commercial identity—the central tenant entity that owns all product catalogs, categories, images, and QR codes. Ensures each business receives a unique, DNS-compliant platform subdomain (`{store-slug}.digitalmenu.daleel-al-suez.com`), automatically provisions a default operational branch ("الفرع الرئيسي"), and records essential store contact details and currency settings.

---

## Scope and Boundaries

- **In Scope**:
  - Store profile creation: business name, unique DNS-safe slug, industry category, currency (`EGP`), contact phone number.
  - Atomic provisioning: creating business record, assigning owner in `business_members`, creating default branch in `branches`, and initializing primary catalog in `catalogs`.
  - Real-time slug availability check (DNS RFC 1123 validation, collision check, reserved-slug check).
  - Store profile maintenance (updating name, phone number, industry, logo, cover image).
- **Out of Scope (Deferred to Separate Features)**:
  - Multi-branch operational management (beyond the 1 default branch in MVP).
  - Lifecycle state toggles (suspension / archival owned by `LIF-001` and `ADM-001`).
  - Public catalog edge rendering (owned by `PUB-001` and `DOM-001`).

---

## Actors and Permissions

- **New Merchant**: Completes store setup during registration.
- **Store Owner (`owner`)**: Can update store details, brand assets, and contact information.
- **Store Member (`editor` / `viewer`)**: Can view store profile, but cannot rename or alter core business identity.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store Profile Creation & Atomic Provisioning (Priority: P1) 🎯 MVP

A newly registered merchant completes the registration form with their store name (e.g. "شاورما وبس"), chooses an industry ("restaurant"), and picks a slug ("shawarma-w-bass"). The system creates the business, binds the merchant as owner, provisions the default branch ("الفرع الرئيسي"), and initializes their primary catalog in one atomic step.

**Why this priority**: Foundational tenant creation. Without an active business entity, no catalogs, products, or menus can exist.

**Independent Test**: Can be tested by submitting store creation parameters for a new user, verifying that a `businesses` record is created, a corresponding row in `business_members` with `role = 'owner'` exists, and a row in `branches` with `is_default = true` is created.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no prior business, **When** they submit valid store details (name, valid slug, industry), **Then** a new business record is created with default limits (`max_products = 100`, `max_categories = 15`, `plan_code = 'free'`).
2. **Given** a successfully created business, **Then** the user is automatically assigned `owner` role in `business_members`.
3. **Given** a successfully created business, **Then** a default branch named "الفرع الرئيسي" (`is_default = true`) is automatically provisioned.
4. **Given** a database failure during branch or membership assignment, **Then** the entire creation rolls back with zero orphan business records left behind.

---

### User Story 2 - Real-Time DNS-Safe Slug Validation (Priority: P1)

As a merchant enters their store name or custom slug, the system provides immediate, real-time feedback indicating whether the slug is valid, DNS-compliant (RFC 1123), and available for booking on `{store-slug}.digitalmenu.daleel-al-suez.com`.

**Why this priority**: Eliminates form frustration and guarantees that all created subdomains function cleanly within Cloudflare DNS and URL standards without collision.

**Independent Test**: Can be tested by entering "ahmed-cafe" (available -> green badge), "a" (too short -> warning), "test--slug" (double hyphens -> rejected), "admin" (reserved -> unavailable), and an existing store's slug (taken -> rejected).

**Acceptance Scenarios**:

1. **Given** a merchant typing a slug, **When** the input is shorter than 3 characters or longer than 63 characters, **Then** the system warns that the slug length is invalid.
2. **Given** a slug containing spaces, Arabic characters, uppercase letters, or special symbols, **When** evaluated, **Then** the system normalizes it or rejects invalid characters.
3. **Given** a slug already claimed by another active merchant, **When** checked, **Then** the system returns an Arabic alert ("هذا الرابط مسجل لمتجر آخر").
4. **Given** a slug reserved by the platform (e.g., `admin`, `api`, `support`, `digitalmenu`), **When** checked, **Then** the system rejects the slug as unavailable.

---

### User Story 3 - Business Profile Maintenance & Store Settings (Priority: P2)

An existing store owner opens "إعدادات المتجر" (Store Settings) in their dashboard to update their phone number, change their industry type, or upload a new store logo.

**Why this priority**: Merchants must be able to keep their public business information accurate over time.

**Independent Test**: Can be tested by loading store settings, updating the phone number and store name, saving, and verifying that the updated values persist in the database and appear on the public catalog.

**Acceptance Scenarios**:

1. **Given** an authenticated store owner, **When** they update their store phone number, **Then** the new number is saved and formatted for WhatsApp ordering.
2. **Given** an authenticated store member with `viewer` role, **When** they attempt to modify store settings, **Then** the action is disabled and rejected by database RLS.

---

### Edge Cases

- **Slug Collisions from Simultaneous Signups**: What happens if two merchants submit the same slug at the exact same second? A unique database constraint on `businesses(slug)` guarantees that only one insert succeeds, while the second receives a clean duplicate constraint error.
- **Double Hyphens in Slugs**: What happens if a merchant enters `best--burgers`? Double hyphens are rejected because they conflict with internationalized domain name (IDN) Punycode standards (`xn--`).
- **Orphan User Recovery**: What happens if a user signs up but disconnects before completing store creation? Upon subsequent login, the system detects zero memberships and automatically routes them to the store creation onboarding screen.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a new business record upon merchant onboarding with: name, slug, industry type, currency (`EGP`), and optional phone number.
- **FR-002**: System MUST enforce DNS RFC 1123 compliance on all store slugs: 3 to 63 characters, lowercase alphanumeric (`a-z`, `0-9`) and single hyphens (`-`), no leading or trailing hyphens, and no consecutive hyphens (`--`).
- **FR-003**: System MUST verify slug uniqueness against all existing businesses and against the reserved platform slug registry.
- **FR-004**: System MUST automatically assign the registering user as the `owner` of the new business in `business_members`.
- **FR-005**: System MUST automatically create one default branch named "الفرع الرئيسي" (`is_default = true`) associated with the business.
- **FR-006**: System MUST automatically initialize a primary published catalog (`catalogs`) with the matching store slug and industry preset.
- **FR-007**: System MUST assign default free plan parameters (`plan_code = 'free'`, `max_products = 100`, `max_categories = 15`) to all newly created businesses.
- **FR-008**: System MUST provide an interface in the merchant dashboard for store owners to update business name, phone number, industry, logo URL, and cover URL.
- **FR-009**: System MUST prevent non-owner members from updating critical business parameters or transferring ownership.
- **FR-010**: System MUST automatically redirect merchants with zero active businesses to the store creation screen upon login.
- **FR-011**: System MUST provide real-time debounced slug availability checks with instant visual feedback (idle, checking, available, unavailable).
- **FR-012**: All business forms, error states, and slug recommendations MUST strictly adhere to Arabic Right-to-Left (RTL) typography and design standards.

---

### Key Entities

- **Business**: Represents the merchant's commercial organization. Attributes: `id` (UUID PK), `name` (string), `slug` (unique string), `industry_type` (enum), `currency_code` (ISO 3-letter, default `EGP`), `phone_number` (optional string), `logo_url` (optional string), `cover_url` (optional string), `plan_code` (default `'free'`), `max_products` (default 100), `max_categories` (default 15), `status` (default `'active'`), `created_at`, `updated_at`.
- **Branch**: Represents an operational physical location of a business. Attributes: `id` (UUID PK), `business_id` (UUID FK), `name` (string), `is_default` (boolean), `address` (optional string), `created_at`.
- **IndustryType**: Enum defining store category: `'restaurant'` (مطاعم وكافيهات), `'grocery'` (سوبرماركت وبقالة), `'fashion'` (أزياء وملابس), `'services'` (خدمات أخرى).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new merchant can complete the store creation form in under 20 seconds.
- **SC-002**: Real-time slug availability check delivers visual feedback in under 300ms from user keystroke.
- **SC-003**: 100% of created slugs strictly comply with DNS RFC 1123 and have zero collisions with existing businesses or reserved words.
- **SC-004**: Atomic guarantee: Zero orphan business records or incomplete store setups exist in the database.
- **SC-005**: Profile updates reflect on public catalog storefronts in under 2 seconds.

---

## Assumptions & Dependencies

- **Dependency on IDN-001**: User identity `auth.uid()` must be authenticated before business creation.
- **Dependency on TEN-001**: Tenant authorization and RLS policies govern all database interactions for `businesses` and `branches`.
