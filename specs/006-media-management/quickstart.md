# Quickstart & Verification Guide: Product Media Management (MED-001)

**Feature**: `MED-001: Product Media Management`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify image compression to WebP, upload to storage, cover image assignment, and the 3-image Free quota limit.

---

## Verification Scenarios

### Scenario 1: WebP Transformation & Dimension Scaling
1. Compress a test image file using `compressImageToWebP`.
2. **Expected**: Resulting file has MIME type `image/webp`, width $\le$ 1080px, height $\le$ 1080px, and file size compressed to under 100KB.

### Scenario 2: Automatic Cover Assignment on First Upload
1. Upload the first image for a product with zero existing photos.
2. **Expected**: Row created in `product_media` with `is_cover = true` and `sort_order = 0`.

### Scenario 3: Explicit Cover Reassignment
1. Upload a second image for the same product (`is_cover = false`, `sort_order = 1`).
2. Call `mediaService.setCoverImage(productId, secondImageId)`.
3. **Expected**: Second image is updated to `is_cover = true`, and first image is updated to `is_cover = false`.

### Scenario 4: Free Plan Quota Enforcement (3 Images Max)
1. For a product that already has 3 images in `product_media`, attempt to upload a 4th image.
2. **Expected**: System rejects the upload with an Arabic exception:
   *"الحد الأقصى هو 3 صور لكل منتج في الباقة المجانية."*

### Scenario 5: Automatic Cover Promotion on Deletion
1. In a product with 2 images (Image A: `is_cover = true`, Image B: `is_cover = false`), delete Image A.
2. **Expected**: Image A is removed from `product_media` and storage bucket. Image B is automatically promoted to `is_cover = true`.

---

## Automated Verification Commands

```powershell
# 1. TypeScript Strict Typecheck
npx tsc --noEmit

# 2. Run All Unit Test Suites (including Media Management)
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts tests/unit/tenant-authorization.test.ts tests/unit/business-management.test.ts tests/unit/catalog-management.test.ts tests/unit/product-management.test.ts tests/unit/media-management.test.ts
```

