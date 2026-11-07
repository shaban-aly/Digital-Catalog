import { qrService } from '../services/qr.ts';
import { logQrScanEvent } from '../services/analytics.ts';

/**
 * Cloudflare Worker Fast 302 QR Redirect Route
 * Resolves short code and returns an immediate 302 redirect in <50ms
 * Analytics logging is dispatched in the background without blocking the client.
 */
export async function handleQrRedirect(request: Request, shortCode: string, ctx?: any): Promise<Response> {
  const result = await qrService.resolveDestination(shortCode);

  if (!result) {
    return new Response(
      `<!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"><title>رمز QR غير متاح</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8fafc;">
          <h2>رمز الاستجابة السريعة (QR) غير متاح أو تم إيقافه</h2>
          <p>يرجى التأكد من مسح الرمز الصحيح أو التواصل مع إدارة المتجر.</p>
        </body>
      </html>`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  const { destinationUrl, qrId } = result;

  // Extract client metadata for asynchronous analytics
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer');

  // Background non-blocking execution via Worker ExecutionContext
  const analyticsPromise = logQrScanEvent({
    qrCodeId: qrId,
    ipAddress: clientIp,
    userAgent,
    referrer,
  });

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(analyticsPromise);
  } else {
    // Fire-and-forget in environments without waitUntil
    analyticsPromise.catch(() => {});
  }

  // Return immediate 302 redirect with zero caching (so scans are always counted)
  return new Response(null, {
    status: 302,
    headers: {
      Location: destinationUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
