import { createFileRoute, redirect, notFound } from '@tanstack/react-router';
import { qrService } from '@/server/services/qr';
import { logQrScanEvent } from '@/server/services/analytics';

export const Route = createFileRoute('/_public/q/$shortCode')({
  loader: async ({ params }) => {
    const result = await qrService.resolveDestination(params.shortCode);

    if (!result) {
      throw notFound();
    }

    const { destinationUrl, qrId } = result;

    // Fire analytics asynchronously without blocking redirect
    logQrScanEvent({
      qrCodeId: qrId,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/TestClient',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    }).catch(() => {});

    // Fast 302 redirect
    throw redirect({
      href: destinationUrl,
      statusCode: 302,
    });
  },
  component: QRRedirectComponent,
});

function QRRedirectComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-center p-6">
      <div className="space-y-3">
        <div className="w-10 h-10 border-4 border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-base font-semibold text-[var(--text-primary)]">جاري توجيهك إلى الكتالوج...</p>
      </div>
    </div>
  );
}
