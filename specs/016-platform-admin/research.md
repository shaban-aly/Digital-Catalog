# Technical Research: Platform Super Admin Dashboard (ADM-001)

## 1. Offline Payment Model & Manual Upgrades in Egypt

In the current Egyptian retail landscape:
- Small restaurants, cafeterias, and retail shops in Suez predominantly pay for software services using **InstaPay** (instant bank account to bank account/mobile transfer via Egyptian Central Bank network) or **Vodafone Cash** (mobile wallet).
- Automated payment gateway integration (such as Paymob or Fawry) involves corporate commercial registry verification, tax cards, and percentage transaction fees, which can delay MVP rollout.
- **Workflow**:
  1. Merchant initiates upgrade request in dashboard (`LMT-001`), generating an encoded WhatsApp message with store details and payment preference.
  2. Merchant completes transfer via InstaPay / Vodafone Cash to the platform account and sends transfer screenshot on WhatsApp.
  3. Platform Super Admin logs into `/platform-admin`, locates the merchant, verifies receipt, and executes a 1-click upgrade to `pro` plan, setting new quotas (`max_products: 500`, `max_categories: 30`) and entering the transfer reference number in `admin_notes`.
  4. Changes apply instantly in the merchant's dashboard without downtime.

## 2. Super Admin Authorization & RLS Safety

To prevent privilege escalation:
- Super Admin identity is verified through a persistent `platform_admins` table or environment authorization list (`SUPER_ADMIN_USER_IDS`).
- The `PlatformAdminService` performs an explicit server-side authorization check before executing any platform-wide read or mutation.
- Unprivileged users calling administrative endpoints receive an immediate `403 Forbidden` response.
