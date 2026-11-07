# Data Model: Public Catalog Experience (PUB-001)

## 1. Core Public DTOs & Hydration Shape

### `PublicCatalogPayload`
The consolidated SSR data model fetched in a single query:

```typescript
export interface PublicCatalogPayload {
  business: {
    id: string;
    name: string;
    slug: string;
    currency_code: string;
    phone_number: string | null;
    logo_url: string | null;
    cover_url: string | null;
    industry_type: string;
  };
  catalog: {
    id: string;
    slug: string;
    theme_config: Record<string, any>;
  };
  categories: PublicCategory[];
  products: PublicProduct[];
}
```

### `PublicCategory`
```typescript
export interface PublicCategory {
  id: string;
  name: LocalizedString; // { ar: string; en?: string }
  sort_order: number;
  product_count: number;
}
```

### `PublicProduct`
```typescript
export interface PublicProduct {
  id: string;
  name: LocalizedString;
  description: LocalizedString | null;
  effective_price: number;
  compare_at_price: number | null;
  unit: string | null;
  is_available: boolean;
  is_featured: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  category_id: string;
  attributes: Record<string, any>;
  variants: ProductVariant[];
  option_groups: ProductOptionGroup[];
}
```

### `WhatsAppOrderDetails`
```typescript
export interface WhatsAppOrderDetails {
  storeName: string;
  storePhone: string;
  productName: string;
  variantName?: string;
  selectedOptions?: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
  totalPrice: number;
  currency: string;
  catalogUrl: string;
}
```

