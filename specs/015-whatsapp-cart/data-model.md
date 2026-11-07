# Data Model: WhatsApp Cart & Multi-Item Ordering (COM-001)

## 1. Domain Entities & Client-Side DTOs

### `CartItemOption`
Selected modifier or option value within an option group:
```typescript
export interface CartItemOption {
  groupId: string;
  groupName: string;
  valueId: string;
  optionName: string;
  priceDelta: number;
}
```

### `CartItem`
An individual product or variant line item in the customer's cart:
```typescript
export interface CartItem {
  id: string; // Deterministic cart key: `${productId}_${variantId || 'base'}_${optionsHash}`
  productId: string;
  productName: string; // Arabic name
  coverImageUrl?: string | null;
  unitPrice: number; // Current verified price (base + variant + option deltas)
  quantity: number;
  lineTotal: number; // unitPrice * quantity
  variantId?: string;
  variantName?: string;
  selectedOptions?: CartItemOption[];
  itemNote?: string;
  isAvailable?: boolean; // Re-validated against active catalog; false disables order dispatch
  priceChanged?: boolean; // True if price was auto-synced from active catalog during session
}
```

### `CustomerCart`
The complete local basket state persisted in `localStorage` under `digital_menu_cart_{storeSlug}`:
```typescript
export interface CustomerCart {
  storeSlug: string;
  storeName: string;
  storePhone: string | null;
  currency: string;
  items: CartItem[];
  customerName?: string;
  fulfillmentNotes?: string; // Table number, delivery address, or general requests
  totalAmount: number;
  totalQuantity: number;
  updatedAt: string; // ISO timestamp used for 24-hour expiration evaluation
  orderSubmitted?: boolean; // Set to true upon clicking "Send Order via WhatsApp"
  submittedAt?: string; // Timestamp of last WhatsApp order handoff
}
```

### `MultiItemOrderSubmission`
Payload compiled for the structured WhatsApp message:
```typescript
export interface MultiItemOrderSubmission {
  storeName: string;
  storePhone: string;
  items: CartItem[];
  customerName?: string;
  fulfillmentNotes?: string;
  totalAmount: number;
  currency: string;
  catalogUrl: string;
}
```

---

## 2. Validation Rules & Constraints

1. **Storage Partitioning**: Key MUST follow `digital_menu_cart_{storeSlug}` (case-insensitive, trimmed).
2. **24-Hour Expiration**: If `Date.now() - new Date(updatedAt).getTime() > 86,400,000`, the cart is cleared on initialization.
3. **Out-of-Stock Guard**: If any item has `isAvailable === false`, the WhatsApp submission button is disabled with an explanatory Arabic warning ("يحتوي الطلب على أصناف غير متوفرة حالياً").
4. **Zero Forced Fields**: `customerName` and `fulfillmentNotes` are strictly optional strings with no minimum length requirement.
5. **Arithmetic Accuracy**: `lineTotal = unitPrice * quantity`; `totalAmount = sum(lineTotal)`. Floating point calculations must be rounded cleanly (`Math.round(total * 100) / 100`).
