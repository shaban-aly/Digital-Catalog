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
  notFoundComponent: NotFoundComponent,
  component: RootComponent,
});

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-app)]">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 text-2xl font-black">
        404
      </div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">الصفحة غير موجودة</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
        عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.
      </p>
      <a
        href="/"
        className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
      >
        العودة للرئيسية
      </a>
    </div>
  );
}

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
