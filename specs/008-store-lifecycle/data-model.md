# Data Model: Store and Catalog Lifecycle (LIF-001)

## 1. Schema Entities & Tables

### `businesses` Table (Tenant Root)
Existing schema altered by migration `20261106160000_tenant_status_and_dns_constraints.sql`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | Unique tenant ID |
| `name` | `text` | `NOT NULL` | Business display name |
| `slug` | `text` | `NOT NULL, UNIQUE (LOWER(slug))` | Subdomain DNS identifier |
| `status` | `business_status` | `NOT NULL, DEFAULT 'active'` | Operational status: `'active' \| 'suspended' \| 'archived'` |
| `plan_code` | `text` | `NOT NULL, DEFAULT 'free'` | Subscription tier |
| `created_at` | `timestamptz` | `NOT NULL, DEFAULT now()` | Registration timestamp |
| `updated_at` | `timestamptz` | `NOT NULL, DEFAULT now()` | Last update timestamp |

### `catalogs` Table (Store Catalog)
Primary catalog for the merchant:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | Catalog unique ID |
| `business_id` | `uuid` | `NOT NULL, REFERENCES businesses(id)` | Owning tenant ID |
| `name` | `text` | `NOT NULL` | Catalog name |
| `slug` | `text` | `NOT NULL` | URL catalog slug |
| `is_published` | `boolean` | `NOT NULL, DEFAULT true` | Public visibility flag |
| `theme_config` | `jsonb` | `NOT NULL, DEFAULT '{}'::jsonb` | Presentation theme overrides |
| `created_at` | `timestamptz` | `NOT NULL, DEFAULT now()` | Creation timestamp |

---

## 2. TypeScript Domain Types

```typescript
export type BusinessStatus = 'active' | 'suspended' | 'archived';

export type StoreLifecycleResolution =
  | {
      status: 'active';
      businessId: string;
      businessName: string;
      businessSlug: string;
      catalogId: string;
      isPublished: true;
    }
  | {
      status: 'unpublished';
      businessId: string;
      businessName: string;
      businessSlug: string;
      catalogId: string;
      isPublished: false;
    }
  | {
      status: 'suspended';
      businessId: string;
      businessName: string;
      businessSlug: string;
      reason?: string;
    }
  | {
      status: 'archived';
      businessId: string;
      businessName: string;
      businessSlug: string;
    }
  | {
      status: 'not_found';
      slug: string;
    }
  | {
      status: 'reserved';
      slug: string;
    };
```

