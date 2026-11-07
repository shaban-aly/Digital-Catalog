# Feature Specification: Platform Super Admin Dashboard (ADM-001)

**Feature Branch**: `016-platform-admin`

**Feature ID**: `ADM-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: MVP Core

**Input**: User directive: "توفير لوحة تحكم في المنصة ككل وليس فقط العميل أو التاجر، مع إدارة المتاجر وحالاتها، والتحكم في باقات واشتراكات التجار والترقيات اليدوية في ظل غياب بوابات الدفع الإلكترونية الآلية حالياً."

---

## Purpose and Business Value

Provide the platform owner and operations team with a centralized, secure **Super Admin Dashboard (`/platform-admin`)** to oversee all platform activity, manage merchant stores, suspend abusive or unpaid stores, manually adjust subscription plans and resource quotas upon offline payment (InstaPay / Vodafone Cash), and govern reserved subdomain namespaces.

---

## Scope and Boundaries

- **In Scope**:
  - Platform-wide KPI metrics (total merchants, active stores, total products, aggregate scan events).
  - Centralized store directory with search, filtering, and status controls (Active, Suspended, Maintenance).
  - Manual subscription management (updating merchant plan `free` / `pro`, adjusting `max_products` and `max_categories`, setting expiry).
  - Reserved slug governance (protecting system namespaces like `admin`, `api`, `support`, `billing`, `digitalmenu`).
  - Strict Super Admin authorization gate preventing merchant or public access.
- **Out of Scope (Deferred to Future Releases)**:
  - Automated recurring credit card payment webhooks (Stripe / Paymob).
  - Automated invoicing and tax PDF generation.
  - Platform-wide bulk email marketing broadcasts.

---

## Actors and Permissions

- **Platform Super Admin**: The platform owner / privileged staff. Granted access to view all tenants, modify tenant plans, override quotas, and change store operational status.
- **Merchant**: Operates within their own tenant boundary (`/dashboard`). Has zero access to `/platform-admin`.
- **Public Visitor / Customer**: Unauthenticated user. Strictly barred from administrative routes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Platform Overview & KPIs (Priority: P1)

As the platform owner, I want to view a centralized dashboard displaying high-level metrics across all tenants so I can understand platform growth, merchant adoption, and system health at a glance.

**Why this priority**: Essential executive visibility for managing the SaaS platform.

**Independent Test**: Can be tested by signing in as Super Admin and loading `/platform-admin`, verifying aggregate counts for merchants, active stores, products, and QR scans match database counts.

**Acceptance Scenarios**:

1. **Given** an authenticated Super Admin, **When** they navigate to `/platform-admin`, **Then** the platform dashboard renders aggregate counters: Total Merchants, Active Stores, Suspended Stores, Total Products, and Total 30-day QR Scans.
2. **Given** any non-admin merchant or unauthenticated user, **When** they attempt to load `/platform-admin`, **Then** the system immediately denies access with an HTTP 403 Forbidden screen or redirects to login without revealing admin metrics.

---

### User Story 2 - Merchant Store Directory & Status Control (Priority: P1)

As a Super Admin, I want to browse and search the complete list of all stores on the platform, inspect their owners, view their live subdomains, and suspend or reactivate stores with a single click.

**Why this priority**: Mandatory operational control. If a merchant breaches terms of service or requests temporary hold, the platform owner must be able to suspend the storefront instantly.

**Independent Test**: Can be tested by searching for a merchant slug in the directory, clicking "إيقاف المتجر" (Suspend), and verifying that visitors to that merchant's subdomain now receive an Arabic suspension notice ("هذا المتجر متوقف مؤقتاً").

**Acceptance Scenarios**:

1. **Given** the Super Admin directory view, **When** the admin enters a store name, slug, or owner email in the search bar, **Then** matching stores are filtered and displayed in real-time.
2. **Given** an active store, **When** the Super Admin clicks "تعليق / إيقاف مؤقت", **Then** the store status updates to `suspended`, public catalog requests display an Arabic temporary suspension page, and the merchant is notified inside their dashboard.
3. **Given** a suspended store, **When** the Super Admin clicks "إعادة التفعيل", **Then** the store status reverts to `active` and public catalog browsing is immediately restored.

---

### User Story 3 - Manual Subscription & Quota Management (Priority: P1)

As a Super Admin, when a merchant transfers a subscription fee via InstaPay or Vodafone Cash and sends proof on WhatsApp, I want to open their store profile in the admin panel and manually upgrade their plan (e.g. from `free` to `pro`) and increase their product/category quotas without requiring automated payment gateways.

**Why this priority**: The core monetization engine during the initial launch phase. Bridges the gap between offline payments and SaaS quota enforcement.

**Independent Test**: Can be tested by selecting a merchant on the Free plan (100 products limit), editing their subscription to Pro with a 500 products limit, and verifying that the merchant can now add more than 100 products in their dashboard.

**Acceptance Scenarios**:

1. **Given** a merchant on the Free tier, **When** the Super Admin opens "إدارة الباقة والاشتراك" (Manage Subscription), selects `pro`, and enters `max_products = 500` and `max_categories = 30`, **Then** the business record is updated and the new limits take effect immediately.
2. **Given** an upgraded merchant, **When** they log into their dashboard, **Then** their billing widget shows "باقة برو Pro" and their quota gauge reflects `0 / 500 منتج`.
3. **Given** a subscription with a set expiration date, **When** the date passes, **Then** the Super Admin dashboard highlights the expired account for review or automated quota reset.

---

### User Story 4 - Reserved Subdomain Namespace Governance (Priority: P2)

As a Super Admin, I want to view and manage the list of reserved subdomains so that no merchant can claim critical system names (e.g., `admin`, `api`, `billing`, `support`, `digitalmenu`, `suez`).

**Why this priority**: Safeguards platform routing and prevents spoofing or impersonation.

**Independent Test**: Can be tested by adding `vip-menu` to the reserved list in the Super Admin panel and verifying that merchant registration rejects `vip-menu` as an unavailable slug.

**Acceptance Scenarios**:

1. **Given** the Super Admin reserved slugs view, **When** the admin adds a new reserved slug with a reason, **Then** the database reserved registry table is updated immediately.
2. **Given** an existing merchant already using a slug, **When** that slug is reserved, **Then** system prevents newly registering merchants from taking it while flagging existing usage for administrative resolution.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated route layout (`/platform-admin`) accessible exclusively to verified Platform Super Administrators.
- **FR-002**: System MUST display platform-wide aggregate KPIs on the admin home: total registered merchants, total active businesses, total suspended businesses, total products across all stores, and total platform-wide QR scans.
- **FR-003**: System MUST provide a paginated, searchable, and filterable directory of all platform businesses showing: Store Name, Slug, Owner Email, Created Date, Current Plan, Product Count, and Operational Status.
- **FR-004**: System MUST allow the Super Admin to toggle a business's operational status between `active`, `suspended`, and `maintenance`.
- **FR-005**: System MUST immediately reflect status changes in edge routing: requests to a `suspended` store subdomain MUST return an Arabic suspension landing page rather than the catalog.
- **FR-006**: System MUST provide an interface for the Super Admin to manually edit any business's subscription parameters:
  - `plan_code` (e.g. `free`, `pro`, `enterprise`)
  - `max_products` (custom numeric limit)
  - `max_categories` (custom numeric limit)
  - `subscription_expires_at` (optional expiration timestamp)
  - `admin_notes` (internal record of payment reference, e.g. "تم السداد إنستاباي رقم عملية 482910")
- **FR-007**: System MUST provide a direct "معاينة المتجر" (View Storefront) action that launches the live public merchant subdomain in a new tab.
- **FR-008**: System MUST provide a direct "دخول المتجر" (Impersonate / Manage Store) capability allowing the Super Admin to inspect and assist with a merchant's catalog.
- **FR-009**: System MUST enforce strict server-side authorization: any API call or page request to `/platform-admin` without a verified `is_super_admin` claim or record MUST fail with HTTP 403 Forbidden.
- **FR-010**: System MUST maintain an audit trail for critical admin interventions (who suspended a store, who modified a plan, timestamp).
- **FR-011**: System MUST provide a management interface for the `reserved_slugs` table to view, add, or delete protected subdomain names.
- **FR-012**: All Super Admin UI components, typography, tables, and actions MUST support Arabic RTL layout with optional English toggle for technical data.

---

### Key Entities

- **PlatformAdminUser**: A user identity authorized to perform platform-wide operations. Identified via `platform_admins` table or custom auth claims.
- **BusinessAdminView**: An enriched representation of the `businesses` entity including: aggregate product counts, category counts, member list, plan status, and payment notes.
- **AdminAuditLog**: Record of administrative actions. Attributes: `admin_id`, `target_business_id`, `action_type` (`suspend`, `activate`, `plan_change`, `quota_override`), `previous_value`, `new_value`, `reason`, and `created_at`.
- **ReservedSlugItem**: Attributes: `slug`, `reason`, `reserved_at`, `created_by`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Super Admin can locate any merchant by name, slug, or email in under 3 seconds using the directory search.
- **SC-002**: Store status change (suspension / reactivation) takes effect globally across Cloudflare edge workers in under 5 seconds.
- **SC-003**: Plan and quota modifications take effect immediately upon save, allowing the merchant to add products up to their new quota without delay.
- **SC-004**: 100% of non-super-admin attempts to access `/platform-admin` are blocked with zero leakage of store metrics or merchant emails.
- **SC-005**: Offline payment turnaround: Super Admin can complete an offline manual upgrade in under 30 seconds from receiving payment confirmation.

---

## Database & Security Impact

### Database DDL Requirements (Controlled Migration)
1. **`platform_admins` Table**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `role TEXT NOT NULL DEFAULT 'super_admin'`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
2. **`businesses` Table Additions**:
   - `status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'maintenance'))`
   - `subscription_expires_at TIMESTAMPTZ`
   - `admin_notes TEXT`
3. **RLS Policies**:
   - Platform admins bypass tenant isolation for administrative operations via a security definer helper function `is_platform_admin()`.
   - Regular merchants can NEVER read or write `platform_admins` or `admin_notes`.
