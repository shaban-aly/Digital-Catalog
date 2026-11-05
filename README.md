# ديجيتال منيو | Digital Menu

منصة المنيو الإلكتروني وقوائم الأسعار التفاعلية ورموز الـ QR الدائمة للمطاعم، الكافيهات، والأنشطة التجارية في مصر (دليل السويس).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Edge Runtime: Cloudflare Workers](https://img.shields.io/badge/Edge%20Runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Database: Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20Postgres-emerald)](https://supabase.com/)
[![Framework: React 19 + TanStack Start](https://img.shields.io/badge/Framework-React%2019%20%2B%20TanStack%20Start-cyan)](https://tanstack.com/start)

---

## 🌐 النطاق الرسمي والموقع الحي
- **المنصة:** [https://digitalmenu.daleel-al-suez.com](https://digitalmenu.daleel-al-suez.com)
- **العملة المعتمدة:** الجنيه المصري (`EGP` / `ج.م`)
- **النموذج الاقتصادي:** مجاني 100% مدى الحياة بدون عمولات (Free-First Architecture)

---

## 🚀 المميزات الرئيسية

1. **رمز QR ذكي ودائم (Permanent Dynamic QR):**
   - رمز QR مطبوع واحد يظل ثابتاً ولا يتغير أبداً حتى لو تغيرت الروابط أو الأصناف أو الأسعار.
   - تحويل فوري فائق السرعة عبر الحافة (`HTTP 302 Redirect` في أقل من 50 مللي ثانية).

2. **تصيير فائق السرعة على الحافة (Edge SSR):**
   - مبني بتقنية Server-Side Rendering على **Cloudflare Workers** لتوفير أسرع تحميل للمستهلكين عبر شبكات الهاتف المحمول (3G/4G) بأقل من 1.2 ثانية.
   - حماية كاملة لحد الاستهلاك المجاني بواسطة شبكة التوزيع (Cloudflare CDN Caching).

3. **الطلب المباشر عبر واتساب (WhatsApp Conversion):**
   - بنقرة واحدة من دروج تفاصيل الصنف، يتم فتح محادثة واتساب موجهة لرقم المتجر مع رسالة مهيكلة بالاسم، الحجم، الإضافات، وإجمالي السعر بدقة.

4. **ضغط الصور الذكي بالمتصفح (Client-side WebP Compression):**
   - تحويل وضغط صور المنتجات إلى صيغة WebP فائقة الجودة بحجم أقل من 100 كيلوبايت داخل متصفح التاجر قبل الرفع، لتوفير مساحة التخزين وسرعة التصفح.

5. **أمان صارم وتعددية مستأجرين (PostgreSQL RLS):**
   - حماية وعزل بيانات كل تاجر على مستوى قاعدة البيانات باستخدام Row Level Security (RLS)، ومفتاح الخدمة السري محظور تماماً من المتصفح.

6. **إحصائيات آمنة للخصوصية (Privacy-Safe Analytics):**
   - تسجيل المسحات والزيارات بدون تخزين عناوين الـ IP الصريحة نهائياً، مع استخدام بصمات مشفرة متغيرة يومياً (Daily Salted SHA-256) وفلترة روبوتات المعاينة ومحركات البحث.

---

## 🛠️ البنية التقنية (Tech Stack)

- **Frontend & SSR:** React 19, TypeScript, TanStack Start (Router, Query, Form, Table)
- **Styling:** Tailwind CSS v4, Cairo Font (RTL-First), Lucide Icons
- **Edge Deployment:** Cloudflare Workers via `@cloudflare/vite-plugin` و `wrangler`
- **Backend & Database:** Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage)
- **Image Handling:** HTML5 Canvas WebP Compressor + Cloudflare Edge Proxy

---

## 💻 التشغيل المحلي (Local Development)

### المتطلبات المسبقة:
- Node.js 20+ (LTS)
- npm / pnpm

### الخطوات:

1. **استنساخ المستودع:**
   ```bash
   git clone https://github.com/shaban-aly/Digital-Catalog.git
   cd Digital-Catalog
   ```

2. **تثبيت الحزم:**
   ```bash
   npm install
   ```

3. **إعداد المتغيرات البيئية:**
   أنشئ ملف `.env.local` وضع فيه إعدادات Supabase الخاصة بك:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_service_role_key
   VITE_PUBLIC_APP_URL=http://localhost:5173/
   ```

4. **تشغيل خادم التطوير:**
   ```bash
   npm run dev
   ```
   افتح المتصفح على [http://localhost:5173](http://localhost:5173).

5. **بناء نسخة الإنتاج:**
   ```bash
   npm run build
   ```

6. **فحص النشر على Cloudflare:**
   ```bash
   npx wrangler deploy --dry-run
   ```

---

## 📄 الترخيص
هذا المشروع مرخص تحت رخصة **MIT**. جميع الحقوق محفوظة لـ **دليل السويس** © 2026.
