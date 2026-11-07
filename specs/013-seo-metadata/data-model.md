# Data Model: SEO and Metadata (SEO-001)

## 1. Meta Tag & Structured Data Shapes

```typescript
export interface MetaTagItem {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
}

export interface SchemaOrgMenuItem {
  '@type': 'MenuItem';
  name: string;
  description?: string;
  image?: string;
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability: string;
  };
}

export interface SchemaOrgRestaurant {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  url: string;
  telephone?: string;
  image?: string;
  hasMenu: {
    '@type': 'Menu';
    name: string;
    hasMenuItem: SchemaOrgMenuItem[];
  };
}

export interface SchemaOrgStore {
  '@context': 'https://schema.org';
  '@type': 'Store';
  name: string;
  url: string;
  telephone?: string;
  image?: string;
  makesOffer: Array<{
    '@type': 'Offer';
    itemOffered: {
      '@type': 'Product';
      name: string;
      description?: string;
      image?: string;
    };
    price: number;
    priceCurrency: string;
    availability: string;
  }>;
}
```

