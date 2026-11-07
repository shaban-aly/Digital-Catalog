export function handleRobotsTxt(): Response {
  const primaryDomain =
    (typeof process !== 'undefined' ? process?.env?.VITE_PUBLIC_APP_URL : undefined) ||
    'https://digitalmenu.daleel-al-suez.com';

  const content = `User-agent: *
Allow: /
Allow: /c/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /q/

Sitemap: ${primaryDomain}/sitemap.xml
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  });
}
