import { supabase } from '../db/supabase.ts';

export async function handleSitemapXml(): Promise<Response> {
  const primaryDomain =
    (typeof process !== 'undefined' ? process?.env?.VITE_PUBLIC_APP_URL : undefined) ||
    'https://digitalmenu.daleel-al-suez.com';

  const { data: catalogs } = await supabase
    .from('catalogs')
    .select(`
      slug,
      created_at,
      business:businesses!inner (
        slug,
        status
      )
    `)
    .eq('is_published', true)
    .eq('business.status', 'active');

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${primaryDomain}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Published Active Catalogs with Subdomain Canonical URLs
  if (catalogs) {
    for (const cat of catalogs) {
      const bSlug = (cat.business as any)?.slug;
      const storeUrl = bSlug
        ? `https://${bSlug}.digitalmenu.daleel-al-suez.com/`
        : `${primaryDomain}/c/${cat.slug}`;
      const lastModDate = cat.created_at ? cat.created_at.split('T')[0] : today;

      xml += `  <url>\n`;
      xml += `    <loc>${storeUrl}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
