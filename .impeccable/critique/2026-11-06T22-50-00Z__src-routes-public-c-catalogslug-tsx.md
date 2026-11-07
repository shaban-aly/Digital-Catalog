# Critique: src/routes/_public/c/$catalogSlug.tsx

**Date:** 2026-11-06T22:50:00Z  
**Target:** `src/routes/_public/c/$catalogSlug.tsx`  
**Score:** 27 / 40 (Baseline Before Hardening & Polish)  

---

## Synthesis of Assessments A & B

### Key Strengths
1. **Egyptian Market Tailoring**: Phone normalization (`010/011/012/015` -> `201...`), Egyptian Pound currency defaults, and itemized restaurant receipt style for WhatsApp messaging.
2. **Persistent Floating Cart**: Ergonomic mobile thumb-zone positioning, immediate total calculation, and post-order submission reference.
3. **Clean Visual Foundation**: Calm surfaces conforming to `DESIGN.md`, no loud gradients, Cairo typography hierarchy.

### Critical Deficiencies
1. **Accessibility (WCAG AA) Failures**:
   - `ProductCard.tsx` is an inaccessible `div` with `onClick`, lacking `role="button"`, `tabIndex`, `onKeyDown`, and focus rings.
   - Sub-44px touch targets in `CartDrawer` (`w-7 h-7` = 28px for `+`, `-`, and trash), `CategoryPills` (`min-h-[38px]`), and close buttons.
   - Missing focus traps and `Escape` key handling in both drawers (`ItemDetailDrawer` and `CartDrawer`).
   - Category pills lack `role="tablist"` / `role="tab"` and `aria-selected`.
2. **Business Logic & Validation Gaps**:
   - Required modifiers (`is_required`) in `ItemDetailDrawer` are not enforced, allowing incomplete orders to be placed.
   - Visual ambiguity between single-choice (Radio) and multi-choice (Checkbox) modifiers.
   - Lack of Table Number (`?table=`) query parameter detection and auto-injection.
   - Dual actions ("طلب فوري" vs "إضافة إلى السلة") confusing the ordering journey.
3. **Design System & Token Violations**:
   - Green color sacredness violated: "معاينة السلة" styled with `variant="whatsapp"` instead of `primary`.
   - Arbitrary Tailwind colors (`emerald-*`, `rose-*`, `red-*`, `amber-*`, `slate-*`) across drawers instead of design tokens.
   - Off-scale font sizes (`text-[9px]`, `text-[10px]`).
   - Ghost token `var(--primary-teal)` in `$shortCode.tsx`.
   - Lingering "مجاناً" in public footer.
4. **Missing States**:
   - Bare empty state for filtered categories with no button to reset filter.
   - No search filter for large menus (50+ items).
   - Missing `onError` fallback on all images.

---

## Action Plan for Hardening, Adapting, and Polishing
1. **Harden `ProductCard.tsx`**: Turn into a fully accessible interactive element with `role="button"`, `tabIndex={0}`, keyboard support (`Enter` / `Space`), `focus-visible:ring-2`, and `dir="ltr"` price formatting.
2. **Harden `ItemDetailDrawer.tsx`**:
   - Enforce required modifiers (`is_required`) with clear visual feedback before enabling "إضافة إلى السلة".
   - Differentiate visually between single-choice Radio indicators and multi-choice Checkbox indicators.
   - Add accessible dialog attributes, `Escape` key dismissal, and backdrop blur.
   - Prioritize "إضافة إلى السلة" as the full-width primary action.
3. **Harden `CartDrawer.tsx`**:
   - Enlarge all touch targets to $\ge 44\text{px}$ (`min-h-[44px]`).
   - Replace arbitrary Tailwind classes with CSS variables (`var(--primary)`, `var(--accent-promo)`, `var(--badge-avail)`).
   - Add focus trap, `Escape` key listener, and accessible labels to form inputs.
4. **Harden `CategoryPills.tsx`**:
   - Upgrade touch targets to `min-h-[44px]`.
   - Add semantic `role="tablist"` and `role="tab"` with `aria-selected`.
   - Fix typography tokens to valid design system sizes.
5. **Upgrade `$catalogSlug.tsx`**:
   - Add instant live search filter for products.
   - Capture `?table=` query parameter and pass it to cart fulfillment notes.
   - Replace empty category state with an illustrated card and "عرض كل الأصناف" action button.
   - Fix lingering "مجاناً" in footer.
6. **Fix Ghost Token in `src/routes/_public/q/$shortCode.tsx`**:
   - Replace `var(--primary-teal)` with `var(--primary)`.

