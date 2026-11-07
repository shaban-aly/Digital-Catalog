/**
 * Open Redirect Protection Utility
 * 
 * Ensures unvalidated redirect query parameters (?redirect=...) cannot be manipulated
 * to hijack merchant navigation to external or malicious origins.
 */

/**
 * Sanitizes an incoming redirect path.
 * 
 * Rules:
 * 1. Must be a non-empty string.
 * 2. Must start with a single '/' (relative application path).
 * 3. Must NOT start with '//' (protocol-relative URL, e.g. //evil.com).
 * 4. Must NOT contain backslashes ('\') which some browsers normalize to '/'.
 * 5. Must NOT contain colons (':') preventing URI schemes like 'javascript:', 'https:', 'data:'.
 * 
 * @param rawRedirect The unvalidated redirect string from search parameters
 * @param fallback Safe default destination (defaults to '/dashboard')
 * @returns A safe relative path
 */
export function sanitizeRedirectUrl(rawRedirect: string | null | undefined, fallback = '/dashboard'): string {
  if (!rawRedirect || typeof rawRedirect !== 'string') {
    return fallback;
  }

  const trimmed = rawRedirect.trim();

  // Enforce single leading slash and reject protocol-relative '//', backslash, or URI schemes
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes(':')
  ) {
    return fallback;
  }

  return trimmed;
}

