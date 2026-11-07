# Data Model: Privacy-Safe Analytics (ANL-001)

## 1. Schema Entities & Tables

### `qr_scan_events` Table (Ephemeral Telemetry)
Persists anonymous event logs without storing raw IP:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Event ID |
| `qr_code_id` | `uuid` | `NOT NULL, REFERENCES qr_codes(id) ON DELETE CASCADE` | Associated QR code |
| `fingerprint_hash` | `text` | `NOT NULL` | Daily salted SHA-256 hash |
| `is_bot` | `boolean` | `NOT NULL, DEFAULT false` | Bot/crawler classification flag |
| `referrer` | `text` | `NULLABLE` | HTTP Referer header if present |
| `scanned_at` | `timestamptz` | `NOT NULL, DEFAULT now()` | Scan timestamp |

---

## 2. TypeScript Types

```typescript
export interface AnalyticsSummary {
  totalScans: number;
  totalViews: number;
  totalWhatsAppClicks: number;
  uniqueVisitorsEstimate: number;
}

export interface LogQrScanEventParams {
  qrCodeId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string | null;
}
```

