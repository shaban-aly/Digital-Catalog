# Feature Specification: Tenant Authorization & Data Isolation (TEN-001)

**Feature Branch**: `002-tenant-authorization`

**Feature ID**: `TEN-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "TEN-001 Tenant Authorization: Protect each merchant's business data from other merchants while allowing permitted members to manage their own store, enforcing PostgreSQL Row Level Security (RLS) as the unbypassable security boundary."

---

## Purpose and Business Value

Establish an unbypassable multi-tenant security boundary at the database layer (PostgreSQL Row Level Security - RLS). Ensure complete commercial confidentiality between merchants, guarantee that an authenticated user can only access and modify data belonging to their authorized business (`business_id`), and provide safe, read-only access for anonymous public visitors to published catalog data.

---

## Scope and Boundaries

- **In Scope**:
  - Association between authenticated identities (`auth.uid()`) and businesses via the `business_members` table.
  - Role definition: `owner`, `admin`, `editor`, and `viewer`.
  - Comprehensive Row Level Security (RLS) policies on all tenant-owned tables (`businesses`, `business_members`, `branches`, `categories`, `products`, `product_variants`, `variant_options`, `product_modifiers`, `product_media`, `catalogs`, `catalog_items`, `qr_codes`).
  - Public read-only RLS policy for anonymous visitors accessing published catalog data.
  - Client-side verification and security guards (UX only; data security is 100% database-enforced).
- **Out of Scope**:
  - Initial user authentication mechanics (owned by `IDN-001`).
  - Initial business creation onboarding flow (owned by `BIZ-001`).
  - Platform-wide Super Admin multi-tenant bypass (owned by `ADM-001`).

---

## Actors and Permissions

- **Store Owner (`owner`)**: Full administrative authority over their business, including store profile, branches, members, catalog, products, and media.
- **Store Editor (`editor` / `admin`)**: Permitted to create, edit, and delete categories, products, media, and catalogs for their assigned business, but cannot delete the business or alter membership.
- **Public Visitor / Consumer (Anonymous)**: Read-only access restricted strictly to published catalogs, categories, active products, and media associated with active businesses.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Strict Cross-Tenant Data Isolation (Priority: P1) 🎯 MVP

Merchant A (owner of "مطعم السويس") signs into the dashboard. Simultaneously, Merchant B (owner of "كافيه كورنر") manages their menu. Merchant A must never be able to read, modify, or delete Merchant B's products or categories, even if Merchant A crafts manual API requests or supplies Merchant B's UUID.

**Why this priority**: Absolute multi-tenant security mandate. Any data leak between competing merchants would destroy platform trust and violate commercial privacy.

**Independent Test**: Can be tested independently by logging in as User A, attempting a direct PostgREST `SELECT` or `UPDATE` on a product belonging to User B's `business_id`, and verifying that PostgreSQL returns an empty set or 0 rows modified (never disclosing data or throwing leaky error codes).

**Acceptance Scenarios**:

1. **Given** Merchant A is authenticated, **When** they query products via the API, **Then** only products where `business_id` matches Merchant A's membership are returned.
2. **Given** Merchant A attempts to update or delete a product belonging to Merchant B by providing Merchant B's product ID, **When** the query executes, **Then** RLS rejects the operation and zero rows are affected.
3. **Given** Merchant A attempts to insert a new product with Merchant B's `business_id`, **When** the query executes, **Then** PostgreSQL RLS with `WITH CHECK` constraint aborts the insert with permission denied.

---

### User Story 2 - Public Read-Only Access to Published Catalogs (Priority: P1)

An anonymous customer scans a QR code or opens a store's public subdomain. They must be able to view the store's published catalog, categories, products, and prices immediately without an account, while being strictly barred from viewing draft items or modifying any records.

**Why this priority**: Required for consumer catalog browsing while keeping the database safe from unauthorized tampering.

**Independent Test**: Can be tested by making an unauthenticated `GET` request to public catalog endpoints, confirming published items are returned, and verifying that any unauthenticated `POST`, `PATCH`, or `DELETE` request is immediately rejected by PostgreSQL RLS.

**Acceptance Scenarios**:

1. **Given** an anonymous request, **When** querying categories or products for an active, published business, **Then** only active published records are returned.
2. **Given** an anonymous request, **When** attempting to insert, update, or delete any record, **Then** PostgreSQL RLS denies the operation immediately.
3. **Given** an unpublished draft product or inactive category, **When** an anonymous visitor requests the catalog, **Then** draft/inactive items are excluded by database RLS.

---

### User Story 3 - Role-Based Store Ownership & Membership (Priority: P1)

A business owner wants to invite a store manager as an editor. The manager can update menu prices and products, but cannot delete the business profile or reassign ownership.

**Why this priority**: Supports real-world business collaboration while preventing rogue takeovers.

**Independent Test**: Can be tested by executing a business profile update from an `editor` user and verifying that only `owner` users can alter critical business settings or delete the tenant.

**Acceptance Scenarios**:

1. **Given** an authenticated user with `owner` role, **When** they update business details or manage members, **Then** the operation succeeds.
2. **Given** an authenticated user with `editor` role, **When** they attempt to delete the business or alter membership roles, **Then** the operation is rejected.

---

### Edge Cases

- **PostgREST Payload Tampering**: What happens if an authenticated merchant alters the JSON body of a product creation request to pass another business's `business_id`? The PostgreSQL RLS `WITH CHECK (EXISTS (SELECT 1 FROM public.business_members WHERE business_id = products.business_id AND user_id = auth.uid()))` policy must evaluate the foreign key and reject the payload.
- **Membership Revocation During Active Session**: What happens if an owner removes a member while that member has an active session token? Because RLS checks `business_members` dynamically on every single database query, subsequent requests immediately fail even before their JWT expires.
- **Infinite Recursion in RLS Policies**: What happens if an RLS policy on `business_members` queries `business_members` in a recursive subquery? A clean security-definer helper function (or direct unnested policy) must be used to eliminate PostgreSQL recursion errors.
- **Non-Existent or Suspended Tenant**: What happens when an unauthenticated visitor requests an unknown or suspended tenant? The system returns empty data or 404 without revealing platform system structure.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every tenant-owned table in the `public` schema MUST have PostgreSQL Row Level Security (RLS) enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **FR-002**: Every tenant-owned table MUST include a non-nullable `business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE`.
- **FR-003**: The system MUST verify tenant membership dynamically on every read and write by matching `auth.uid()` against `public.business_members`.
- **FR-004**: System MUST reject any insert or update operation where the caller is not an authorized member of the specified `business_id` (`WITH CHECK` policy).
- **FR-005**: Public anonymous read access MUST be permitted only on published catalog items, active categories, and public business profiles of active businesses.
- **FR-006**: Public anonymous write access (insert, update, delete) MUST be universally denied on all application tables.
- **FR-007**: System MUST provide an optimized, non-recursive PostgreSQL security-definer function `is_business_member(target_business_id UUID)` to accelerate RLS evaluation without policy recursion.
- **FR-008**: System MUST provide a helper function `is_business_owner(target_business_id UUID)` to enforce owner-only destructive actions.
- **FR-009**: The Supabase Service Role Key MUST NEVER be used in client bundles or public edge runtime routes to bypass RLS.
- **FR-010**: An authenticated user with zero business memberships MUST receive empty results when querying tenant tables without throwing database syntax exceptions.
- **FR-011**: Inactive or suspended businesses MUST have their public catalog access revoked immediately at the RLS policy boundary.
- **FR-012**: Client-side route guards MUST be treated strictly as navigational aids; all security enforcement MUST reside in PostgreSQL RLS.

---

### Key Entities

- **BusinessMember**: Connects an authenticated user (`user_id` / `auth.uid()`) to a business (`business_id`) with a designated `role` (`owner`, `admin`, `editor`, `viewer`).
- **TenantSecurityContext**: The runtime security context evaluating `auth.uid()` against active memberships.
- **TenantRole**: Enumeration of permitted business roles: `owner` (full control), `admin` (operational admin), `editor` (menu editor), `viewer` (read-only member).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero cross-tenant data leaks: 100% of unauthorized cross-tenant queries return 0 rows or permission denied.
- **SC-002**: RLS policy evaluation overhead adds less than 5ms to standard tenant database queries.
- **SC-003**: 100% of tenant tables have RLS explicitly enabled and tested.
- **SC-004**: Instant revocation: Member removal in `business_members` terminates data access on the very next query without waiting for JWT expiry.
- **SC-005**: Zero service-role keys exposed in public client bundles or network requests.

---

## Assumptions & Dependencies

- **Dependency on IDN-001**: Relies on Supabase Auth establishing `auth.uid()`.
- **Database Architecture**: Operates within a single `public` schema in Supabase PostgreSQL, complying with Principle VIII.
- **Future Integration with ADM-001**: Platform Super Admin bypass is reserved strictly for `ADM-001` using verified administrative credentials.
