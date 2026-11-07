# Implementation Plan: WhatsApp Cart & Multi-Item Ordering (COM-001)

**Branch**: `015-whatsapp-cart` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-whatsapp-cart/spec.md` with ratified clarifications from session 2026-11-06.

## Summary

Feature `COM-001` provides a zero-friction, multi-item shopping cart tailored for Suez dining and commerce, operating with a Free-First architecture (zero PostgreSQL sessions or cart rows, 100% tenant-partitioned client-side storage). Customers can add dishes/products with variants and options, review items in a slide-over drawer, optionally provide delivery/table notes with zero forced form fields, and dispatch a structured Arabic receipt to WhatsApp in one tap.

This plan integrates three ratified clarifications:
1. **Post-Submission Cart Retention**: Preserves cart items upon launching WhatsApp as a safety guard against accidental app launch failure, displaying a confirmation banner with an instant one-tap "Clear Cart" button.
2. **24-Hour Expiration TTL**: Automatically expires and clears stale baskets 24 hours after the customer's last interaction to prevent ordering obsolete items.
3. **Active Price Sync & Out-of-Stock Guard**: Automatically updates cart item prices to match active catalog prices with an informational notice, while disabling WhatsApp order dispatch if any item in the basket is out of stock until removed.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19, Node 24
**Primary Dependencies**: TanStack Router, TanStack Start, Zod 4, Tailwind CSS, Lucide React
**Storage**: Client-Side `localStorage` with tenant partition key `digital_menu_cart_{storeSlug}` ($0 infrastructure cost)
**Testing**: Node 24 native test runner (`node --test tests/unit/whatsapp-cart.test.ts`), `npx tsc --noEmit`
**Target Platform**: Cloudflare Workers edge runtime (SSR) & Modern mobile/desktop browsers (Client)
**Project Type**: Web application (Public Catalog commerce component)
**Performance Goals**: Cart interactions <50ms UI response time; WhatsApp message generation <10ms; zero DB queries
**Constraints**: Zero server-side session cookies or database writes; Arabic RTL-first UI; Egyptian phone normalization (`01...` -> `201...`)
**Scale/Scope**: Up to 40 items per order safely encoded in standard `https://wa.me/...` URL; unlimited client baskets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Status | Rationale & Evidence |
|---|:---:|---|
| **I. Spec-Driven & Plan-First** | **PASS** | Scoped strictly to `COM-001` with approved `spec.md` and ratified clarifications. |
| **II. Free-First & Zero-Cost** | **PASS** | $0 monthly cost: 100% client storage, 0 PostgreSQL storage/egress, 0 server connections. |
| **III. Multi-Tenant Security** | **PASS** | Strict subdomain storage isolation via `digital_menu_cart_{storeSlug}`. Zero cross-store leakage. |
| **IV. Mobile-First Edge UX** | **PASS** | Mobile-first drawer ergonomic layout, sub-50ms reactive feedback, lightweight bundle impact. |
| **V. Hierarchical Pricing** | **PASS** | Respects base price + variant delta + option delta hierarchy; auto-syncs with active catalog. |
| **VI. Privacy-Safe Analytics** | **PASS** | No customer PII (names, notes, phone numbers) persisted on server or database. |
| **VII. Impeccable Design & RTL** | **PASS** | Native Arabic RTL typography, badge styling, status banners, and WhatsApp receipts. |
| **VIII. Database Governance** | **PASS** | Zero schema DDL modifications; no database tables created or altered. |
| **IX. Agent Governance** | **PASS** | Explicit file targets and strict task boundaries. |
| **X. Modular Decomposition** | **PASS** | Registered in `docs/specifications/feature-registry.md` as discrete capability `COM-001`. |

## Project Structure

### Documentation (this feature)

```text
specs/015-whatsapp-cart/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── cart-contracts.ts
├── checklists/
│   └── requirements.md  # 16/16 Quality Checklist passed
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── public-catalog/
│   ├── components/
│   │   ├── CartDrawer.tsx               # Slide-over cart review drawer, quantity controls, out-of-stock badges
│   │   ├── FloatingCartBar.tsx          # Persistent bottom bar with count, total, and post-order banner
│   │   └── ItemDetailDrawer.tsx         # Item options selection with onAddToCart trigger
│   ├── hooks/
│   │   └── use-cart.ts                  # Cart state management, 24h TTL, localStorage persistence
│   └── utils/
│       ├── whatsapp-cart-formatter.ts   # Arabic receipt generator & Egyptian phone normalization
│       └── whatsapp-formatter.ts        # Single-item legacy formatter (retained for backward compatibility)
├── shared/
│   ├── schemas.ts                       # Zod 4 schemas (CartItemSchema, MultiItemOrderSubmissionSchema)
│   └── types.ts                         # TypeScript domain contracts
tests/
└── unit/
    └── whatsapp-cart.test.ts            # Node 24 native unit tests for cart schemas, formatter, and math
```

## Architectural Design & Workflows

### 1. Storage & Expiration Workflow (24-Hour TTL)
```
Customer opens store catalog
  │
  ▼
Read localStorage (`digital_menu_cart_{storeSlug}`)
  │
  ├─► [No record] ────────► Initialize empty cart
  │
  └─► [Found record]
        │
        ├─► [Date.now() - updatedAt > 24 Hours] ──► Clear stale data ──► Initialize empty cart
        │
        └─► [Within 24 Hours] ──────────────────► Load cart items & notes
```

### 2. Price Re-validation & Out-of-Stock Guard Workflow
```
Cart Drawer Opened / Catalog Items Loaded
  │
  ▼
Compare each CartItem against active catalog items:
  │
  ├─► Item is out of stock (is_available === false)
  │     └─► Highlight item with alert badge ("غير متوفر حالياً")
  │     └─► Disable "إرسال الطلب عبر واتساب" button
  │
  └─► Item price has changed
        └─► Update CartItem unitPrice to active catalog price
        └─► Recalculate lineTotal & cart totalAmount
        └─► Display informational badge ("تم تحديث السعر")
```

### 3. Submission & Post-Order Lifecycle Workflow
```
Customer taps "إرسال الطلب عبر واتساب"
  │
  ▼
Validate: items > 0 AND zero out-of-stock items
  │
  ▼
Generate structured Arabic WhatsApp URL (wa.me)
  │
  ▼
Open WhatsApp URL (`window.open(url, '_blank')`)
  │
  ▼
Preserve cart items in localStorage (safety guard)
  │
  ▼
Display confirmation banner in cart & floating bar:
  "تم فتح الطلب في واتساب بنجاح" + [إفراغ السلة الآن] (One-tap clear button)
```

## Complexity Tracking

*No constitutional violations. Zero extra complexity.*
