# Feature Specification: Entitlements and Usage Limits

**Feature ID**: `LMT-001`  
**Status**: Boundary Draft — partial implementation exists  
**Release**: MVP  
**Source integration**: 001 core MVP

## Purpose and Business Value

Keep the free-tier offer predictable for merchants and sustainable for the platform.

## Scope and Boundaries

In scope:
- Product, category, image-count, and business-storage limits with atomic database enforcement.
- Merchant-facing plan & quota gauges (`0/100 products`, `0/15 categories`).
- Plans & Billing UI: Displaying available subscription tiers (Free, Pro), accepted payment methods in Egypt (InstaPay, Vodafone Cash & mobile wallets, Bank Transfer, and automated card gateways marked as "Coming Soon"), with a direct manual upgrade request flow via WhatsApp/support.
- Integration with `ADM-001` (Super Admin) for manual activation of upgrades upon payment confirmation.

## Actors and Permissions

- Merchant: views current plan, monitors resource gauges, and initiates upgrade requests.
- Platform Super Admin: modifies plan codes and updates quota allocations via ADM-001.

## User Stories

1. **User Story 1 - Plan & Quota Visibility**: As a merchant in my dashboard, I can clearly view my current active plan ("الباقة المجانية الأساسية") and live usage gauges (e.g. `12 / 100 منتج`, `3 / 15 قسم`) so I know how much capacity remains.
2. **User Story 2 - Subscription Upgrade & Payment Methods Display**: As a merchant approaching my limits, I can open the "الباقات والترقية" (Plans & Upgrades) page, review higher tier benefits (Pro Plan: 500 products), see accepted payment methods (إنستاباي InstaPay, فودافون كاش Vodafone Cash, تحويل بنكي, فيزا/ماستركارد قريباً), and click "طلب الترقية عبر واتساب" to submit my payment proof for instant manual activation.
3. **User Story 3 - Atomic Quota Enforcement**: As the platform, I reject concurrent or sequential product and category creations that would exceed the merchant's allotted quota with a friendly Arabic explanation prompting them to upgrade.

## Functional Requirements

- **FR-001**: System MUST assign every new merchant the permanent Free Plan (`plan_code = 'free'`) with default limits of 100 master products, 15 categories, and 3 images per product.
- **FR-002**: System MUST display a dedicated "الباقة والاستهلاك" (Plan & Quota) widget on the merchant dashboard showing current plan name and progress bars for products and categories.
- **FR-003**: System MUST provide a "الباقات والاشتراكات" (Plans & Billing) screen in the merchant dashboard displaying:
  - Free Tier details and current active status.
  - Pro Tier details (expanded capacity up to 500 products, priority support).
  - Accepted payment methods section displaying:
    - **InstaPay (إنستاباي)**: Username / Phone / QR code.
    - **Vodafone Cash & Mobile Wallets (فودافون كاش ومحافظ المحمول)**: Wallet number.
    - **Bank Transfer (تحويل بنكي)**: Bank name, Account Name, IBAN.
    - **Online Card Gateway (فيزا وماستركارد)**: Labeled with a "قريباً الدفع التلقائي" (Coming Soon) badge.
  - Action button: "إرسال إيصال الدفع وتأكيد الترقية عبر واتساب" directing to platform administration WhatsApp.
- **FR-004**: System MUST enforce product and category quotas atomically at the database level, preventing the creation of records exceeding the merchant's assigned `max_products` or `max_categories`.
- **FR-005**: When a merchant hits their limit, system MUST gracefully disable the creation action and display a polite Arabic alert with a direct link to the upgrade page.

## Business and Validation Rules

- Limits are enforced at the authoritative data boundary, not only in forms.
- A rejected limit operation must not create a partial record.

## Errors and Edge Cases

- Concurrent submissions cannot bypass product limits.
- The current source contains a 200KB upload guard while the product baseline targets under 100KB; this difference must be resolved before planning.

## Acceptance Criteria

- The 101st active product cannot be created for a free-plan business.
- A merchant receives a clear explanation of the applicable limit.

## Dependencies and Out of Scope

Depends on BIZ-001, CAT-001, PRD-001, and MED-001. Billing is out of scope.

## Existing Implementation References

The core schema contract contains an atomic product quota trigger; relevant business fields and media code are present.

## Database and Security Impact

Quota enforcement may use tenant-owned business limits. Schema changes require a separately approved migration plan.
