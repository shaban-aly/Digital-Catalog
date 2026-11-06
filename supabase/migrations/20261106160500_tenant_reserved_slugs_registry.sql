-- Migration: 20261106160500_tenant_reserved_slugs_registry.sql
-- Feature: 002-dynamic-subdomains
-- Domain: Tenant (Business & Tenant Management)
-- Description: Creates the reserved_slugs registry table and seeds all protected
--              system, infrastructure, and protocol subdomains. Enables RLS with
--              public read-only access and no public write access.

-- ============================================================
-- Step 1: Create the reserved_slugs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reserved_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'system', -- 'system', 'infrastructure', 'security', 'future_use'
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reserved_slugs IS 'Immutable registry of reserved, protected, and system subdomains that can never be registered by any tenant.';
COMMENT ON COLUMN public.reserved_slugs.category IS 'Classification: system | infrastructure | security | future_use';

-- ============================================================
-- Step 2: Create a unique index on LOWER(slug) for fast DNS lookups
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_reserved_slugs_lower
  ON public.reserved_slugs (LOWER(slug));

-- ============================================================
-- Step 3: Enable Row Level Security
-- ============================================================
ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 4: RLS Policies - Public read, no public write
-- ============================================================
-- Allow anon and authenticated users to SELECT (needed for client-side slug validation)
CREATE POLICY "reserved_slugs_public_select"
  ON public.reserved_slugs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT / UPDATE / DELETE policies = write operations blocked for all public roles.
-- Only service_role (migrations, internal admin) can write.

-- ============================================================
-- Step 5: Seed Reserved Slugs
-- ============================================================
INSERT INTO public.reserved_slugs (slug, category, reason) VALUES
  -- Existing Infrastructure & Vercel Applications
  ('daleel-al-suez', 'infrastructure', 'Apex domain name representation'),
  ('www',            'infrastructure', 'Main website Vercel production alias'),
  ('tools',          'infrastructure', 'Independent tools application hosted on Vercel'),
  ('digitalmenu',    'infrastructure', 'Digital Catalog main platform Worker custom domain'),

  -- Core Platform System & Security
  ('admin',      'security', 'Future central administrative console'),
  ('api',        'security', 'Future centralized API gateway'),
  ('app',        'security', 'Generic platform application prefix'),
  ('auth',       'security', 'Authentication endpoints'),
  ('login',      'security', 'Login portal shortcut'),
  ('register',   'security', 'Registration portal shortcut'),
  ('dashboard',  'security', 'Merchant dashboard shortcut'),
  ('account',    'security', 'Account management'),
  ('billing',    'security', 'Subscription and payment gateway'),
  ('support',    'security', 'Customer support desk'),
  ('help',       'security', 'Knowledge base and documentation'),
  ('docs',       'security', 'API and developer documentation'),
  ('status',     'security', 'Platform status page'),

  -- Internet Standards & Protocols
  ('mail',         'system', 'Mail server MX / webmail'),
  ('webmail',      'system', 'Webmail access'),
  ('email',        'system', 'Email infrastructure'),
  ('smtp',         'system', 'SMTP gateway'),
  ('imap',         'system', 'IMAP gateway'),
  ('pop',          'system', 'POP3 gateway'),
  ('ftp',          'system', 'FTP service'),
  ('cpanel',       'system', 'Control panel access'),
  ('whm',          'system', 'Web host manager'),
  ('autodiscover', 'system', 'Microsoft Exchange autodiscover'),
  ('autoconfig',   'system', 'Mozilla Thunderbird autoconfig'),
  ('ns1',          'system', 'Nameserver 1'),
  ('ns2',          'system', 'Nameserver 2'),
  ('dns',          'system', 'DNS management'),

  -- Environment & Staging Keywords
  ('dev',     'future_use', 'Development staging environment'),
  ('staging', 'future_use', 'Staging preview environment'),
  ('test',    'future_use', 'Testing environment'),
  ('demo',    'future_use', 'Interactive platform demo'),
  ('cdn',     'future_use', 'Content delivery network'),
  ('static',  'future_use', 'Static asset host'),
  ('assets',  'future_use', 'Asset host binding'),
  ('media',   'future_use', 'Media storage proxy')

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Rollback Reference (DO NOT RUN IN PRODUCTION WITHOUT REVIEW)
-- ============================================================
-- DROP TABLE IF EXISTS public.reserved_slugs;
