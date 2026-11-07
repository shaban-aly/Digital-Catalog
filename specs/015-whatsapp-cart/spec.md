# Feature Specification: WhatsApp Cart & Multi-Item Ordering

**Feature Branch**: `003-whatsapp-cart`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "003-whatsapp-cart"

## Clarifications

### Session 2026-11-06

- Q: ماذا يجب أن يحدث لمحتويات سلة العميل فور الضغط على زر "إرسال الطلب عبر واتساب"؟ → A: الإبقاء على عناصر السلة كإجراء أمان، وإظهار شريط تأكيد نجاح ("تم فتح الطلب في واتساب") مع زر مباشر بضغطة واحدة لإفراغ السلة (Option A).
- Q: كم تبلغ المدة الزمنية لصلاحية السلة المحفوظة محلياً (Cart Expiration / TTL) قبل اعتبارها منتهية وإفراغها تلقائياً؟ → A: انتهاء الصلاحية تلقائياً بعد 24 ساعة من آخر تفاعل مع السلة (Option A).
- Q: كيف يجب أن تتعامل السلة عندما يتغير سعر صنف أو يصبح غير متوفر (Out of Stock) أثناء وجوده في سلة العميل المحفوظة؟ → A: تحديث الأسعار تلقائياً إلى السعر الحالي مع إظهار شارة توضيحية ("تم تحديث السعر")، ووضع علامة على الأصناف التي نفدت مع تعطيل زر إرسال الطلب حتى يحذف العميل الصنف غير المتوفر (Option A).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Item Cart & Floating Cart Bar (Priority: P1)

A customer browsing a store's digital catalog on their mobile phone or desktop wants to select multiple dishes or products, adjust quantities, and see a persistent order summary as they navigate through categories, rather than being forced to order one single item at a time.

**Why this priority**: Core revenue driver for merchants. Single-item WhatsApp ordering has high friction and limits basket size. A multi-item cart allows customers to build an entire order (appetizers, mains, drinks) in one cohesive interaction.

**Independent Test**: Can be fully tested by opening a store catalog, adding 3 different items to the cart, verifying the floating bar shows `3 items` and the correct calculated total, opening the cart drawer, and verifying all 3 items appear with their unit prices and subtotal.

**Acceptance Scenarios**:

1. **Given** a customer is browsing any catalog category, **When** they tap "Add to Cart" on an item, **Then** the item is added to the cart and a persistent floating bar displays the updated total count and price in real-time.
2. **Given** an item has options or variants, **When** the customer opens the item detail, selects their preferences, and taps "Add to Cart", **Then** the cart records the item with its selected options and adjusted price.
3. **Given** an item is already in the cart, **When** the customer adds it again or taps the plus button, **Then** the quantity increases by 1 and the total order amount updates immediately.

---

### User Story 2 - Order Details & Formatted WhatsApp Submission (Priority: P1)

A customer with items in their cart is ready to order. They open the cart drawer, review their items, optionally enter their name or any fulfillment notes (such as table number, branch pickup, or delivery address), and tap "Send Order via WhatsApp". The system immediately opens WhatsApp with a pre-filled, beautifully formatted Arabic message addressed to the store's verified business number without blocking or forcing mandatory form fields.

**Why this priority**: Completes the end-to-end commerce loop. Without automated formatting and direct WhatsApp handoff, the cart cannot convert visitors into paying orders. Zero forced fields ensures the fastest possible conversion.

**Independent Test**: Can be fully tested by adding items to the cart, clicking "Send Order via WhatsApp" with or without entering notes/name, and confirming that WhatsApp opens with the merchant's phone number and a structured Arabic text payload detailing all items, options, quantities, prices, total, and any entered notes.

**Acceptance Scenarios**:

1. **Given** a non-empty cart, **When** the customer taps the floating cart bar, **Then** an order drawer/modal opens showing the itemized bill, subtotals, optional note/name fields, and order button.
2. **Given** the customer enters optional notes (such as table number, delivery address, or pickup time), **When** they tap "Send Order via WhatsApp", **Then** WhatsApp opens with the notes clearly included in the message header/details.
3. **Given** the customer leaves optional fields blank, **When** they tap "Send Order via WhatsApp", **Then** the order launches into WhatsApp immediately without blocking, validation errors, or friction.
4. **Given** the merchant has a configured WhatsApp number, **When** the customer submits, **Then** the message targets that exact international phone number without requiring manual number entry.
5. **Given** the customer taps "Send Order via WhatsApp", **When** WhatsApp is launched, **Then** the cart items remain preserved in local storage, a non-intrusive status banner confirms "تم فتح الطلب في واتساب", and a one-tap "Clear Cart" button is available on the banner to reset the basket.

