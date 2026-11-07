# Feature Specification: Identity and Access (IDN-001)

**Feature Branch**: `004-identity-access`

**Feature ID**: `IDN-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Input**: User description: "IDN-001 Identity and access: Allow a merchant to establish and use a secure account so the platform can associate management actions with a real identity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Merchant Account Registration (Priority: P1)

A new merchant visiting the platform wants to create a secure account using their email address and password so they can register their store and start creating a digital menu.

**Why this priority**: Absolute foundational prerequisite. Without a verified merchant identity, no stores, catalogs, or products can be created or associated with an owner.

**Independent Test**: Can be tested independently by navigating to `/auth/register`, submitting a valid email and secure password, and verifying that the identity provider registers the account and prompts the merchant to verify their email or proceeds to merchant setup.

**Acceptance Scenarios**:

1. **Given** a new merchant on `/auth/register`, **When** they submit a valid email and a password of at least 6 characters, **Then** the account is created, a confirmation email is dispatched, and a clear Arabic confirmation message is displayed.
2. **Given** an existing email address already registered, **When** a user tries to register with that email, **Then** the system displays a clear, friendly Arabic error message ("هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.") without exposing system stack traces.
3. **Given** an invalid email format or password shorter than 6 characters, **When** submitted, **Then** the form prevents submission with immediate inline Arabic validation feedback.

---

### User Story 2 - Merchant Sign-In, Session Restoration & Sign-Out (Priority: P1)

A registered merchant visits the platform from their computer or mobile phone, signs into their account, remains securely signed in across browser refreshes and tabs, and can securely sign out when finished.

**Why this priority**: Required for daily merchant operations. Merchants must access their existing dashboard without having to re-authenticate on every page navigation or refresh.

**Independent Test**: Can be tested by signing in with valid credentials, verifying the session is saved in browser storage, refreshing the page, confirming the user remains authenticated, and then clicking "Sign Out" to verify the session is cleared and the user is redirected to the login page.

**Acceptance Scenarios**:

1. **Given** a registered merchant on `/auth/login`, **When** they enter correct credentials and submit, **Then** they are authenticated, an active session is established, and they are redirected to their merchant dashboard.
2. **Given** invalid credentials (wrong password or unregistered email), **When** submitted, **Then** an unambiguous Arabic error message is displayed ("البريد الإلكتروني أو كلمة المرور غير صحيحة.") and password field is cleared.
3. **Given** an authenticated merchant browsing the platform, **When** they refresh the browser or open a new tab on the same device, **Then** the session is silently restored without prompting for credentials.
4. **Given** an authenticated merchant, **When** they click "Sign Out" (تسجيل الخروج), **Then** active auth tokens are revoked, local session data is cleared, and the user is safely navigated to `/auth/login`.

---

### User Story 3 - Protected Route Access & Post-Login Redirection (Priority: P1)

A merchant navigates directly to a bookmarked dashboard URL (e.g., `/dashboard/products`) while unauthenticated. The system detects the missing session, redirects them to the login screen while preserving their intended destination, and automatically forwards them to that bookmarked page upon successful authentication.

**Why this priority**: Critical user experience and route security gate. Prevents unauthenticated access while eliminating friction when navigating from shared or bookmarked links.

**Independent Test**: Can be tested by opening `/dashboard/products` in an incognito window, confirming automatic redirection to `/auth/login?redirect=%2Fdashboard%2Fproducts`, logging in, and verifying the browser lands directly on `/dashboard/products`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they navigate to any protected route under `/_admin` or `/dashboard`, **Then** they are redirected to `/auth/login` with their target path encoded in the `redirect` query parameter.
2. **Given** a login initiated with a valid internal `redirect` parameter, **When** the merchant successfully authenticates, **Then** the system redirects them to the exact target path instead of the default dashboard home.
3. **Given** an unauthenticated visitor, **When** they navigate to public catalog routes (e.g., `/{store-slug}` or `/c/{slug}`), **Then** access is granted immediately without requiring authentication.

---

### User Story 4 - Password Recovery Flow (Priority: P2)

A merchant who has forgotten their password can request a secure reset link sent to their registered email, follow the link to a secure reset screen, and establish a new password.

**Why this priority**: Essential account self-service. Prevents merchant lockouts and reduces administrative support overhead.

**Independent Test**: Can be tested by submitting a registered email on `/auth/login` (forgot password modal), receiving the reset token, landing on `/auth/callback`, and successfully updating the password.

**Acceptance Scenarios**:

1. **Given** a merchant on the login screen, **When** they click "Forgot Password" and submit their email, **Then** a reset email is sent and a generic success message is displayed ("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.") regardless of whether the email exists, preventing account enumeration.
2. **Given** a valid password reset callback link, **When** the merchant opens it, **Then** they are prompted to set a new password of at least 6 characters.

---

### Edge Cases

- **Open Redirect Protection**: What happens if an attacker crafts a login link with an external `redirect` parameter (e.g., `?redirect=https://evil.com`)? The application MUST sanitize the redirect destination to ensure it is a relative internal path starting with `/`, falling back to `/dashboard` if external or malformed.
- **Session Token Expiration**: What happens when an access token expires while the merchant is active? The authentication client must automatically attempt silent token refresh using the refresh token. If refresh fails, it must transition gracefully to an unauthenticated state and prompt re-login.
- **Provider Rate Limiting**: What happens if a user triggers repeated login attempts or password reset emails? The system maps provider rate-limit errors to a polite Arabic warning ("تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.").
- **Network Failures**: What happens when authentication fails due to offline/connectivity issues? The client displays a friendly Arabic offline message ("تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.") without crashing.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a secure merchant registration interface supporting email and password authentication.
- **FR-002**: System MUST validate email format and enforce a minimum password length of 6 characters with immediate inline Arabic feedback.
- **FR-003**: System MUST provide a secure merchant login interface returning an authenticated session token upon successful validation.
- **FR-004**: System MUST translate all authentication errors from the underlying identity provider into clear, user-friendly Arabic messages.
- **FR-005**: System MUST persist the authenticated session securely in client browser storage and restore it automatically upon application load.
- **FR-006**: System MUST provide a safe "Sign Out" action that revokes active session credentials and clears all local authentication state.
- **FR-007**: System MUST intercept unauthenticated requests to protected administrative routes and redirect users to the login screen.
- **FR-008**: System MUST support a `redirect` query parameter to return merchants to their originally requested URL after successful authentication.
- **FR-009**: System MUST strictly validate that redirect URLs are internal application paths, completely preventing Open Redirect vulnerabilities.
- **FR-010**: System MUST provide a password recovery mechanism that dispatches reset instructions to the merchant's email.
- **FR-011**: System MUST prevent user enumeration during password reset requests by showing identical confirmation feedback for both existing and non-existing email addresses.
- **FR-012**: System MUST keep public catalog viewing completely unauthenticated, requiring zero customer accounts or login barriers.

