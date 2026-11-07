# Data Model: QR Code Management (QR-001)

## 1. Schema Entities & Tables

### `qr_codes` Table
Persists the permanent physical link record:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique QR identifier |
| `business_id` | `uuid` | `NOT NULL, REFERENCES businesses(id) ON DELETE CASCADE` | Owning tenant ID |
| `catalog_id` | `uuid` | `NOT NULL, REFERENCES catalogs(id) ON DELETE CASCADE` | Target catalog ID |
| `short_code` | `text` | `NOT NULL, UNIQUE` | 6-char Base32 short code |
| `is_active` | `boolean` | `NOT NULL, DEFAULT true` | Active scanning state |
| `total_scans` | `bigint` | `NOT NULL, DEFAULT 0` | Aggregate scan counter |
| `created_at` | `timestamptz` | `NOT NULL, DEFAULT now()` | Generation timestamp |

---

## 2. TypeScript Types

```typescript
export interface QRCodeRecord {
  id: string;
  business_id: string;
  catalog_id: string;
  short_code: string;
  is_active: boolean;
  total_scans: number;
  created_at: string;
  redirect_url: string;
}

export interface QRDestinationResult {
  destinationUrl: string;
  qrId: string;
}

export interface CreateQRCodeParams {
  businessId: string;
  catalogId?: string;
}
```

