/**
 * Reserved slugs: subdomains that can never be registered by any tenant.
 * This list MUST stay in sync with the `reserved_slugs` DB table seed in:
 * supabase/migrations/20261106160500_tenant_reserved_slugs_registry.sql
 */
export const RESERVED_SLUGS = new Set<string>([
  // Existing Infrastructure & Vercel Applications
  'daleel-al-suez',
  'www',
  'tools',
  'digitalmenu',

  // Core Platform System & Security
  'admin',
  'api',
  'app',
  'auth',
  'login',
  'register',
  'dashboard',
  'account',
  'billing',
  'support',
  'help',
  'docs',
  'status',

  // Internet Standards & Protocols
  'mail',
  'webmail',
  'email',
  'smtp',
  'imap',
  'pop',
  'ftp',
  'cpanel',
  'whm',
  'autodiscover',
  'autoconfig',
  'ns1',
  'ns2',
  'dns',

  // Environment & Staging Keywords
  'dev',
  'staging',
  'test',
  'demo',
  'cdn',
  'static',
  'assets',
  'media',
]);

