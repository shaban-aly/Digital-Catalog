import { supabase } from '../db/supabase';

export async function handleSitemapXml(): Promise<Response> {
  const primaryDomain =
    process.env.VITE_PUBLIC_APP_URL || 'https://digitalmenu.daleel-al-suez.com';

  const { data: catalogs } = await supabase
    .from('catalogs')
    .select('slug, created_at')
    .eq('is_published', true);

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

  // Published Catalogs
  if (catalogs) {
    for (const cat of catalogs) {
      xml += `  <url>\n`;
      xml += `    <loc>${primaryDomain}/c/${cat.slug}</loc>\n`;
      xml += `    <lastmod>${cat.created_at ? cat.created_at.split('T')[0] : today}</lastmod>\n`;
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
