# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, TypeScript, TanStack Start (Router, Query, Form, Table), Tailwind CSS, shadcn/ui, Cloudflare Workers, Supabase (PostgreSQL, Auth, Storage).

## Users

- **Primary User**: Small and medium business merchants (restaurants, cafes, grocery stores, fashion boutiques, electronics shops, salons, laundry services) who currently rely on static PDFs, social media images, or printed paper menus. They need an effortless, zero-cost digital catalog that updates prices and items instantly without breaking printed QR codes or requiring complex e-commerce management.
- **Secondary User (End Consumer)**: Shoppers and diners scanning QR codes on physical tables, counters, or posters using mobile phones on 3G/4G networks, seeking an immediate, lightweight, easy-to-browse visual catalog with direct WhatsApp ordering/inquiry.

## Product Purpose

Democratize digital commerce and catalog management by providing a high-performance, multi-industry Digital Catalog & QR Platform that operates with zero initial cost for both the merchant and the platform operator, converting static paper operations into vibrant, real-time digital storefronts.

## Positioning

Unlike complex e-commerce platforms (Shopify, Salla, Zid) that demand payment gateway fees, shipping configurations, and monthly subscriptions, and unlike fragile PDF-to-link QR generators that break upon price changes, this platform offers a **universal multi-industry catalog engine with permanent dynamic QR routing, sub-second edge performance, and direct WhatsApp commerce conversion**, completely free at entry.

## Operating Context

- **Merchant Workflow**: Quick sign-up, entering store details, creating categories, adding up to 100 products with automatic browser-side WebP image compression, generating a branded permanent QR code, and printing it for store placement.
- **Consumer Interaction**: In-store or remote mobile scanning of the QR code, immediate SSR page rendering without app installation or login, category filtering, product search, and one-tap order/inquiry via WhatsApp.

## Capabilities and Constraints

- **Confirmed Capabilities**:
  - Multi-industry data modeling (restaurants with modifiers/options, supermarkets with barcodes/units, fashion with color/size variants).
  - Tiered hierarchical pricing (base price, variant price, option value delta, catalog-level override).
  - Dynamic permanent QR redirection (`/q/:shortCode`) with instant HTTP 302 and asynchronous, privacy-safe analytics.
  - Complete SSR and SEO metadata (OpenGraph tags, JSON-LD Schema.org structured data).
  - Arabic (RTL) native interface with English (LTR) symmetry.
  - Direct WhatsApp CTA with pre-formatted product message.
- **Durable Constraints**:
  - $0 monthly infrastructure cost during initial launch.
  - Cloudflare Workers Free: 100,000 requests/day, 10ms CPU execution limit per request.
  - Supabase Free: 500 MB database, 1 GB storage, 2 GB egress bandwidth.
  - Merchant Quotas: 1 business, 1 catalog, 100 master products, 15 categories, 3 images per product (<100KB WebP), 1 default branch.
  - Currency: Egyptian Pound (EGP / ج.م) as default standard.
  - Single primary domain: `https://digitalmenu.daleel-al-suez.com/`.

## Brand Commitments

- **Product Name**: Digital Menu (ديجيتال منيو)
- **Domain**: `https://digitalmenu.daleel-al-suez.com/`.
- **Identity & Voice**: Clean, trustworthy, utilitarian, modern SaaS with regional Arabic authenticity tailored for Suez/Egypt.
- **Growth Mechanic**: Discreet, elegant viral badge on free public menus: *"أنشئ المنيو الإلكتروني مجاناً عبر ديجيتال منيو"* / *"Powered by Digital Menu - Daleel Al-Suez"*.

## Evidence on Hand

- Approved Master Architecture Specification: [free-first-architecture-final-review.md](file:///C:/Users/shaban_aly/.gemini/antigravity/brain/0e1293ce-0598-41e5-b721-000cc6f1def1/free-first-architecture-final-review.md).
- Ratified Project Constitution: [.specify/memory/constitution.md](file:///e:/Projects/Digital-Catalog/.specify/memory/constitution.md).

## Product Principles

1. **Free-First Without Compromise**: Free plans must never cripple public catalog speed, SEO discovery, or WhatsApp conversion.
2. **Permanent QR Integrity**: A printed QR code must never break; content, slugs, and prices change dynamically behind a stable short redirect.
3. **Sub-Second Mobile Edge Rendering**: Instant perceived performance on low-bandwidth mobile networks via Cloudflare CDN caching and SSR.
4. **Decoupled Inventory & Presentation**: Centralized product catalog assets can be placed, customized, and repriced across multiple catalog contexts without data duplication.
5. **Absolute Security at the Data Layer**: Multi-tenant isolation enforced strictly via PostgreSQL Row Level Security (RLS).

## Accessibility & Inclusion

- Native Arabic (RTL) typography hierarchy as primary locale; seamless English (LTR) toggle.
- Touch target sizes minimum 44x44px for one-handed mobile ergonomics.
- High contrast color ratios (WCAG AA compliant) for outdoor/daylight readability in dining and shopping environments.

