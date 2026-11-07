# Feature Specification: External Custom Domains (DOM-002)

**Feature Branch**: `021-external-custom-domains`

**Feature ID**: `DOM-002`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: Pro Tier / Premium Publishing

**Input**: User directive: "إتاحة ربط النطاقات الخاصة الخارجية (Custom Domains مثل menu.albaraka.com) للمتاجر المشتركة في باقة برو، مع التحقق من ملكية النطاق عبر سجلات DNS TXT/CNAME وحماية المنصة من الاستيلاء غير المصرح به على النطاقات."

---

## Purpose and Business Value

Allow premium merchants on the **Pro Tier** to bind their own custom domains (e.g., `menu.albaraka.com` or `albaraka-suez.com`) to their digital menu catalog while maintaining strict **DNS RFC 1123 format validation**, tokenized DNS ownership verification, tenant isolation, and $0 platform infrastructure costs.

---

## Scope and Boundaries

- **In Scope**:
  - Custom domain registration for tenant stores:
    - Hostname format validation (RFC 1123, lowercase, alphanumeric and hyphens, valid TLD).
    - Pro tier entitlement enforcement (Free tier merchants cannot bind custom domains).
    - Rejection of platform domains or subdomains (`*.daleel-al-suez.com`, `*.digitalmenu.*`).
  - DNS ownership verification workflow:
    - Generates unique TXT challenge token: `_digitalmenu-challenge.{domain}` = `dm_verify_<32-char-token>`.
    - Verification state lifecycle: `pending_verification`, `active`, `verification_failed`, `deactivated`.
  - Hostname resolution:
    - Resolves custom hostnames to `business_id` and catalog slug at the edge worker / middleware layer.
  - Custom domain lifecycle management:
    - List custom domains, trigger DNS verification check, and remove/deactivate domain.
  - Arabic RTL localized setup instructions and DNS copy-paste guides.
- **Out of Scope (Deferred to Future Releases)**:
  - Automated Cloudflare for SaaS Enterprise Custom Hostname API provisioning (deferred until merchant volume warrants Cloudflare Enterprise plan).

---

## Actors and Permissions

- **Pro Merchant Owner / Admin**: Can configure and verify external custom domains for their store.
- **Free Merchant**: Barred with upgrade prompt to Pro tier.
- **Platform Super Admin**: Can view and unlink custom domains across tenants.
- **Public Customer**: Can access the merchant's menu through their verified custom domain.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registering a Custom Domain with DNS Verification Challenge (Priority: P1)

As a Pro restaurant owner, I want to enter my domain `menu.albaraka.com` in my dashboard so I receive DNS TXT/CNAME instructions to link it to my digital catalog.

**Why this priority**: Major branding incentive for Pro merchants in Suez who own custom web domains.

**Independent Test**: Can be tested by registering a custom domain on a Pro tier account, receiving the verification token, simulating DNS record resolution, and verifying the domain status transitions to `active`.

**Acceptance Scenarios**:

1. **Given** a Pro merchant, **When** they add `menu.albaraka.com`, **Then** a domain record is created in `pending_verification` state with a unique verification token and Arabic DNS instructions.
2. **Given** a Free tier merchant, **When** they attempt to add a custom domain, **Then** the request is rejected with message: "ميزة النطاقات الخاصة متاحة حصرياً لمشتركي باقة برو Pro".
3. **Given** an invalid domain name (e.g. `invalid/path` or `http://domain.com`), **When** submitted, **Then** validation rejects with an Arabic format error.

---

### User Story 2 - Resolving Custom Hostname to Storefront (Priority: P1)

As a customer who visits `https://menu.albaraka.com`, I want the system to recognize the custom hostname and route me directly to Al-Baraka's catalog seamlessly.

**Why this priority**: Core routing requirement for custom domains.

**Independent Test**: Can be tested by calling `resolveCustomDomain('menu.albaraka.com')` and verifying it returns the business ID, slug, and active status.

**Acceptance Scenarios**:

1. **Given** an active verified custom domain, **When** `resolveCustomDomain` is invoked, **Then** it returns `{ status: 'active', businessId, businessSlug }`.
2. **Given** an unverified or deactivated custom domain, **When** resolved, **Then** it returns `{ status: 'unverified' }` or `{ status: 'not_found' }`.

---

## Technical Constraints & Design Principles

1. **Free-First ($0 Budget)**: Operates without paid domain routing add-ons.
2. **Tier Gating**: Strict enforcement of Pro tier quota entitlement.
3. **Arabic RTL First**: DNS setup guides, record types (TXT, CNAME), and status badges are rendered in Arabic RTL.
4. **Zod 4 Compliance**: Strict hostname and UUID schema validation.
