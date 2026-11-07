# Architecture & Implementation Plan: Bulk Catalog & Menu Import (IMP-001)

## 1. Executive Summary
Feature `IMP-001` provides a zero-dependency, high-speed menu import system. Operating under Free-First ($0 budget) parameters, it parses CSV text or JSON payloads, validates dishes line by line, deduplicates categories, and blocks imports that exceed merchant quota tiers.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Native UTF-8 Arabic parsing, Arabic field requirements, and detailed Arabic row error alerts.
- [x] **Gate 2: Zero Infrastructure Cost**: Custom lightweight native CSV parser without adding heavy third-party npm libraries.
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax and RFC 4122-compliant UUID rules.
- [x] **Gate 4: Strict Multi-Tenant Scoping**: All category lookups and product creations are locked to `business_id`.
- [x] **Gate 5: Upfront Quota Defense**: Compares `currentProducts + importRows` against `max_products`; rejects immediately before inserting if limit would be breached.
- [x] **Gate 6: Category Deduplication**: Case-insensitive and whitespace-trimmed Arabic category name matching prevents duplicate categories.
- [x] **Gate 7: Bounded Batching**: Enforces maximum of 500 rows per import batch to protect serverless worker CPU limits.
- [x] **Gate 8: Role Authorization**: Requires minimum `editor` role; `viewer` is rejected with HTTP 403.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `ImportProductRow`, preview statistics, and execution outcomes.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - Add import schemas to `src/shared/schemas.ts`:
     - `ImportProductRowSchema`, `ImportCatalogBatchSchema`, `ParseCsvInputSchema`.
   - Add import types to `src/shared/types.ts`.
2. **Bulk Import Service (`src/server/services/bulk-import.ts`)**:
   - `parseCsvString(csvText: string): ImportProductRow[]`
   - `previewImport(businessId: string, rows: ImportProductRow[]): Promise<ImportPreviewResult>`
   - `importBatch(businessId: string, rows: ImportProductRow[], userRole?: string): Promise<ImportExecutionResult>`
3. **Automated Unit Testing (`tests/unit/bulk-import.test.ts`)**:
   - CSV text parsing tests (standard, quoted commas, Arabic headers).
   - Row validation schema tests (missing Arabic name, negative price, string length bounds).
   - Quota limit blocking when import count exceeds tier limit.
   - Category mapping and auto-creation.
   - Role permission guard tests.
4. **Execution & Verification**:
   - Run `node --test tests/unit/bulk-import.test.ts`.
   - Run all test suites `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.
