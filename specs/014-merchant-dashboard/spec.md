# Feature Specification: Merchant Dashboard Workspace (MCH-001)

**Feature ID**: `MCH-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: IDN-001, TEN-001, BIZ-001, CAT-001, PRD-001, QR-001, ANL-001, LMT-001

---

## 1. Purpose and Business Value

Provide Suez merchants with a unified, RTL-first control center to manage their store. From the dashboard, merchants can manage catalog items and categories, view canonical subdomain URLs with 1-click clipboard copying, preview their live digital menu, trigger QR code downloads, monitor privacy-safe customer engagement metrics, and track their subscription usage against Free Forever quotas (100 products, 15 categories).

---

## 2. Actors and Permissions

- **Authenticated Merchant Owner / Admin (`TEN-001`)**: Has full access to manage business products, categories, QR codes, and view engagement metrics.
- **Unauthenticated Visitor**: Blocked by route guard in `_admin.tsx` and redirected to `/auth/login` via `sanitizeRedirectUrl`.

---

## 3. User Stories

### User Story 1: Protected Shell & Route Guard (P0 - Priority: Highest)
**As an** unauthenticated visitor,  
**I want to** be redirected to `/auth/login` safely when trying to access `/dashboard`,  
**So that** merchant administration remains strictly private and protected.

- **Acceptance Criteria**:
  - `_admin.tsx` evaluates user authentication status.
  - Redirects to `/auth/login` with sanitized redirect parameter (`sanitizeRedirectUrl(path, '/dashboard')`).
  - Renders top navigation bar with store identity, quick links, and logout button.

### User Story 2: Canonical Subdomain Banner & 1-Click Copy (P0 - Priority: Highest)
**As a** merchant,  
**I want to** clearly see my permanent subdomain link (`https://{slug}.digitalmenu.daleel-al-suez.com/`) with 1-click copy,  
**So that** I can easily share my web link on social media and WhatsApp.

- **Acceptance Criteria**:
  - Prominently displays subdomain URL with dedicated copy button.
  - Provides visual feedback ("تم النسخ!") upon successful clipboard copy.
  - Includes a direct "زيارة المتجر" link opening in a new tab.

### User Story 3: Fast QR Launcher & Printable Download Handoff (P0 - Priority: Highest)
**As a** merchant,  
**I want to** tap "رمز QR" on my dashboard overview,  
**So that** the QR download modal opens immediately with high-res PNG and SVG download buttons.

- **Acceptance Criteria**:
  - Opens `QRDownloadModal` populated with store name and short code.
  - Supports instant raster PNG and vector SVG downloads.

### User Story 4: Products & Categories Management Workspace (P0 - Priority: Highest)
**As a** merchant,  
**I want to** navigate to `/dashboard/products` to create, edit, search, and delete items,  
**So that** I keep my menu up to date.

- **Acceptance Criteria**:
  - Category selector tabs and real-time search input.
  - Creation drawers for new products and categories.
  - Displays product prices, active badges, and stock indicators.

### User Story 5: Engagement Metric Cards with Estimate Labeling (P1 - Priority: High)
**As a** merchant,  
**I want to** view scan and visitor metrics,  
**So that** I can track customer interest while understanding which numbers are derived estimates.

- **Acceptance Criteria**:
  - Renders 4 metric cards: Total Scans, Total Views (labeled as estimated), Total WhatsApp Clicks (labeled as estimated), and Unique Visitors (estimated).
  - Tolerates analytics fetch errors gracefully without breaking the rest of the dashboard.

### User Story 6: Recoverable Onboarding State (P1 - Priority: High)
**As a** newly registered user without a provisioned business,  
**I want to** see a clear, encouraging recovery card,  
**So that** I can easily proceed to store setup at `/auth/register`.

- **Acceptance Criteria**:
  - Detects `business === null` after authentication.
  - Renders clear Arabic guidance with a direct action button: "إعداد متجرك التجاري الآن".

---

## 4. Functional Requirements

- **FR-001**: Dashboard layout MUST enforce authentication and tenant scoping.
- **FR-002**: Navigation shell MUST support responsive RTL viewports with mobile drawer.
- **FR-003**: Subdomain banner MUST display canonical format adhering to DOM-001.
- **FR-004**: Metric displays MUST clearly mark derived views and clicks as estimated ("تقديري").
- **FR-005**: All schemas conform to strict Zod 4 syntax (`DashboardNavigationSchema`, `DashboardStatsSchema`).

---

## 5. Non-Functional & Constitutional Requirements

- **Principle I (Arabic RTL First)**: Arabic typography, numbers, and vocabulary throughout the workspace.
- **Principle II ($0 Infrastructure)**: Client-side state hydration using TanStack Router and Supabase queries.
- **Principle VII (Strict Type Safety)**: 100% typed with strict TypeScript and Zod 4.
