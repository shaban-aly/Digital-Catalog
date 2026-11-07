import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router';
import { AuthProvider } from '@/client/hooks/use-auth';
import { DialogProvider } from '@/client/components/ui/Dialog';
import appCss from '@/client/styles/globals.css?url';

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
        title: 'ديجيتال منيو (Digital Menu) - منصة المنيو الإلكتروني وقوائم الأسعار',
      },
      {
        name: 'description',
        content: 'المنصة الرقمية لإنشاء وإدارة المنيو الرقمي وقوائم الأسعار ورموز QR الذكية للمطاعم والكافيهات والمتاجر - دليل السويس.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
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
        className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
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
        <AuthProvider>
          <DialogProvider>
            <Outlet />
          </DialogProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
