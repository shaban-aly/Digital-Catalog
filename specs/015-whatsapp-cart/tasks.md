# Tasks: WhatsApp Cart & Multi-Item Ordering (COM-001)

**Input**: Design documents from `specs/015-whatsapp-cart/` (`spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/cart-contracts.ts`, `quickstart.md`)

**Prerequisites**: `plan.md` (ratified), `spec.md` (clarifications incorporated), `data-model.md`, `research.md`, `contracts/cart-contracts.ts`

**Tests**: Automated unit tests are included in `tests/unit/whatsapp-cart.test.ts` per Gate 10 of the implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation, testing, and delivery of each story.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3], [US4])
- Clear, actionable file paths included in every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align shared schemas, domain types, and contract exports across client and server boundaries.

- [x] T001 [P] Align shared Zod 4 schemas in `src/shared/schemas.ts` and `specs/015-whatsapp-cart/contracts/cart-contracts.ts` adding `CustomerCartSchema` with `updatedAt: z.string()` and updating `CartItemSchema` with optional `isAvailable: z.boolean().optional()` and `priceChanged: z.boolean().optional()`.
- [x] T002 [P] Align TypeScript domain interfaces in `src/shared/types.ts` for `CartItem`, `CustomerCart`, and `MultiItemOrderSubmission`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and hook infrastructure that MUST be complete before user story UI implementation.

**⚠️ CRITICAL**: Foundational tasks must complete before user story phase execution.

- [x] T003 [P] Implement Egyptian phone normalization (`01...` -> `201...`) and multi-item Arabic receipt formatting in `src/public-catalog/utils/whatsapp-cart-formatter.ts`.
- [x] T004 Implement 24-hour expiration TTL logic and deterministic key partitioning `digital_menu_cart_{storeSlug}` in `src/public-catalog/hooks/use-cart.ts`.

**Checkpoint**: Foundation ready - user story implementation can now proceed.

---

## Phase 3: User Story 1 - Multi-Item Cart & Floating Cart Bar (Priority: P1) 🎯 MVP

**Goal**: Enable browsing customers to select multiple dishes/products, adjust quantities, view a persistent floating bar with item count and subtotal, and inspect itemized lines in the slide-over drawer.

**Independent Test**: Open any store catalog, add 3 distinct items with options, verify floating bar displays `3 items` and calculated total in real-time, open cart drawer and verify each line item shows correct quantity, unit price, and subtotal.

### Tests for User Story 1
- [x] T005 [P] [US1] Create unit tests for cart line item arithmetic, variant options hashing, and deterministic item ID generation in `tests/unit/whatsapp-cart.test.ts`.

### Implementation for User Story 1
- [x] T006 [US1] Enhance `CartDrawer` in `src/public-catalog/components/CartDrawer.tsx` to render itemized dish list, variant names, modifier options, unit prices, line totals, and quantity increment/decrement controls.
- [x] T007 [US1] Enhance `FloatingCartBar` in `src/public-catalog/components/FloatingCartBar.tsx` with animated item counter, currency-formatted total amount, and tap-to-open drawer trigger.
- [x] T008 [US1] Wire `onAddToCart` in `src/public-catalog/components/ItemDetailDrawer.tsx` and integrate cart state into the public catalog route in `src/routes/_public/c/$catalogSlug.tsx`.

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Order Details & Formatted WhatsApp Submission (Priority: P1)

**Goal**: Customer can optionally enter name/notes, review items, validate against out-of-stock items, launch WhatsApp with a structured Arabic receipt, and see a post-submission status banner with a one-tap clear button.

**Independent Test**: Add items to cart, click "Send Order via WhatsApp", verify WhatsApp opens with the merchant's phone number and structured Arabic receipt, confirm cart remains intact with confirmation banner "تم فتح الطلب في واتساب بنجاح", and test one-tap clear button resets the cart.

### Tests for User Story 2
- [x] T009 [P] [US2] Create unit tests for WhatsApp Arabic receipt compilation, zero forced fields handling, and Egyptian phone number normalization in `tests/unit/whatsapp-cart.test.ts`.

### Implementation for User Story 2
- [x] T010 [US2] Implement post-submission state flags (`orderSubmitted`, `submittedAt`) and one-tap clear action in `src/public-catalog/hooks/use-cart.ts`.
- [x] T011 [US2] Implement post-submission status banner ("تم فتح الطلب في واتساب بنجاح") with a one-tap "إفراغ السلة" button in `src/public-catalog/components/CartDrawer.tsx` and `src/public-catalog/components/FloatingCartBar.tsx`.
- [x] T012 [US2] Implement active catalog price auto-synchronization and out-of-stock guard in `src/public-catalog/hooks/use-cart.ts` and `src/public-catalog/components/CartDrawer.tsx` (disable WhatsApp submission if `isAvailable === false`, display "تم تحديث السعر" badge on changed prices).

