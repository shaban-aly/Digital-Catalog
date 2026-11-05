import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router';
import '@/client/styles/globals.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      {
        title: 'دليل السويس - منصة الكتالوج الرقمي وقوائم الأسعار',
      },
      {
        name: 'description',
        content: 'المنصة الرقمية الأولى لإنشاء وإدارة الكتالوجات وقوائم الأسعار الرقمية ورموز QR للمتاجر والمطاعم.',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
