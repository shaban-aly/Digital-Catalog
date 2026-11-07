# Digital Catalog Platform Overview

## Purpose

Digital Catalog is a multi-tenant, Arabic-first platform for merchants to publish a mobile catalog, share a permanent QR link, and receive customer inquiries or orders through WhatsApp.

This document records shared product boundaries. It does not replace an individual feature specification.

## Canonical Product Decisions

- The central platform is `https://digitalmenu.daleel-al-suez.com/`.
- A merchant storefront uses `https://{store-slug}.digitalmenu.daleel-al-suez.com/`.
- The apex domain, `www`, and `tools` remain outside the storefront wildcard route.
- The public catalog is Arabic-first, RTL, mobile-first, and available without a customer account.
- A merchant owns all tenant-scoped business data through `business_id`.
- QR codes remain permanent short links. Their destination may evolve without reprinting a code.
- The initial commercial handoff is WhatsApp. Payment, delivery, and checkout are outside the current MVP.

## Shared Constraints

- The project constitution in `.specify/memory/constitution.md` is authoritative.
- RLS is the data authorization boundary; interface checks are not authorization.
- Public catalog responses must be edge-rendered and cacheable.
- QR redirects must not wait for analytics logging.
- Raw IP addresses must not be persisted for analytics.
- The launch architecture must remain within the free-tier constraints recorded in the constitution.

## Specification Lifecycle

Each feature folder under `specs/` has one independently reviewable `spec.md`.

`Specify -> Clarify -> Plan -> Tasks -> Analyze -> Implement -> Validate`

Only a feature that has an approved specification advances to planning. Plans and task lists are intentionally absent from boundary drafts and future features.

## Source Integration

The original MVP specification and the dynamic-subdomain specification are decomposed in [source-integration.md](source-integration.md). Their requirements are now owned by the feature specifications named in [feature-registry.md](feature-registry.md).
