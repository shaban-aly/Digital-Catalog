import { RESERVED_SLUGS } from './reserved-slugs.ts';

/** RFC 1123 label regex: lowercase a-z, 0-9, hyphens; no leading/trailing/double hyphens */
const RFC1123_LABEL_RE = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

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

/**
 * Lightweight edge hostname resolver for multi-tenant subdomain routing.
 * Runs at the Cloudflare Worker edge with zero external I/O.
 *
 * Resolution logic:
 * 1. Normalize host (lowercase, strip trailing dot and port).
 * 2. If host equals platformHost, localhost, 127.0.0.1, or *.workers.dev → isPlatformRoot.
 * 3. If host does NOT end with `.baseDomain` → not a recognized subdomain.
 * 4. Extract the single subdomain label. Multi-level subdomains → isReserved.
 * 5. If label is in RESERVED_SLUGS → isReserved.
 * 6. If label fails RFC 1123 format → not a tenant subdomain.
 * 7. Otherwise → isTenantSubdomain with tenantSlug set.
 */
export class TenantResolver {
  private readonly platformHost: string;
  private readonly tenantBaseDomain: string;
  private readonly apexBaseDomain: string;

  constructor(
    tenantBaseDomain = 'digitalmenu.daleel-al-suez.com',
    platformHost = 'digitalmenu.daleel-al-suez.com',
    apexBaseDomain = 'daleel-al-suez.com',
  ) {
    this.tenantBaseDomain = tenantBaseDomain.toLowerCase();
    this.platformHost = platformHost.toLowerCase();
    this.apexBaseDomain = apexBaseDomain.toLowerCase();
  }

  resolve(url: URL): TenantResolutionResult {
    // Strip port and normalize to lowercase, remove trailing dot
    const host = (url.hostname ?? '')
      .toLowerCase()
      .replace(/\.$/, '');

    // Platform root: main app host, local dev, or Cloudflare default workers.dev URL
    if (
      host === this.platformHost ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.workers.dev')
    ) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: true,
        isReserved: false,
        normalizedHost: host,
      };
    }

    let subpart: string | null = null;

    // Pattern 1 (Target Platform Wildcard): {slug}.digitalmenu.daleel-al-suez.com
    const platformSuffix = `.${this.tenantBaseDomain}`;
    if (host.endsWith(platformSuffix)) {
      subpart = host.slice(0, -(platformSuffix.length));
    }
    // Pattern 2 (Optional direct apex wildcard if ever routed): {slug}.daleel-al-suez.com
    else {
      const apexSuffix = `.${this.apexBaseDomain}`;
      if (host.endsWith(apexSuffix)) {
        const potential = host.slice(0, -(apexSuffix.length));
        if (!potential.includes('.')) {
          subpart = potential;
        }
      }
    }

    // If not matching any valid tenant domain suffix
    if (!subpart) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: false,
        normalizedHost: host,
      };
    }

    // Reject multi-level subdomains (e.g. a.b.digitalmenu.daleel-al-suez.com)
    if (subpart.includes('.')) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: true,
        normalizedHost: host,
      };
    }

    // Check against reserved slug registry
    if (RESERVED_SLUGS.has(subpart)) {
      return {
        isTenantSubdomain: false,
        tenantSlug: subpart,
        isPlatformRoot: false,
        isReserved: true,
        normalizedHost: host,
      };
    }

    // Validate RFC 1123 label format (no double hyphens, 3-63 chars)
    const isValidFormat =
      RFC1123_LABEL_RE.test(subpart) &&
      !subpart.includes('--') &&
      subpart.length >= 3 &&
      subpart.length <= 63;

    if (!isValidFormat) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: false,
        normalizedHost: host,
      };
    }

    return {
      isTenantSubdomain: true,
      tenantSlug: subpart,
      isPlatformRoot: false,
      isReserved: false,
      normalizedHost: host,
    };
  }
}

/** Singleton instance for use in entry-worker.ts */
export const tenantResolver = new TenantResolver();