**Checkpoint**: User Stories 1 AND 2 work together seamlessly with safe order dispatch.

---

## Phase 5: User Story 3 - Cart Management & Persistence across Sessions (Priority: P2)

**Goal**: Customer cart items, quantities, and notes persist locally across route navigation and browser reloads, and automatically expire after 24 hours of inactivity.

**Independent Test**: Add items to cart, refresh browser or close tab, verify cart state is restored with 100% fidelity; verify that a cart older than 24 hours is automatically cleared upon the next visit.

### Tests for User Story 3
- [x] T013 [P] [US3] Create unit tests for 24-hour inactivity TTL expiration, hydration recovery, and item deletion in `tests/unit/whatsapp-cart.test.ts`.

### Implementation for User Story 3
- [x] T014 [US3] Implement "Clear Cart" (إفراغ السلة) confirmation prompt and empty basket state illustration in `src/public-catalog/components/CartDrawer.tsx`.

**Checkpoint**: Cart state survives reloads safely and cleanly purges after 24 hours of inactivity.

---

## Phase 6: User Story 4 - Strict Multi-Tenant Store Isolation (Priority: P2)

**Goal**: Guarantee 100% store isolation in localStorage so visiting Store B on the same browser starts with an empty cart and never mixes items with Store A.

**Independent Test**: Add items in Store A, navigate to Store B, verify Store B cart is empty, add items in Store B, return to Store A, and verify Store A items remain intact without cross-store contamination.

### Tests for User Story 4
- [x] T015 [P] [US4] Create unit tests verifying storage key tenant partitioning (`digital_menu_cart_{storeSlug}`) and store isolation in `tests/unit/whatsapp-cart.test.ts`.

### Implementation for User Story 4
- [x] T016 [US4] Implement store slug normalization (lowercase, trim) and multi-tenant partitioning in `src/public-catalog/hooks/use-cart.ts`.

**Checkpoint**: Multi-tenant boundaries are strictly enforced with zero cross-store leakage.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, strict compilation, and documentation finalization.

- [x] T017 [P] Execute full test suite via `node --test tests/unit/whatsapp-cart.test.ts` and ensure 100% pass rate.
- [x] T018 Execute strict TypeScript compilation check via `npx tsc --noEmit` ensuring zero type errors.
- [x] T019 Run `quickstart.md` validation scenarios proving end-to-end cart flow.
- [x] T020 Update `docs/specifications/feature-registry.md` confirming `COM-001` completion with all ratified clarifications.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - blocks all user stories.
- **User Story 1 (Phase 3 - P1)**: Depends on Phase 2 completion. Deliverable as standalone MVP.
- **User Story 2 (Phase 4 - P1)**: Depends on Phase 3 completion (requires cart items to format receipt).
- **User Story 3 (Phase 5 - P2)**: Depends on Phase 2 & 3 completion.
- **User Story 4 (Phase 6 - P2)**: Depends on Phase 2 completion.
- **Polish (Phase 7)**: Depends on all user story phases being complete.

### User Story Dependencies
```
Phase 1: Setup ──► Phase 2: Foundational
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  Phase 3: US1 (MVP)              Phase 6: US4 (Isolation)
         │                               │
         ▼                               ▼
  Phase 4: US2 (WhatsApp Dispatch)       │
         │                               │
         ▼                               ▼
  Phase 5: US3 (24h TTL & Persistence)   │
         │                               │
         └───────────────┬───────────────┘
                         ▼
                  Phase 7: Polish
```

---

## Parallel Opportunities

- **Phase 1**: `T001` and `T002` can execute in parallel.
- **Phase 2**: `T003` can execute in parallel with schema work.
- **Phase 3**: `T005` (unit tests) can execute in parallel with UI drafting.
- **Phase 4**: `T009` (unit tests) can execute in parallel with banner styling.
- **Phase 5 & 6**: Can execute in parallel once Phase 3 is completed.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: Multi-Item Cart & Floating Cart Bar).
3. **STOP and VALIDATE**: Verify items can be added, quantities adjusted, and subtotal displayed accurately.

### Incremental Delivery
1. Add User Story 2: Enable WhatsApp submission, out-of-stock guard, and post-submission banner.
2. Add User Story 3: Enable 24-hour expiration TTL and clear-cart confirmation.
3. Add User Story 4: Verify multi-tenant partition key isolation.
4. Run Phase 7 polish and automated test verification.
