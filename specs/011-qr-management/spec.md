# Feature Specification: QR Code Management (QR-001)

**Feature ID**: `QR-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: BIZ-001, CAT-001, LIF-001, PUB-001, DOM-001

---

## 1. Purpose and Business Value

Provide merchants with a permanent, printable, dynamic QR code that remains physically stable on table stands and window decals even when catalog themes, items, or slug structures change. When scanned by a customer, the platform performs an ultra-fast HTTP 302 redirect directly to the merchant's live catalog at the Cloudflare Worker edge (<50ms) while queueing privacy-preserving scan telemetry asynchronously without delaying the user.

---

## 2. Actors and Permissions

- **Merchant Owner / Admin (`TEN-001`)**: Can view, generate, preview, and download their business's official QR code in high-resolution PNG or SVG formats.
- **Customer / Public Diner**: Scans the physical or digital QR code and gets redirected immediately to the store's active catalog.

---

## 3. User Stories

### User Story 1: Stable Base32 Short Code Generation (P0 - Priority: Highest)
**As a** merchant,  
**I want to** have a permanent, short link (`https://digitalmenu.daleel-al-suez.com/q/{shortCode}`) assigned to my catalog,  
**So that** my printed table stickers never become obsolete or broken when I update my menu.

- **Acceptance Criteria**:
  - Generated code is 6 characters long using unambiguous Base32 characters (`23456789abcdefghjkmnpqrstuvwxyz`, omitting easily confused `0, 1, l, o`).
  - Automatic collision resolution with up to 5 retries.
  - Generates idempotently: repeated calls return the existing active QR record.

### User Story 2: Ultra-Fast Edge 302 Redirection (<50ms) (P0 - Priority: Highest)
**As a** customer sitting at a table scanning the QR code with my phone,  
**I want to** reach the menu instantly without seeing loading spinners or intermediate transition pages,  
**So that** I have a seamless dining experience.

- **Acceptance Criteria**:
  - Handles `/q/{shortCode}` route directly in `entry-worker.ts` with HTTP 302.
  - Target server processing time < 50ms.
  - Sets `Cache-Control: no-cache, no-store, must-revalidate` so every physical scan triggers accurate scan counting without browser caching.
  - Analytics event logging dispatched in background via `ctx.waitUntil` or non-blocking fire-and-forget.

### User Story 3: High-Resolution Printable PNG/SVG Download (P0 - Priority: Highest)
**As a** merchant,  
**I want to** preview my QR code and download it in PNG (raster) or SVG (vector) formats,  
**So that** I can send it to my print shop in Suez for high-quality table tents and stickers.

- **Acceptance Criteria**:
  - `QRDownloadModal` renders live scannable QR preview with merchant store name.
  - Supports 1-click download for 500x500 PNG and vector SVG.
  - Encoded URL is the platform short URL (`/q/{shortCode}`).

### User Story 4: Graceful Handling of Inactive or Unknown QR Codes (P1 - Priority: High)
**As a** customer scanning an invalid or discontinued QR code,  
**I want to** see an informative Arabic message,  
**So that** I know the code is inactive instead of facing a broken connection.

- **Acceptance Criteria**:
  - Non-existent or inactive short codes return HTTP 404 with Arabic explanation: "رمز الاستجابة السريعة (QR) غير متاح أو تم إيقافه".
  - RTL-first styling with zero system exception leaks.

---

## 4. Functional Requirements

- **FR-001**: `QRService.getOrCreateQRCode` returns or creates the active `QRCodeRecord` for a business/catalog.
- **FR-002**: `QRService.resolveDestination` resolves a `shortCode` to its target URL and `qrId`.
- **FR-003**: Short code generation uses cryptographic randomness (`crypto.getRandomValues`) with Base32 charset.
- **FR-004**: Redirection route MUST use HTTP 302 with `Location` header and `no-cache` directives.
- **FR-005**: All input payloads validated via strict Zod 4 schemas (`CreateQRCodeSchema`, `ResolveShortCodeSchema`).

---

## 5. Non-Functional & Constitutional Requirements

- **Principle I (Arabic RTL First)**: Offline error screens and download modals use Egyptian Arabic.
- **Principle II ($0 Infrastructure)**: Edge 302 routing on Cloudflare Worker; vector generation without paid external APIs.
- **Principle VII (Strict Type Safety)**: 100% typed with strict TypeScript and Zod 4.