---

### User Story 3 - Cart Management & Persistence across Sessions (Priority: P2)

A customer browsing a large catalog switches between categories, closes the browser tab, or refreshes the page. Their cart items, quantities, and entered details remain intact without requiring account creation or login. The customer can also decrease quantities, remove items, or clear the entire cart at any time.

**Why this priority**: Prevents cart abandonment caused by accidental page reloads or tab closures, providing a smooth e-commerce experience on mobile networks.

**Independent Test**: Can be tested by adding items, refreshing the browser or closing and reopening the page on the same device/browser, and verifying that cart contents are completely restored.

**Acceptance Scenarios**:

1. **Given** an active cart with multiple items, **When** the customer refreshes the webpage or navigates between routes, **Then** all cart items, quantities, and order type selections are preserved.
2. **Given** an item in the cart drawer, **When** the customer taps the minus button until quantity reaches zero or taps the trash icon, **Then** the item is removed and the total recalculates.
3. **Given** an empty cart, **When** the cart drawer is opened, **Then** a friendly empty state is displayed prompting the customer to explore the menu.
4. **Given** a saved cart in local storage, **When** 24 hours elapse without user activity, **Then** the cart state is cleanly expired and reset upon the next visit to avoid stale menu items or pricing.

---

### User Story 4 - Strict Multi-Tenant Store Isolation (Priority: P2)

A customer browses Store A (`shaban.digitalmenu.daleel-al-suez.com`) and adds items to their cart. Later, the same customer visits Store B (`cafe-corner.digitalmenu.daleel-al-suez.com`). The cart for Store B must start completely empty and never display or mix items, prices, or merchant contacts from Store A.

**Why this priority**: Mandatory data boundary and tenant isolation principle. Cross-store data leakage would corrupt customer orders and destroy merchant trust.

**Independent Test**: Can be tested by adding items in Store A, navigating to Store B, verifying Store B's cart is empty, adding different items in Store B, returning to Store A, and confirming Store A's original items remain intact.

**Acceptance Scenarios**:

1. **Given** items added to the cart under Store A's subdomain, **When** the customer visits Store B's subdomain on the same browser, **Then** Store B displays an empty cart.
2. **Given** items exist in carts for both Store A and Store B, **When** the customer returns to Store A, **Then** only Store A's items are visible, calculated in Store A's currency.

---

### Edge Cases

- **Zero or Invalid WhatsApp Number**: What happens if the store merchant has not configured a WhatsApp phone number? The system must disable the WhatsApp order button with a clear, polite Arabic explanation (e.g. "خدمة الطلب عبر واتساب غير مفعلة لهذا المتجر حالياً") and allow calling the direct phone number if available.
- **Cart Exceeding URL Character Limits**: What happens if a customer orders 40+ distinct items and the WhatsApp web/app URL exceeds typical query string limits? The message formatter must produce a concise, compact format that guarantees URL length safety across all platforms.
- **Price or Availability Changes**: What happens if an item is marked unavailable or its price changes while it rests in a saved cart? When opening or viewing the cart, the system re-validates items against active catalog data: item prices are automatically refreshed to current prices with a clear "تم تحديث السعر" indicator, while any out-of-stock items are prominently flagged with an alert and the WhatsApp submission button is disabled until the out-of-stock item is removed.
- **No WhatsApp Installed**: What happens when a desktop or mobile browser has no native WhatsApp app? The link must use standard universal WhatsApp web/app links (`https://wa.me/...`) so it transparently opens WhatsApp Web or prompts app installation.
- **Special Characters and Emojis**: What happens if a customer enters emojis, quotes, or newlines in order notes? All user inputs must be safely encoded without breaking the message structure or URL encoding.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Add to Cart" action on every available menu item card and within the item detail view.
- **FR-002**: System MUST display a non-intrusive floating cart bar or badge whenever the cart contains at least one item, indicating the current total item count and currency-formatted subtotal.
- **FR-003**: System MUST open a slide-over cart drawer or modal upon tapping the floating bar, displaying the itemized list of selected items, item quantities, individual prices, and the total order sum.
- **FR-004**: System MUST allow customers to increment quantity (+), decrement quantity (-), or delete items directly from the cart drawer with instantaneous recalculation.
- **FR-005**: System MUST support a streamlined, single generic order format where fulfillment details (such as table number, branch pickup, or delivery address) can be provided as flexible, optional order notes without requiring rigid multi-step fulfillment classification.
- **FR-006**: System MUST adopt a zero-forced-fields policy: customer name, contact details, and fulfillment notes are completely optional, allowing one-click submission to WhatsApp where any additional details can be communicated directly within the chat.
- **FR-007**: System MUST allow customers to enter optional general order notes or special requests (e.g., "بدون شطة", "الصوص خارجي").
- **FR-008**: System MUST format an elegant, readable Arabic text receipt for WhatsApp including:
  - Store Name header
  - Customer Name & Notes (if provided)
  - Numbered list of items with quantities and line totals
  - Item options / notes (if selected)
  - Total order amount with store currency
  - Order reference timestamp
