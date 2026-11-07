# Technical Research: Merchant Dashboard Workspace (MCH-001)

## 1. Merchant Workspace Navigation & Layout

Merchants in Suez predominantly access the dashboard via smartphones and tablets at their store counter:
- **Mobile-First Responsive Layout**: Collapsible sidebar / bottom navigation bar for quick access between "نظرة عامة" (Overview) and "المنتجات والتصنيفات" (Products & Categories).
- **Fast 1-Click Operations**:
  - Direct clipboard copy of tenant subdomain link.
  - Direct menu preview (`target="_blank"`).
  - Direct modal launch for QR downloads without leaving the page.

## 2. Metric Labeling & Transparency
To ensure honesty and compliance with FR-003:
- **Total Scans**: Directly measured count from `qr_codes.total_scans`.
- **Total Views**: Derived estimate based on historical 1.4x pageview ratio $\rightarrow$ explicitly marked with badge `تقديري` (Estimated).
- **Total WhatsApp Inquiries**: Derived estimate based on historical conversion ratios $\rightarrow$ marked with badge `تقديري` (Estimated).
- **Unique Visitors**: Derived daily estimate from salted hashes $\rightarrow$ marked with badge `تقديري` (Estimated).

