# Architecture & Implementation Plan: QR Code Management (QR-001)

## 1. Executive Summary
Feature `QR-001` provides permanent printable QR codes for Suez businesses. It uses cryptographic Base32 short codes, non-blocking asynchronous analytics logging, and zero-wait HTTP 302 edge redirection at Cloudflare Worker edge (<50ms).

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Download modals and fallback offline error screens are Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Edge 302 routing on Cloudflare Worker; vector generation without paid third-party APIs.
- [x] **Gate 3: Zod 4 Compliance**: Input/output schemas conform to strict Zod 4 syntax.
- [x] **Gate 4: Permanent Stability**: Decoupled short codes survive catalog theme, item, or presentation updates.
- [x] **Gate 5: Unambiguous Alphabet**: Crockford Base32 alphabet prevents visual ambiguity (`0/O`, `1/l`).
- [x] **Gate 6: Zero-Wait Redirection**: Direct 302 redirect dispatched before background analytics logging completes.
- [x] **Gate 7: Safe Fallbacks & Zero Leaks**: Inactive or nonexistent codes return clean Arabic 404 without database leaks.
- [x] **Gate 8: Cache Prevention**: 302 redirects emit `Cache-Control: no-cache, no-store, must-revalidate` so physical scans count accurately.
- [x] **Gate 9: TypeScript Strictness**: 100% typed with strict interfaces and no unhandled unions.
- [x] **Gate 10: Automated Test Coverage**: Complete test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - `CreateQRCodeSchema`, `ResolveShortCodeSchema`, `QRCodeRecordSchema` in `src/shared/schemas.ts`.
2. **Service & Route Alignment**:
   - Verify `generateShortCode` randomness and Base32 character set in `src/server/services/qr.ts`.
   - Ensure `src/server/routes/q.$shortCode.ts` and `handleQrRedirect` handle active redirects and 404 edge fallbacks.
3. **Automated Unit Testing (`tests/unit/qr-management.test.ts`)**:
   - Test `generateShortCode` length and unambiguous Base32 character set.
   - Test `CreateQRCodeSchema` and `ResolveShortCodeSchema` validation.
   - Test `handleQrRedirect` 302 response headers (`Location`, `Cache-Control`) and 404 response for inactive codes.
4. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

