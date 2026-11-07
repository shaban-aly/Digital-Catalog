# Quickstart & Verification Guide: Identity and Access (IDN-001)

**Feature**: `IDN-001: Identity and Access`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable end-to-end scenarios to verify all functional requirements and acceptance criteria defined in [spec.md](./spec.md).

---

## Prerequisites & Environment Setup

Ensure the following environment variables are configured in `.env` (derived from `.env.example`):

```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<public-anon-key>"
```

Start the local development server:

```powershell
npm run dev
```

---

## Verification Scenarios

### Scenario 1: New Merchant Registration
1. Open the browser and navigate to `http://localhost:5173/auth/register`.
2. Enter an invalid email (e.g. `test-invalid`) or a password shorter than 6 characters.
   - **Expected**: Form displays immediate Arabic validation feedback; submission is prevented.
3. Enter a valid email `new-merchant@example.com` and password `Secret123!`.
4. Click "إنشاء حساب" (Create Account).
   - **Expected**: Success message is displayed prompting email confirmation, or navigating to initial onboarding.

### Scenario 2: Merchant Sign-In & Dashboard Navigation
1. Navigate to `http://localhost:5173/auth/login`.
2. Enter invalid credentials (`wrong@example.com` / `wrongpass`).
   - **Expected**: Arabic error banner appears: *"البريد الإلكتروني أو كلمة المرور غير صحيحة."*
3. Enter valid registered credentials and click "تسجيل الدخول".
   - **Expected**: Redirects to `/dashboard` (or `/_admin`) with user session established.

### Scenario 3: Session Persistence Across Page Refresh
1. While authenticated on `/dashboard`, refresh the browser (F5) or close and reopen the tab.
   - **Expected**: User remains authenticated; dashboard data is rendered without redirecting back to `/auth/login`.

### Scenario 4: Protected Route Redirection with Safe Target
1. Open an incognito window (unauthenticated).
2. Directly visit `http://localhost:5173/dashboard/products`.
   - **Expected**: Immediately redirects to `http://localhost:5173/auth/login?redirect=%2Fdashboard%2Fproducts`.
3. Log in with valid credentials.
   - **Expected**: After successful login, user lands directly on `/dashboard/products` rather than default `/dashboard`.

### Scenario 5: Open Redirect Attack Neutralization
1. Open an incognito window.
2. Directly visit `http://localhost:5173/auth/login?redirect=https://evil-phishing-site.com`.
3. Log in with valid credentials.
   - **Expected**: System sanitizes the malicious external URL and safely redirects to `/dashboard`.

### Scenario 6: Password Recovery (Anti-Enumeration)
1. On `/auth/login`, click "نسيت كلمة المرور؟" (Forgot Password).
2. Enter an unregistered email `nonexistent-user-12345@example.com`.
3. Submit the reset form.
   - **Expected**: Displays generic success message: *"تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني في حال كان الحساب مسجلاً لدينا."* System reveals zero information about account existence.

### Scenario 7: Sign Out & Token Revocation
1. From the dashboard sidebar or top bar, click "تسجيل الخروج" (Sign Out).
   - **Expected**: Tokens in `localStorage` are cleared, user state reverts to unauthenticated, and browser redirects to `/auth/login`.

---

## Automated Verification Commands

Run the automated test suite and type check:

```powershell
# 1. TypeScript Strict Type Check
npm run typecheck

# 2. Automated Auth Contract & Sanitizer Tests
npm run test:run
```

