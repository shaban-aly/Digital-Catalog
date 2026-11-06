import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { handleQrRedirect } from './routes/q.$shortCode';
import { handleRobotsTxt } from './routes/robots.txt';
import { handleSitemapXml } from './routes/sitemap.xml';
import { tenantResolver } from './tenant/resolver';
import { tenantErrorPages } from './tenant/error-pages';

const fetchHandler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, _env: Record<string, any>, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 0. Static Assets fallback (guarantees CSS/JS are served directly with correct MIME)
    if ((url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) && _env?.ASSETS) {
      const asset = await _env.ASSETS.fetch(request);
      if (asset.status < 400) {
        return asset;
      }
    }

    // 1. Dynamic Tenant Subdomain Resolution
    const tenantResult = tenantResolver.resolve(url);

    // If accessing a reserved system/infra slug directly on worker, return 404
    if (tenantResult.isReserved) {
      return tenantErrorPages.reserved();
    }

    // If incoming request is for a merchant subdomain (e.g., ahmed-cafe.daleel-al-suez.com)
    if (tenantResult.isTenantSubdomain && tenantResult.tenantSlug) {
      const slug = tenantResult.tenantSlug;

      // Prevent accessing admin dashboard or auth directly on a merchant subdomain -> redirect to central platform
      if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/auth')) {
        const platformDestination = new URL(url.pathname + url.search, 'https://digitalmenu.daleel-al-suez.com');
        return Response.redirect(platformDestination.toString(), 302);
      }

      // Root path '/' on a merchant subdomain internally rewrites to the merchant's catalog '/c/:slug'
      if (url.pathname === '/' || url.pathname === '') {
        const rewrittenUrl = new URL(`/c/${slug}${url.search}`, request.url);
        const rewrittenRequest = new Request(rewrittenUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: request.redirect,
        });
        return fetchHandler(rewrittenRequest);
      }
    }

    // 2. Ultra-fast QR 302 redirect route (<50ms, non-blocking analytics)
    const qrMatch = url.pathname.match(/^\/q\/([a-zA-Z0-9_-]+)$/);
    if (qrMatch) {
      return handleQrRedirect(request, qrMatch[1], ctx);
    }

    // 3. SEO Robots.txt
    if (url.pathname === '/robots.txt') {
      return handleRobotsTxt();
    }

    // 4. Dynamic Sitemap.xml
    if (url.pathname === '/sitemap.xml') {
      return handleSitemapXml();
    }

    // 5. Image CDN Edge Caching proxy for Supabase Storage (protects Free Tier egress)
    if (url.pathname.startsWith('/storage/v1/object/public/')) {
      const supabaseUrl =
        _env?.VITE_PUBLIC_SUPABASE_URL ||
        'https://opgiyqxsthrxzrbgupso.supabase.co';
      const targetUrl = `${supabaseUrl}${url.pathname}${url.search}`;
      const response = await fetch(targetUrl);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=2592000, immutable');
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    // 6. TanStack Start SSR & App
    return fetchHandler(request);
  },
};