---

### Key Entities

- **MerchantIdentity**: The core identity record managed by the identity provider. Attributes include: unique user identifier (`id` / UUID), email address, email confirmed status, created timestamp, and last sign-in timestamp.
- **AuthSession**: The active client session representation. Attributes include: access token (JWT), refresh token, expiration timestamp, and associated user identity.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new merchant can complete the registration form and receive verification feedback in under 30 seconds.
- **SC-002**: Returning merchants with valid saved sessions experience zero login interruption, with session restoration completing in under 100ms on application start.
- **SC-003**: 100% of authentication error states (invalid credentials, short passwords, rate limits, network drops) display user-friendly Arabic text.
- **SC-004**: Zero Open Redirect vulnerabilities: 100% of external or protocol-relative redirect attempts are neutralized and safely defaulted to internal paths.
- **SC-005**: Zero leakage of merchant-only administrative views to unauthenticated visitors.

---

## Assumptions & Boundaries

- **Identity Provider**: Authentication is handled via Supabase Auth (JWT).
- **Scope Boundary with TEN-001**: IDN-001 establishes *who the merchant is* (Identity). Authorization to access a specific store or business data is strictly governed by `TEN-001` (Tenant Authorization via RLS and `business_members`). An authenticated user with no associated business is handed off to the business onboarding flow (`BIZ-001`).
- **Single-Schema Database Principle**: Identity data resides in the managed `auth.users` schema. Application tables in `public` reference `auth.uid()` via foreign keys and RLS policies.
