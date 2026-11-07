# Feature Specification: Product Media Management (MED-001)

**Feature Branch**: `006-media-management`

**Feature ID**: `MED-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "MED-001 Product Media Management: Give merchants fast, lightweight product imagery suitable for mobile catalog browsing, including client-side WebP compression, cover image selection, gallery ordering, and storage quota governance."

---

## Purpose and Business Value

Allow merchants to enrich their catalog items with fast, high-quality, lightweight food and retail imagery optimized specifically for mobile network browsing (3G/4G). By enforcing client-side WebP transformation (capping dimensions to 1080px and compressed file size to under 100KB), page load times drop by over 70%, bandwidth costs are completely minimized ($0 Free-First infrastructure), and mobile storefront visitors enjoy instant visual menus without lag or data-heavy downloads.

---

## Scope and Boundaries

- **In Scope**:
  - Client-side image compression & format normalization: automatic WebP transformation, aspect-ratio preservation, max dimension 1080px, <100KB target size.
  - Product media records: preserving storage path, public CDN URL, file size in bytes, cover status (`is_cover`), and sort order (`sort_order`).
  - Cover image management: exactly one primary cover image per product, with immediate reassignment if deleted.
  - Gallery ordering: organizing up to 3 images per product in sequential display order.
  - Deletion lifecycle: atomic removal from PostgreSQL `product_media` and corresponding file deletion from Supabase Storage `product-images` bucket.
  - Quota enforcement: maximum 3 images per product for Free tier merchants (`LMT-001`).
- **Out of Scope (Deferred to Separate Features)**:
  - Product creation and price rules (owned by `PRD-001`).
  - Store brand logos and hero covers (owned by `BIZ-001`).
  - Public storefront gallery carousel rendering (owned by `PUB-001`).
  - Video uploads, 360-degree spins, and external image hosting CDNs (deferred).

---

## Actors and Permissions

- **Store Owner (`owner`) & Store Admin (`admin`)**: Can upload, reorder, designate cover, and delete product images.
- **Store Editor (`editor`)**: Can upload images up to product limits and adjust gallery ordering.
- **Store Viewer (`viewer`)**: Can view existing product images in read-only mode in dashboard.
- **Public Customer**: Can view public WebP images attached to published products over HTTP/HTTPS with aggressive edge caching.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client-Side WebP Compression & Upload (Priority: P1) 🎯 MVP

A merchant selects a high-resolution smartphone photo (e.g. 8 MB JPEG taken on an iPhone) of a meal. Before the image is transmitted across the cellular network, the browser compresses and resizes it into a WebP image under 100 KB and max 1080px dimension, then uploads it directly to the storage bucket and creates a `product_media` record.

**Why this priority**: Fundamental media capability. Without client-side compression, large mobile photos would crash mobile memory, consume Supabase storage quotas instantly, and cause slow storefront load times.

**Independent Test**: Can be tested by compressing an image file via `compressImageToWebP`, verifying that output MIME type is `image/webp`, file size is reduced by >80%, and uploading via `storageService.upload` to verify file availability at `publicUrl`.

**Acceptance Scenarios**:

1. **Given** an image file (JPEG, PNG, or WebP) up to 10MB, **When** passed through `compressImageToWebP`, **Then** the resulting file is strictly `image/webp` with width and height $\le$ 1080px.
2. **Given** a compressed WebP file, **When** uploaded via `storageService.upload`, **Then** it is stored in the `product-images` bucket under `{businessId}/{productId}/{filename}.webp` and returns a valid public URL.
3. **Given** an invalid or corrupted file type (e.g. PDF, executable), **When** submitted, **Then** the system rejects the upload with an Arabic error message ("نوع الملف غير مدعوم").

---

### User Story 2 - Cover Image Selection & Gallery Reordering (Priority: P1) 🎯 MVP

A merchant uploads 3 photos for a dress or specialty dish. The merchant designates the second photo as the main cover ("الصورة الرئيسية"), and changes the gallery display sequence.

**Why this priority**: Storefront product cards display exactly one cover image; merchants must be able to curate the most appealing photo as the card preview.

**Independent Test**: Can be tested by uploading multiple images for a product, setting `is_cover = true` on image #2, and querying `product_media` to verify that image #2 is marked as cover while previous cover is demoted to `false`.

**Acceptance Scenarios**:

1. **Given** a newly uploaded image for a product with zero existing images, **Then** it is automatically assigned `is_cover = true` and `sort_order = 0`.
2. **Given** multiple product images, **When** the merchant designates a new image as cover, **Then** that image becomes `is_cover = true` and all other images for that product are set to `is_cover = false`.
3. **Given** multiple product images, **When** the merchant updates sort orders (0, 1, 2), **Then** gallery fetch queries return items in ascending sort order.

---

### User Story 3 - Media Deletion & Free Tier Quota (Priority: P2)

A merchant removes an outdated photo from a product. The system deletes the database row from `product_media` and removes the physical asset from storage. If a product already has 3 images, the system disables further uploads until an existing image is removed.

**Why this priority**: Prevents orphaned storage files from accumulating in Supabase Storage and enforces Free-First zero-cost governance.

**Independent Test**: Can be tested by deleting an image via media service and verifying that both the database record and storage bucket file are removed, and attempting to add a 4th image to a product to verify quota rejection.

**Acceptance Scenarios**:

1. **Given** an existing product image, **When** deleted by an authorized merchant, **Then** the database row is deleted and `storageService.delete` is invoked with the exact storage path.
2. **Given** a product that already has 3 images, **When** the merchant attempts to upload a 4th image, **Then** the upload is blocked with an Arabic limit alert ("الحد الأقصى هو 3 صور لكل منتج في الباقة المجانية").
3. **Given** a cover image that is deleted, **When** remaining images exist for the product, **Then** the system automatically promotes the next image (`sort_order ASC`) to `is_cover = true`.

---

### Edge Cases

- **Cover Deletion Fallback**: If the active cover image is deleted and 2 images remain, the system automatically sets `is_cover = true` on the remaining image with the lowest `sort_order`, preventing products without a cover preview.
- **Client Offline / Network Interruption**: If the network disconnects during the upload step after compression, no partial database record is inserted; the user is prompted to retry.
- **Product Deletion Cascade**: When a parent product is deleted in `PRD-001`, all child `product_media` records cascade delete in PostgreSQL, and background cleanup removes storage bucket objects.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compress and transform all uploaded product images to `image/webp` format client-side before network upload.
- **FR-002**: System MUST restrict maximum image dimensions to 1080px (width and height) preserving original aspect ratio.
- **FR-003**: System MUST reject files exceeding 200KB post-compression to guarantee fast mobile catalog loading.
- **FR-004**: System MUST store images in dedicated paths formatted as `{business_id}/{product_id}/{timestamp}-{filename}.webp`.
- **FR-005**: System MUST enforce a maximum quota of 3 images per product for tenants on the `free` plan tier.
- **FR-006**: System MUST maintain exactly one cover image (`is_cover = true`) per product that has at least one media asset.
- **FR-007**: System MUST support visual reordering via integer `sort_order` (0, 1, 2) on `product_media`.
- **FR-008**: System MUST atomically delete both the database record and the storage file when an image is deleted.
- **FR-009**: System MUST automatically reassign cover status to the next sequential image if the current cover image is deleted.
- **FR-010**: All image upload progress indicators, dimension warnings, and error messages MUST be rendered in Arabic RTL typography.

---

### Key Entities

- **ProductMedia (`public.product_media`)**:
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Foreign Key -> `products(id) ON DELETE CASCADE`)
  - `storage_path`: TEXT (Bucket path e.g. `business-id/product-id/img.webp`)
  - `public_url`: TEXT (Direct or CDN-rewritten public URL)
  - `file_size_bytes`: INT (Size in bytes post-compression)
  - `is_cover`: BOOLEAN (Default `false`)
  - `sort_order`: INT (Default `0`)
  - `created_at`: TIMESTAMPTZ

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of uploaded images are WebP format with dimensions $\le$ 1080px.
- **SC-002**: Average compressed file size is under 90 KB, delivering a >75% reduction compared to original mobile photos.
- **SC-003**: Mobile storefront product imagery loads in under 400ms on 4G cellular connections.
- **SC-004**: Zero orphaned storage assets remain when products or product images are deleted.
- **SC-005**: 100% of products with images maintain a designated cover image for catalog card previews.

---

## Assumptions & Dependencies

- **Dependency on PRD-001**: Master product must exist before product media can be attached.
- **Dependency on Supabase Storage**: Dedicated public bucket `product-images` must be configured with public read access.
- **Downstream Consumer PUB-001**: Public catalog uses `is_cover = true` for grid cards and `sort_order` for modal gallery carousel.
