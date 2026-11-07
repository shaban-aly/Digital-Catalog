# Feature Specification: Bulk Catalog & Menu Import (IMP-001)

**Feature Branch**: `020-bulk-import`

**Feature ID**: `IMP-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: MVP Core / Extension

**Input**: User directive: "توفير ميزة الاستيراد الجماعي للمنتجات والتصنيفات (Bulk Import) من ملفات CSV أو JSON لتسهيل إعداد قائمة المتجر للمطاعم والمقاهي في السويس دون الحاجة لإدخال مئات الأصناف يدوياً، مع الالتزام الصارم بحدود الباقة وحصص المتجر."

---

## Purpose and Business Value

Accelerate merchant onboarding by enabling store owners and administrators to import their complete menu (categories, dishes, descriptions, prices, availability) from structured CSV text or JSON payloads in seconds, while strictly enforcing **quota limits (`LMT-001`)**, tenant authorization (`TEN-001`), and **Arabic RTL** data fidelity under a **Free-First ($0 budget)** architecture.

---

## Scope and Boundaries

- **In Scope**:
  - Structured catalog import from CSV string or JSON array:
    - `category_name_ar` (required Arabic category name)
    - `category_name_en` (optional English category name)
    - `name_ar` (required Arabic product name)
    - `name_en` (optional English product name)
    - `description_ar` (optional Arabic description)
    - `price` (required non-negative number in EGP)
    - `is_available` (optional boolean, defaults to true)
    - `image_url` (optional media URL)
  - Pre-import validation and quota checking:
    - Validates each row using strict Zod 4 schemas.
    - Rejects import if total products after import would exceed the merchant's plan quota (`max_products`).
    - Reports clear line-by-line Arabic validation errors for malformed rows without committing partial corrupted state.
  - Category resolution: dynamically matches existing categories by Arabic name or automatically creates missing categories.
  - Strict tenant isolation (`WHERE business_id = :businessId`).
- **Out of Scope (Deferred to Future Releases)**:
  - Binary proprietary Excel format (`.xlsx`) parsing requiring heavy runtime libraries.
  - Third-party POS supplier live integrations (e.g., Foodics API sync).

---

## Actors and Permissions

- **Merchant Owner / Admin / Editor**: Authorized to import menu items into their designated store.
- **Merchant Viewer**: Forbidden from importing data (HTTP 403 Forbidden).
- **Public Customer**: Zero access to import APIs.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bulk Importing Menu from CSV with Automatic Category Mapping (Priority: P1)

As a restaurant owner in Suez, I want to paste or upload a CSV file containing 40 dishes across 4 categories so my digital menu is populated instantly instead of creating each dish manually.

**Why this priority**: Massive friction reducer during merchant onboarding. Turns a 2-hour manual data entry task into a 10-second import.

**Independent Test**: Can be tested by providing a CSV string with 10 rows across 2 categories, invoking `importCatalogBatch`, and verifying that 2 categories and 10 products are created in the database.

**Acceptance Scenarios**:

1. **Given** valid CSV text with Arabic categories and dishes, **When** the merchant imports the batch, **Then** all categories are linked or created and products are added with accurate Arabic names and EGP prices.
2. **Given** a CSV with 5 valid rows and 2 malformed rows (e.g. negative price or missing Arabic name), **When** validation runs, **Then** the system reports Arabic error messages specifying the exact row numbers and errors.

---

### User Story 2 - Quota Limit Enforcement Before Import (Priority: P1)

As the system, when a Free tier merchant (limit 100 products, current count 70) attempts to import 50 products, I want to reject the import upfront with an Arabic upgrade prompt so the merchant does not exceed their tier capacity.

**Why this priority**: Protects platform tier monetization and prevents exceeding resource limits.

**Independent Test**: Can be tested by simulating a store with 80 products attempting to import 30 products on a 100-limit tier, verifying upfront rejection before inserting any row.

**Acceptance Scenarios**:

1. **Given** a merchant whose import count exceeds remaining quota, **When** they trigger import, **Then** the request is rejected with message: "الكمية المطلوب استيرادها تتجاوز الحد الأقصى للمنتجات المتاح في باقتك الحالية".
2. **Given** a Pro merchant with sufficient quota, **When** they import 200 items, **Then** the import proceeds and completes successfully.

---

## Technical Constraints & Design Principles

1. **Free-First ($0 Budget)**: Native CSV parser without adding heavy third-party NPM packages like `xlsx` or `papaparse`.
2. **Atomic Batching**: Bounded batches prevent serverless execution timeouts.
3. **Arabic RTL First**: Native support for UTF-8 Arabic text and RTL error reporting.
4. **Zod 4 Compliance**: Strict schema validation for each imported row.
