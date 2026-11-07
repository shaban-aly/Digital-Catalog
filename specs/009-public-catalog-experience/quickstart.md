# Quickstart Guide: Public Catalog Experience (PUB-001)

## 1. Overview
The Public Catalog Experience delivers a mobile-first digital storefront for Suez merchants. Visitors access the catalog without logging in, browse categories, customize product options in a slide-up drawer, and generate structured WhatsApp orders.

---

## 2. Usage Examples

### Hydrating Public Catalog on Server
```typescript
import { publicCatalogService } from '@/server/services/public-catalog';

const catalogPayload = await publicCatalogService.getCatalogBySlug('al-baraka-market');
if (!catalogPayload) {
  // Not found or unpublished
}
```

### Generating WhatsApp Order Link
```typescript
import { buildWhatsAppOrderUrl } from '@/public-catalog/utils/whatsapp-formatter';

const orderUrl = buildWhatsAppOrderUrl({
  storeName: 'مطعم البركة',
  storePhone: '+20 10 1234 5678',
  productName: 'برجر كلاسيك دبل',
  variantName: 'حجم كبير',
  selectedOptions: [
    { groupName: 'إضافات الجبن', optionName: 'جبنة شيدر إضافية', priceDelta: 15 },
    { groupName: 'الصلصات', optionName: 'صلصة باربيكيو مدخنة', priceDelta: 5 },
  ],
  totalPrice: 125,
  currency: 'EGP',
  catalogUrl: 'https://al-baraka.digitalmenu.daleel-al-suez.com',
});

// Returns: https://wa.me/201012345678?text=...
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/public-catalog.test.ts
```

