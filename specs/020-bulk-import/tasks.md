# Tasks: Bulk Catalog & Menu Import (IMP-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align import schemas in `specs/020-bulk-import/contracts/import-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align import domain types in `src/shared/types.ts`.

## Phase 2: Core Bulk Import Service Implementation
- [x] **TASK-003**: Implement `BulkImportService` in `src/server/services/bulk-import.ts`:
  - `parseCsvString(csvText: string): ImportProductRow[]`
  - `previewImport(businessId: string, rows: ImportProductRow[]): Promise<ImportPreviewResult>`
  - `importBatch(businessId: string, rows: ImportProductRow[], userRole?: string): Promise<ImportExecutionResult>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/bulk-import.test.ts` covering:
  - Native CSV string parsing (Arabic text, commas, newlines).
  - Row validation schema rules (category name, product name, price non-negativity).
  - Pre-flight quota check and quota rejection.
  - Category mapping and auto-creation.
  - Role-based authorization guard (editor/admin pass, viewer rejected).
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `IMP-001` as `Implemented & Verified`.
