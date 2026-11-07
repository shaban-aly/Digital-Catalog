# Technical Research: Bulk Catalog & Menu Import (IMP-001)

## 1. Zero-Dependency Native CSV Parsing Under Free-First Principles

To preserve project package integrity without modifying `package.json`:
- We implement a lightweight, zero-dependency CSV parser in TypeScript that handles UTF-8 Arabic text, quoted strings containing commas, and Unix/Windows newlines (`\r\n` or `\n`).
- **Header Normalization**: Columns can be supplied in English (`category_name_ar`, `name_ar`, `price`) or common Arabic variants (`التصنيف`, `اسم_المنتج`, `السعر`) for intuitive Egyptian merchant usability.

## 2. Quota Check & Category Deduplication Workflow

1. **Pre-flight Quota Calculation**:
   - Query current product count: `currentCount`.
   - Incoming valid rows count: `importCount`.
   - Business limit: `maxProducts`.
   - If `currentCount + importCount > maxProducts`, reject immediately with Arabic explanation.
2. **Category Matching**:
   - Fetch existing categories for `business_id`.
   - Build lookup map `categoryMap[name_ar.trim().toLowerCase()] = categoryId`.
   - For rows with new categories, insert category and update map before product batch insertion.
3. **Product Insertion**:
   - Batch insert products into `products` table referencing resolved `category_id`.
