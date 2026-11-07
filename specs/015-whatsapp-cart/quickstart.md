# Quickstart Guide: WhatsApp Cart & Multi-Item Ordering (COM-001)

## 1. Overview
The WhatsApp Cart enables customers to build a multi-item order of dishes, variants, and modifiers, review their basket in a slide-over drawer, optionally provide their name or notes, and dispatch a structured Arabic receipt to the merchant's WhatsApp in one click.

---

## 2. Usage Examples

### 1. Using the Cart Hook (Client Side)
```typescript
import { useCart } from '@/public-catalog/hooks/use-cart';

// Automatically handles 24-hour expiration and store partitioning
const cart = useCart('al-baraka');

// Add item to cart
cart.addItem({
  productId: '123e4567-e89b-12d3-a456-426614174000',
  productName: 'برجر دبل بيكون',
  unitPrice: 120,
  quantity: 2,
  variantName: 'حجم كبير',
});

// Update quantity
cart.updateQuantity(cart.items[0].id, 3);
```

### 2. Price Synchronization & Out-of-Stock Guard
```typescript
// Synchronize cart with latest catalog data
// - Updates unit prices with "تم تحديث السعر" indicator
// - Flags items where is_available === false
const hasOutOfStockItems = cart.items.some((item) => item.isAvailable === false);

// The WhatsApp submission button is disabled while hasOutOfStockItems is true
```

### 3. Compiling Multi-Item WhatsApp Link & Post-Submission Banner
```typescript
import { buildMultiItemWhatsAppOrderUrl } from '@/public-catalog/utils/whatsapp-cart-formatter';

const url = buildMultiItemWhatsAppOrderUrl({
  storeName: 'مطعم البركة بالسويس',
  storePhone: '01012345678',
  items: cart.items,
  customerName: 'أحمد محمود',
  fulfillmentNotes: 'طاولة رقم 4',
  totalAmount: cart.totalAmount,
  currency: 'EGP',
  catalogUrl: 'https://al-baraka.digitalmenu.daleel-al-suez.com/',
});

// 1. Opens WhatsApp with formatted Arabic receipt
window.open(url, '_blank');

// 2. Marks order submitted (displays confirmation banner with one-tap clear button)
cart.setOrderSubmitted(true);
```

---

## 3. Running Unit Tests
```bash
# Test WhatsApp cart schemas, Arabic receipt formatter, and Egyptian phone normalization
node --test tests/unit/whatsapp-cart.test.ts

# Run all unit tests
node --test tests/unit/*.test.ts

# Verify strict TypeScript compilation
npx tsc --noEmit
```
