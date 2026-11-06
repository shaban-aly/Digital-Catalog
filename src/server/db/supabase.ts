import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.VITE_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://opgiyqxsthrxzrbgupso.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_OuQQLYO9FpiIiWrMyyXeTg_nnuzQ0xL';

const hasCredentials = Boolean(
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
  (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)
);

if (!hasCredentials) {
  // Helpful development warning if credentials have not been configured yet
  console.warn(
    '[SupabaseClient] Warning: VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY is not set. Ensure your .env file is populated.'
  );
}

/**
 * Global Stateless Supabase Client
 * Communicates via PostgREST over HTTPS, guaranteeing zero TCP connection leaks
 * in serverless and edge Cloudflare Worker environments.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'digital-catalog-app',
    },
  },
});

/**
 * Creates an authenticated Supabase client for Server Functions using the caller's JWT.
 * Inherits all PostgreSQL Row Level Security (RLS) policies directly from auth.uid().
 */
export function createAuthenticatedClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
            'x-application-name': 'digital-catalog-app',
          }
        : {
            'x-application-name': 'digital-catalog-app',
          },
    },
  });
}
