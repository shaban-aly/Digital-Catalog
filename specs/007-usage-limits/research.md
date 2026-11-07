# Technical Research: Entitlements and Usage Limits (LMT-001)

**Feature**: `LMT-001: Entitlements and Usage Limits`  
**Date**: 2026-11-06  
**Status**: Completed

---

## 1. Egyptian Market Payment Architecture & Manual Upgrade Flow

### Context & Market Reality
In Egypt, 90%+ of independent SMB restaurants, cafes, and retailers do not possess active merchant credit cards or Stripe accounts. The predominant electronic payment methods are:
1. **InstaPay (إنستاباي - شبكة المدفوعات اللحظية IPN)**: Instant peer-to-peer / merchant transfer via IPA address or bank mobile number. Zero transaction fees.
2. **Vodafone Cash & Mobile Wallets (فودافون كاش ومحافظ المحمول)**: Ubiquitous mobile money transfer to merchant phone numbers.
3. **Local Bank Transfer (تحويل بنكي)**: Direct transfer via IBAN (e.g. CIB, NBE, Banque Misr).
4. **Online Card Payment Gateway (فيزا وماستركارد)**: Automated payment gateway (Paymob, Fawry, Tap) intentionally marked with a "قريباً الدفع التلقائي" (Coming Soon) badge for future automated integration.

### Manual Verification & WhatsApp Confirmation Flow
Because no automated payment gateway API is initially enabled, the upgrade flow is streamlined for zero friction:
1. Merchant opens "الباقات والاشتراكات" (Plans & Billing).
2. Reviews available plans (Pro: 500 products, 30 categories).
3. Chooses their preferred local payment channel (InstaPay, Vodafone Cash, or Bank Transfer) with account/wallet numbers clearly presented in Arabic RTL with one-click copy buttons.
4. Completes the transfer outside the app.
5. Clicks "إرسال إيصال الدفع وتأكيد الترقية عبر واتساب".
6. The app opens a pre-composed WhatsApp message to platform administration containing:
   - Business ID and Store Name
   - Selected Plan Code (`pro`)
   - Transfer timestamp
7. Platform Super Admin reviews the receipt and upgrades the store via `ADM-001` (Super Admin Dashboard).

---

## 2. Real-Time Quota Metrics Calculation

### In-Memory Capacity Algorithm
Given a business record with `plan_code`, `max_products`, and `max_categories`:
$$\text{Product Usage \%} = \min\left(100, \text{round}\left(\frac{\text{Active Products}}{\text{max\_products}} \times 100\right)\right)$$
$$\text{Category Usage \%} = \min\left(100, \text{round}\left(\frac{\text{Active Categories}}{\text{max\_categories}} \times 100\right)\right)$$

- Threshold States:
  - Normal ($< 80\%$): Green progress bar.
  - Warning ($80\% - 99\%$): Amber progress bar with subtle upgrade notice.
  - Exceeded / Limit Reached ($100\%$): Red progress bar with prominent upgrade CTA and disabled "Add Product" button.

---

## 3. Database RLS Protection on Entitlement Fields

### Attack Vector:
A rogue tenant sending an API update request to `public.businesses` trying to set:
`{ "plan_code": "pro", "max_products": 9999 }`.

### Defense:
PostgreSQL RLS policies on `public.businesses` strictly prevent tenant members from updating entitlement columns:
- Tenants can update: `name`, `phone_number`, `industry_type`, `logo_url`, `cover_url`.
- Tenants CANNOT update: `plan_code`, `max_products`, `max_categories`, `status`.
- Entitlement columns are strictly modified by `SECURITY DEFINER` procedures or Platform Super Admin.

