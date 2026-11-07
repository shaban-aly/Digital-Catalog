/**
 * Interface Contracts: Platform Subdomains and Hostname Resolution (DOM-001)
 */

export interface TenantResolutionResult {
  /** True when the host is a tenant business subdomain (not platform root, not reserved) */
  isTenantSubdomain: boolean;
  /** The extracted subdomain label (lowercase), or null if not a tenant subdomain */
  tenantSlug: string | null;
  /** True when the host is the main platform domain (digitalmenu.*, localhost, workers.dev) */
  isPlatformRoot: boolean;
  /** True when the subdomain is in the reserved list or is a multi-level subdomain */
  isReserved: boolean;
  /** The normalized (lowercase, no trailing dot) hostname */
  normalizedHost: string;
}

export interface ITenantResolver {
  resolve(url: URL): TenantResolutionResult;
}

export interface SlugValidationResult {
  valid: boolean;
  slug: string;
  error?: string;
  isReserved?: boolean;
  isTaken?: boolean;
}
