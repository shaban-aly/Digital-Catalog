/**
 * Beautiful, lightweight Arabic error pages rendered directly at the edge
 * when a tenant subdomain cannot be resolved or is in an inactive state.
 */

function baseLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ديجيتال منيو</title>
  <style>
    :root {
      --primary: #047857;
      --primary-hover: #065f46;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1.25rem;
      line-height: 1;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 0.75rem;
    }
    p {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.75rem;
    }
    .btn {
      display: inline-block;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover { background: var(--primary-hover); }
    .footer {
      margin-top: 2rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      padding-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    ${bodyContent}
    <div class="footer">
      منصة ديجيتال منيو &bull; دليل السويس
    </div>
  </div>
</body>
</html>`;
}

export const tenantErrorPages = {
  notFound(tenantSlug: string): Response {
    const html = baseLayout(
      'المتجر غير موجود',
      `
      <div class="icon">🔍</div>
      <h1>عفواً، المتجر غير موجود</h1>
      <p>
        لم نتمكن من العثور على أي قائمة أسعار أو متجر مسجل بالرابط:
        <br><strong dir="ltr" style="color: #047857; font-size: 1.05rem;">${tenantSlug}.daleel-al-suez.com</strong>
      </p>
      <a href="https://digitalmenu.daleel-al-suez.com/auth/register" class="btn">
        سجل هذا النطاق وأنشئ متجرك مجاناً
      </a>
      `
    );
    return new Response(html, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  },

  unpublished(tenantSlug: string): Response {
    const html = baseLayout(
      'القائمة قيد التجهيز',
      `
      <div class="icon">🚧</div>
      <h1>هذه القائمة قيد التجهيز حالياً</h1>
      <p>
        متجر <strong>${tenantSlug}</strong> لم يقم بنشر قائمته بعد أو أنه يجري بعض التحديثات. يرجى مراجعة الرابط لاحقاً.
      </p>
      <a href="https://digitalmenu.daleel-al-suez.com" class="btn">
        الذهاب إلى ديجيتال منيو
      </a>
      `
    );
    return new Response(html, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  },

  suspended(tenantSlug: string): Response {
    const html = baseLayout(
      'المتجر معطل مؤقتاً',
      `
      <div class="icon">⚠️</div>
      <h1>هذا الحساب معطل مؤقتاً</h1>
      <p>
        تم تعليق الوصول إلى متجر <strong>${tenantSlug}</strong> مؤقتاً. إذا كنت صاحب هذا المتجر، يرجى تسجيل الدخول إلى لوحة التحكم أو التواصل مع الدعم الفني.
      </p>
      <a href="https://digitalmenu.daleel-al-suez.com/auth/login" class="btn">
        تسجيل الدخول إلى لوحة الإدارة
      </a>
      `
    );
    return new Response(html, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  },

  reserved(): Response {
    const html = baseLayout(
      'نطاق مخصص',
      `
      <div class="icon">🔒</div>
      <h1>نطاق نظام محجوز</h1>
      <p>
        هذا النطاق الفرعي محجوز لخدمات النظام والبنية التحتية لمنصة ديجيتال منيو ولا يمكن استخدامه كمتجر.
      </p>
      <a href="https://digitalmenu.daleel-al-suez.com" class="btn">
        العودة إلى الصفحة الرئيسية
      </a>
      `
    );
    return new Response(html, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  },
};
