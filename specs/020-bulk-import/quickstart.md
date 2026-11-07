# Quickstart Guide: Bulk Catalog & Menu Import (IMP-001)

## 1. Overview
The Bulk Catalog Import engine allows merchants to rapidly import menu categories and products from CSV text or JSON arrays, with automatic category deduplication, strict quota verification, and native Arabic error reporting.

---

## 2. Usage Examples

### Importing from CSV
```typescript
import { BulkImportService } from '@/server/services/bulk-import';

const importService = new BulkImportService();
const businessId = '123e4567-e89b-12d3-a456-426614174000';

const csvData = `category_name_ar,name_ar,price,description_ar
برجر,برجر دبل بيكون,120,لحم بقري مشوي مع صوص خاص
مشروبات,عصير مانجو فريش,35,عصير طازج طبيعي
`;

// 1. Parse and Preview CSV
const preview = await importService.previewCsv(businessId, csvData);
console.log(preview);
// { totalRows: 2, validRowCount: 2, invalidRowCount: 0, categoriesToCreate: ['برجر', 'مشروبات'], canProceed: true }

// 2. Execute Batch Import
if (preview.canProceed) {
  const result = await importService.importBatch(businessId, preview.rows);
  console.log(result);
  // { categoriesCreated: 2, productsCreated: 2, failedCount: 0, durationMs: 85 }
}
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/bulk-import.test.ts
```
