export function handleRobotsTxt(): Response {
  const primaryDomain =
    process.env.VITE_PUBLIC_APP_URL || 'https://<my-name>.daleel-al-suez.com';

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
