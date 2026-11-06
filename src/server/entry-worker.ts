import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { handleQrRedirect } from './routes/q.$shortCode';
import { handleRobotsTxt } from './routes/robots.txt';
import { handleSitemapXml } from './routes/sitemap.xml';

const fetchHandler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, _env: Record<string, any>, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Ultra-fast QR 302 redirect route (<50ms, non-blocking analytics)
    const qrMatch = url.pathname.match(/^\/q\/([a-zA-Z0-9_-]+)$/);
    if (qrMatch) {
      return handleQrRedirect(request, qrMatch[1], ctx);
    }

    // 2. SEO Robots.txt
    if (url.pathname === '/robots.txt') {
      return handleRobotsTxt();
    }

    // 3. Dynamic Sitemap.xml
    if (url.pathname === '/sitemap.xml') {
      return handleSitemapXml();
    }

    // 4. Image CDN Edge Caching proxy for Supabase Storage (protects Free Tier egress)
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

    // 5. Static Assets fallback (guarantees CSS/JS are served directly with correct MIME)
    if ((url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) && _env?.ASSETS) {
      const asset = await _env.ASSETS.fetch(request);
      if (asset.status < 400) {
        return asset;
      }
    }

    // 6. TanStack Start SSR & App
    return fetchHandler(request);
  },
};