- **FR-009**: System MUST construct a standard international WhatsApp link targeting the merchant's designated WhatsApp number with the encoded order text.
- **FR-010**: System MUST persist the customer's cart state locally within the user's browser, strictly partitioned by store identifier, and enforce an automatic expiration TTL of 24 hours from the customer's last interaction so that switching stores never mixes cart items and stale carts are cleared.
- **FR-011**: System MUST operate completely without server-side user sessions, database cart writes, or mandatory customer registration (Free-First Architecture).
- **FR-012**: System MUST handle out-of-stock items gracefully by disabling the "Add to Cart" action and displaying an "Out of Stock" (غير متوفر) status badge; if an item in the cart becomes unavailable upon review, the system MUST prominently flag it and disable the WhatsApp submission button until removed.
- **FR-013**: System MUST NOT hard-block order submission based on a minimum order threshold, ensuring a zero-friction checkout experience while optionally displaying a non-blocking informational note if configured.
- **FR-014**: System MUST provide a "Clear Cart" (إفراغ السلة) action with a confirmation prompt to prevent accidental data loss, as well as a direct one-tap clear action accessible on post-order confirmation.
- **FR-015**: All cart UI elements, typography, numbers, and currency formatting MUST strictly adhere to Arabic Right-to-Left (RTL) design standards.
- **FR-016**: System MUST retain the customer's cart items upon tapping "Send Order via WhatsApp" and display a post-submission status banner confirming the order handoff, preventing accidental data loss if WhatsApp fails to launch.
- **FR-017**: System MUST automatically synchronize saved cart item prices with current active catalog pricing upon cart review, displaying an informative price-update badge ("تم تحديث السعر") on affected items without blocking checkout.

---

### Key Entities

- **Cart**: Represents the customer's active basket for a single store. Holds a list of Cart Items, selected fulfillment details, general notes, last updated timestamp, and 24-hour expiration metadata.
- **CartItem**: Represents an individual product line in the basket. Attributes include: product identifier, product name (Arabic), unit price, quantity, chosen variants/options, line total, and optional item-specific note.
- **OrderFulfillmentDetails**: Represents customer-provided ordering context. Attributes include: optional customer name, optional instructions (e.g. table number, pickup notes, or delivery address), and timestamp.
- **StoreOrderMessage**: The generated plaintext Arabic message payload compiled from the Cart and OrderFulfillmentDetails, optimized for instant reading and confirmation by merchant staff in WhatsApp.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can assemble a multi-item order (3+ items) and launch WhatsApp in under 45 seconds from their first interaction.
- **SC-002**: 100% of generated WhatsApp messages accurately match the exact cart items, selected options, quantities, and calculated total without math discrepancies.
- **SC-003**: Cart operations (adding item, increasing quantity, opening drawer) provide immediate visual feedback with sub-50ms UI response time.
- **SC-004**: Cart state survives page reloads and browser tab closures with 100% fidelity within a 24-hour active window on the same device.
- **SC-005**: Zero database queries or writes are generated for cart interactions, maintaining 100% compliance with free-tier resource budgets.
- **SC-006**: Zero cross-tenant data leakage: 100% of visits across distinct store subdomains exhibit complete cart isolation.

---

## Assumptions

- **Store WhatsApp Configuration**: Each merchant has an active WhatsApp account associated with their business profile. If missing, the cart clearly explains the limitation to the customer.
- **Client-Side Persistence**: Cart contents are stored locally on the customer's device browser storage, bounded to the specific store origin.
- **No In-App Payment Gateway in MVP**: Payment processing occurs directly between merchant and customer via cash on delivery, in-store payment, or merchant-provided Instapay/Vodafone Cash details agreed upon in the WhatsApp chat.
- **Order Confirmation via WhatsApp**: The final legal agreement and order acceptance happen natively within WhatsApp chat between merchant and customer; the catalog does not claim to be a closed POS/ERP system.
- **Universal Link Compatibility**: The standard `https://wa.me/<phone>?text=<encoded_text>` protocol functions seamlessly across iOS, Android, macOS, and Windows.

