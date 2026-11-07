# Feature Specification: Audit Logs & Governance History (AUD-001)

**Feature Branch**: `018-audit-logs`

**Feature ID**: `AUD-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: MVP Core / Extension

**Input**: User directive: "توفير سجل تدقيق ورقابة (Audit Log) يسجل العمليات الحساسة في المتجر والمنصة (تغيير الأدوار، تعليق المتجر، تعديل الباقات، نشر وإلغاء نشر القوائم) لضمان المساءلة والأمان دون أي تكلفة إضافية."

---

## Purpose and Business Value

Provide merchants and platform administrators with an immutable, tamper-evident **Audit Log (`/dashboard/audit-logs`)** that records sensitive administrative, authorization, and lifecycle operations (role assignments, store status toggles, quota/subscription modifications, and catalog publication changes), ensuring complete operational accountability, tenant security, and regulatory compliance under a Free-First ($0 budget) architecture.

---

## Scope and Boundaries

- **In Scope**:
  - Immutable append-only audit trail for sensitive administrative events:
    - `tenant_role_changed`: Assigning, promoting, or demoting a team member.
    - `tenant_member_removed`: Revoking team member access.
    - `store_status_changed`: Suspending, reactivating, or archiving a store.
    - `subscription_tier_updated`: Manual plan upgrade or quota expansion.
    - `catalog_lifecycle_changed`: Publishing or unpublishing a menu catalog.
    - `business_profile_updated`: Altering critical store information or WhatsApp contact.
  - Audit log querying with tenant isolation (`WHERE business_id = :businessId`), pagination, and action filtering.
  - Arabic RTL localized descriptions for each recorded action.
  - Strict role-based access: only merchant `owner` and `admin` roles (or platform `super_admin`) can inspect audit records.
- **Out of Scope (Deferred to Future Releases)**:
  - Ephemeral public customer view events (handled by privacy-safe analytics `ANL-001`).
  - SIEM / Splunk / Datadog external enterprise forwarding pipelines.
  - Cryptographic blockchain proof notarization.

---

## Actors and Permissions

- **Merchant Owner / Admin**: Can view the chronological audit history for their own store.
- **Merchant Editor / Viewer**: Forbidden from inspecting governance audit trails (HTTP 403).
- **Platform Super Admin**: Can view audit records across tenants for compliance verification.
- **Public Customer**: Strictly denied access.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reviewing Store Administrative Audit Trail (Priority: P1)

As a merchant store owner, I want to review an immutable chronological list of all sensitive operations performed on my store so that I know exactly who changed a team member's role or published a menu.

**Why this priority**: Core security and operational transparency. Prevents unauthorized or untracked changes.

**Independent Test**: Can be tested by performing a role update and catalog publish, then loading the audit log query and verifying both events are listed with correct actor ID, action name in Arabic, and timestamp.

**Acceptance Scenarios**:

1. **Given** an authenticated store Owner, **When** they navigate to `/dashboard/audit-logs`, **Then** the system displays the paginated list of recent actions with actor identity, Arabic action label, timestamp, and metadata diff.
2. **Given** a user with role `editor` or `viewer`, **When** they attempt to query the audit log, **Then** the request is rejected with a 403 Forbidden error.

---

### User Story 2 - Immutable Recording of Sensitive Mutations (Priority: P1)

As the system, when a sensitive mutation occurs (e.g., plan upgrade or store suspension), I want an audit record to be automatically created without failing or blocking the primary operation if logging encounters an issue.

**Why this priority**: Guarantees audit integrity without compromising primary transaction reliability.

**Independent Test**: Can be tested by calling `recordAuditEvent` and verifying the record is written with valid UUID and immutable timestamp.

**Acceptance Scenarios**:

1. **Given** a plan upgrade executed by Super Admin, **When** the upgrade succeeds, **Then** an audit entry with action `subscription_tier_updated` is appended with old and new quota values.
2. **Given** any attempt to update or delete an existing audit log row, **When** the query executes, **Then** the operation is rejected (append-only principle).

---

## Technical Constraints & Design Principles

1. **Free-First ($0 Budget)**: Stored in Supabase PostgreSQL without requiring paid logging services.
2. **Arabic RTL First**: Action descriptions, target labels, and filter dropdowns are natively in Arabic.
3. **Multi-Tenant Isolation**: Strict enforcement of `business_id` scoping.
4. **Append-Only Immutability**: Audit logs cannot be modified or deleted.
