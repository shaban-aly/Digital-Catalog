# Technical Research: WhatsApp Cart & Multi-Item Ordering (COM-001)

## 1. Zero-Friction E-Commerce Model (Option C: Streamlined Cart)

Traditional multi-step checkout processes (requiring customer registration, password setup, mandatory address forms, and payment gateways) produce severe drop-off rates (>70%) for local dining and takeaway ordering in Egypt.
In Suez, merchants and customers prefer direct WhatsApp communication where order details (table number, pickup time, delivery landmarks, or Instapay transfer screenshots) are finalized in chat.

### The Streamlined Architecture:
- **Zero Account Creation**: The customer adds items directly without signing in or registering.
- **Client-Side Partitioned Persistence**: The basket is saved in `localStorage` under `digital_menu_cart_{businessSlug}`. Switching stores guarantees 100% tenant isolation with zero database writes.
- **Zero Server Database Overhead**: Free-first architecture ($0 monthly infrastructure cost). Zero cart sessions or pending checkout rows in PostgreSQL.
- **Single-Click WhatsApp Handoff**: The cart compiles a structured Arabic receipt text with itemized quantities, options, line totals, optional notes, and store URL into a universal `https://wa.me/{phone}?text={encoded}` link.

---

## 2. Ratified Architectural Decisions (Clarifications Session 2026-11-06)

### Decision 1: Post-Submission Cart Retention & One-Tap Reset
- **Decision**: Retain cart items in `localStorage` upon clicking "Send Order via WhatsApp", show a non-intrusive status banner ("تم فتح الطلب في واتساب بنجاح"), and provide a prominent one-tap "Clear Cart" (إفراغ السلة) button on the banner.
- **Rationale**: Immediate cart clearance risks catastrophic data loss if the mobile device fails to open WhatsApp, lacks network connection, or if the customer wants to verify what they just sent. Retaining with a clear reset action gives users full control.
- **Alternatives Considered**:
  - *Auto-clear immediately*: Rejected because it leads to lost baskets if WhatsApp fails to open or crashes.
  - *Silent retention*: Rejected because it causes duplicate orders and user confusion about whether the order was initiated.

### Decision 2: 24-Hour Inactivity Expiration TTL
- **Decision**: Embed an `updatedAt` ISO timestamp in the cart payload. If `Date.now() - new Date(updatedAt).getTime() > 24 * 60 * 60 * 1000`, the cart is automatically discarded on next visit.
- **Rationale**: Restaurant menus and daily specials change frequently. A 24-hour window accommodates browsing across morning and evening on the same day while guaranteeing that stale items from weeks ago do not linger indefinitely.
- **Alternatives Considered**:
  - *Indefinite retention*: Rejected due to stale catalog data and obsolete pricing.
  - *Session-only (cleared on tab close)*: Rejected because mobile users routinely reload tabs or switch apps.

### Decision 3: Active Catalog Price Synchronization & Out-of-Stock Guard
- **Decision**: When the cart drawer opens, compare cart items with active catalog items. If an item's catalog price changed, update the cart line item price and display a "تم تحديث السعر" indicator. If an item is out of stock (`is_available === false`), flag it with an alert and disable the WhatsApp submission button until the out-of-stock item is removed.
- **Rationale**: Prevents pricing discrepancies and disputes between customer and merchant in WhatsApp chat. Hard-blocks ordering of items that the kitchen cannot fulfill.
- **Alternatives Considered**:
  - *Locking old prices*: Rejected because merchants cannot honor obsolete prices.
  - *Silent automatic deletion*: Rejected because silent removal without customer awareness causes frustration.

---

## 3. Multi-Item WhatsApp Text Payload Formatting

The compiled Arabic message follows a clean, receipt-style hierarchy:
```text
مرحباً {storeName}،
أود تأكيد طلب جديد من خلال الكتالوج الإلكتروني:

👤 *اسم العميل:* {customerName}
📝 *ملاحظات الطلب:* {fulfillmentNotes}

🛒 *الأصناف المطلوبة:*
1. *{name}* {if variant: ({variant})}
   - الكمية: {quantity} × {unitPrice} {currency} = {lineTotal} {currency}
   {if options: - الخيارات: {options}}
   {if note: - ملاحظة: {note}}

💰 *الإجمالي النهائي:* {totalAmount} {currency}
🔗 *رابط المتجر:* {catalogUrl}

يرجى تأكيد استلام الطلب وتكلفة التوصيل وموعد التجهيز. شكراً لك!
```

---

## 4. URL Length Safety & Phone Normalization

- **URL Limits**: WhatsApp handles encoded URLs up to ~4,000 characters across mobile and desktop apps. With concise line-item formatting, an order of 30+ items uses <1,200 characters, remaining well within safe limits.
- **Egyptian Phone Normalization**:
  - `01xxxxxxxxx` $\rightarrow$ `201xxxxxxxxx`
  - `+20 1x xxx xxxx` $\rightarrow$ `201xxxxxxxxx`
  - `00201xxxxxxxxx` $\rightarrow$ `201xxxxxxxxx`
