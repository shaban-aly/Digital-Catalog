# Technical Research: Identity and Access (IDN-001)

**Feature**: `IDN-001: Identity and Access`  
**Date**: 2026-11-06  
**Status**: Completed

## 1. Authentication Engine & Session Persistence in TanStack Start

### Context & Challenge
TanStack Start combines Server-Side Rendering (SSR) on Cloudflare Workers with client-side React 19 hydration. In an edge-rendered environment, how should authentication tokens be managed to ensure zero layout flickering, instant session restoration, and compliance with the Free-First architecture?

### Evaluation of Options

| Strategy | Pros | Cons | Decision |
|---|---|---|---|
| **Option A: Client-Side localStorage with Post-Hydration Auth Provider (Selected)** | Simple, robust, 100% compatible with Supabase JS SDK default persistence, zero Worker CPU overhead for public catalog requests. | Slight delay before protected admin views render (handled smoothly by loading skeletons). | **SELECTED** |
| **Option B: Cookie-based SSR Session Hydration** | Eliminates admin layout flash on cold SSR. | Requires complex edge cookie exchange, CORS cookie handling across subdomains, and increases Worker CPU time on every request. | Rejected for MVP; premature complexity for merchant dashboard. |

### Decision
Adopt **Option A**: Use Supabase JS client with native browser `localStorage` persistence managed via `AuthProvider` and `useAuth()`. The public catalog (which comprises 99% of traffic) remains 100% unauthenticated and cached at the Cloudflare Edge CDN without processing auth tokens. The merchant dashboard (`/_admin`) handles authentication checks on the client during or immediately following hydration, displaying an elegant Arabic loading skeleton while `getSession()` resolves.

---

## 2. Open Redirect Vulnerability Mitigation

### Context & Challenge
When unauthenticated users visit a bookmarked URL such as `/_admin/products`, the system intercepts the request and sends them to `/auth/login?redirect=%2F_admin%2Fproducts`. After login, they are sent to the target URL. If an attacker constructs a malicious link like `/auth/login?redirect=https://evil.com` or `/auth/login?redirect=//evil.com`, an unvalidated redirect would expose merchants to phishing attacks.

### Security Best Practices & Sanitization Protocol
1. **Enforce Single Leading Slash**: The destination MUST start with `/` and MUST NOT start with `//` (protocol-relative URL).
2. **Reject External Protocols**: The destination must not contain `:`, preventing `http:`, `https:`, `javascript:`, `data:`, etc.
3. **Reject Backslashes**: The destination must not contain `\` (which browsers normalize to `/` in certain contexts).
4. **Whitelist Safe Prefixes**: The destination path must begin with known internal route prefixes (e.g. `/_admin`, `/dashboard`, `/onboarding`) or default to `/dashboard`.

### Implementation Formula
```typescript
export function sanitizeRedirectUrl(rawRedirect: string | null | undefined, fallback = '/dashboard'): string {
  if (!rawRedirect || typeof rawRedirect !== 'string') return fallback;
  const trimmed = rawRedirect.trim();
  // Reject protocol-relative, backslash, colon, or non-single-slash targets
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\') || trimmed.includes(':')) {
    return fallback;
  }
  return trimmed;
}
```

---

## 3. Arabic-First Error Translation & Anti-Enumeration

### Context & Challenge
Supabase Auth returns standard English error messages (e.g. `Invalid login credentials`, `User already registered`). In order to provide an impeccable Arabic-first experience while maintaining high security against user enumeration attacks:
- User-facing messages must be natural, polite Arabic.
- Password reset requests MUST NOT reveal whether an email address exists in the system.

### Decision & Mapping Matrix
- **Login Failures**: Map `invalid_grant` and `Invalid login credentials` to a single generic Arabic message:
  `"البريد الإلكتروني أو كلمة المرور غير صحيحة."` (protects against account enumeration on login).
- **Registration Duplicate**: Map `User already registered` to:
  `"هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول."`
- **Password Reset Requests**: Always display success:
  `"تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني في حال كان الحساب مسجلاً لدينا."`
- **Network / Timeout Errors**: Map `Failed to fetch` and network timeouts to:
  `"تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والتحقق من إعدادات الشبكة."`
- **Rate Limit Errors**: Map `over_email_send_rate_limit` to:
  `"تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً."`

---

## 4. Scope Boundary with TEN-001 & BIZ-001

### Architectural Boundary
- **`IDN-001` (Identity)**: Answers *Who are you?* Validates email/password, issues JWT with `auth.uid()`, manages session lifecycle.
- **`TEN-001` (Authorization)**: Answers *What can you access?* Enforces PostgreSQL RLS on `business_members` using `auth.uid()`.
- **`BIZ-001` (Store Setup)**: Answers *What is your business?* Handles onboarding when an authenticated user has zero business memberships.

This clean separation ensures zero coupling between authentication mechanics and tenant database queries.

