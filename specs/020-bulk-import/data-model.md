# Data Model: Bulk Catalog & Menu Import (IMP-001)

## 1. Domain Entities & Schemas

### `ImportProductRow`
```typescript
export interface ImportProductRow {
  categoryNameAr: string;
  categoryNameEn?: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  price: number;
  isAvailable?: boolean;
  imageUrl?: string;
}
```

### `ImportRowValidationError`
```typescript
export interface ImportRowValidationError {
  rowNumber: number;
  field?: string;
  message: string;
}
```

### `ImportPreviewResult`
```typescript
export interface ImportPreviewResult {
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  categoriesToCreate: string[];
  errors: ImportRowValidationError[];
  canProceed: boolean;
  quotaWarning?: string;
}
```

### `ImportExecutionResult`
```typescript
export interface ImportExecutionResult {
  categoriesCreated: number;
  productsCreated: number;
  failedCount: number;
  durationMs: number;
}
```
