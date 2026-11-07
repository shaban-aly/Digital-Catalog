import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  QrCode,
  Smartphone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Store,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/client/hooks/use-auth';
import { Button } from '@/client/components/ui/Button';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const SUPPORT_WHATSAPP_NUMBER = '201012345678';
const SUPPORT_WHATSAPP_MESSAGE = encodeURIComponent(
  'مرحباً إدارة ديجيتال منيو، أرغب في الاستفسار عن إنشاء منيو إلكتروني لمتجري.'
);
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${SUPPORT_WHATSAPP_MESSAGE}`;

export function HomePage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mockupCategory, setMockupCategory] = useState<'grills' | 'sandwiches' | 'drinks' | 'appetizers'>('grills');

  const toggleFaq = (idx: number) => {
    setActiveFaq((prev) => (prev === idx ? null : idx));
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 py-2.5 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="min-h-[44px] inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-[var(--radius-sm)]"
            aria-label="ديجيتال منيو - الصفحة الرئيسية"
          >
            <div
              className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-base shadow-xs select-none"
              aria-hidden="true"
            >
              M
            </div>
            <div className="flex flex-col text-right">
              <span className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
                ديجيتال منيو
              </span>
              <span className="text-xs text-[var(--text-muted)] font-semibold -mt-0.5">
                دليل السويس | منصة القوائم الذكية
              </span>
            </div>
          </Link>

          {/* Navigation Actions */}
          <nav aria-label="التنقل الرئيسي" className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard">
                <Button size="md" className="gap-2 font-bold min-h-[44px]">
                  <LayoutDashboard size={15} aria-hidden="true" />
                  <span>لوحة إدارة المتجر</span>
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    size="md"
                    className="min-h-[44px] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="md" className="min-h-[44px] text-xs font-bold px-4">
                    ابدأ الآن
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="px-4 pt-10 pb-12 sm:pt-16 sm:pb-20 max-w-4xl mx-auto text-center space-y-6">
          {/* Trust & Guarantee Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            <span>منصة المنيو الإلكتروني الذكي للتجار وأصحاب المطاعم</span>
          </div>

          {/* Core Value Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-[1.3] sm:leading-[1.25] tracking-tight">
            المنيو الإلكتروني وقائمة أسعارك
            <br />
            <span className="text-[var(--text-secondary)]">برمز QR واحد دائم</span> لا يتغير أبداً
          </h1>

          {/* Persuasive Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            انقل مطعمك أو متجرك إلى العصر الرقمي في دقائق معدودة. اطبع رمز QR على طاولاتك أو واجهة محلك،
            ودع زبائنك يتصفحون الأصناف والأسعار فوراً ويرسلون طلباتهم مباشرة إلى WhatsApp متجرك بدون أي
            تطبيقات أو عمولات مبيعات.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 gap-2.5 font-bold shadow-sm min-h-[48px]"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>الذهاب إلى لوحة إدارة متجرك</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 gap-2.5 font-bold shadow-sm min-h-[48px]"
                  >
                    <span>ابدأ تجهيز منيو متجرك</span>
                    <ArrowRight
                      className="w-4 h-4 rtl:rotate-180 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </Link>
                <a href="#live-preview" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-6 gap-2 font-bold min-h-[48px]"
                  >
                    <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>شاهد نموذجاً حياً للمنيو</span>
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Strategic Benefit Chips */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0" aria-hidden="true" />
              <span>باقة انطلاق لتجربة متجرك بدون بطاقة بنكية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0" aria-hidden="true" />
              <span>سرعة فائقة حتى على أضعف باقة إنترنت</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0" aria-hidden="true" />
              <span>لا يتطلب من الزبون تثبيت أي تطبيق</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0" aria-hidden="true" />
              <span>عدّل الأسعار في أي وقت والرمز ثابت</span>
            </div>
          </div>
        </section>

        {/* Live Visual Showcase: Mobile Menu Mockup & Printed QR Stand */}
        <section
          id="live-preview"
          className="px-4 py-12 bg-white border-y border-[var(--border-subtle)] scroll-mt-16"
        >
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                هكذا يرى زبائنك منيو متجرك على هواتفهم
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                واجهة أنيقة فائقة السرعة، مصممة خصيصاً للقراءة السلسة بيد واحدة وإرسال الطلبات مباشرة
                إلى رقم WhatsApp الخاص بك بنقرة واحدة.
              </p>
            </div>

            {/* Visual Interactive Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left/Main Column: Phone Mockup Container */}
              <div className="md:col-span-7 flex justify-center">
                <div
                  role="region"
                  aria-label="معاينة حية لكتالوج المتجر على الهاتف المحمول"
                  className="w-full max-w-sm rounded-[2.5rem] p-3 bg-[var(--primary)] shadow-2xl border-4 border-slate-800"
                >
                  {/* Phone Screen Inner Container */}
                  <div className="bg-[var(--bg-app)] rounded-[2rem] overflow-hidden text-right border border-[var(--border-subtle)] text-[var(--text-primary)]">
                    {/* Simulated Store Header */}
                    <div className="bg-white p-4 border-b border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[var(--badge-avail)] border border-emerald-200">
                          مفتوح ويستقبل الطلبات
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]" dir="ltr">
                          almisriu.digitalmenu...
                        </span>
                      </div>
                      <h3 className="font-black text-base text-[var(--text-primary)]">
                        مطعم ومشويات المصري
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        مشويات على الفحم، طواجن مصرية، وسندوتشات • السويس
                      </p>
                    </div>

                    {/* Simulated Category Pills */}
                    <div className="flex items-center gap-1.5 p-2.5 bg-white/50 border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setMockupCategory('grills')}
                        className={`px-3 py-1 rounded-full transition-colors shrink-0 select-none ${mockupCategory === 'grills'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        مشويات وطواجن
                      </button>
                      <button
                        type="button"
                        onClick={() => setMockupCategory('sandwiches')}
                        className={`px-3 py-1 rounded-full transition-colors shrink-0 select-none ${mockupCategory === 'sandwiches'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        سندوتشات
                      </button>
                      <button
                        type="button"
                        onClick={() => setMockupCategory('drinks')}
                        className={`px-3 py-1 rounded-full transition-colors shrink-0 select-none ${mockupCategory === 'drinks'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        مشروبات
                      </button>
                      <button
                        type="button"
                        onClick={() => setMockupCategory('appetizers')}
                        className={`px-3 py-1 rounded-full transition-colors shrink-0 select-none ${mockupCategory === 'appetizers'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        مقبلات
                      </button>
                    </div>

                    {/* Simulated Menu Items */}
                    <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto">
                      {mockupCategory === 'grills' && (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                كيلو كباب وكفتة مشوية على الفحم
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                لحم بلدي طازج مع طحينة، سلطة خضراء، وخبز بلدي
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٤٨٠ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                طاجن عكاوي بالبصل والموزة
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                مطبوخ على نار هادئة مع بهارات الشيف الخاصة
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٢٤٠ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                        </>
                      )}

                      {mockupCategory === 'sandwiches' && (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                ساندوتش كفتة بلدي طحينة
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                رغيف بلدي ساخن مع سلطة وطحينة سمسم فاخرة
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٥٥ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                حواوشي لحمة بلدي على الفحم
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                مقرمش ومتبل بالخلطة السويسية الحارة
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٦٥ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                        </>
                      )}

                      {mockupCategory === 'drinks' && (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                عصير مانجو إسمعلاوي طازج
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                طبيعي 100% بدون سكر مضاف
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٤٥ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                ليمون نعناع فريش مثلج
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                منعش ومحضر فور الطلب مع مكعبات ثلج
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٣٠ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                        </>
                      )}

                      {mockupCategory === 'appetizers' && (
                        <>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                طبق مقبلات مشكل فاخر
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                طحينة بيضاء، بابا غنوج، ثومية، ومخلل بلدي
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٤٠ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] shadow-xs flex items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-bold text-xs text-[var(--text-primary)]">
                                بطاطس محمرة مع توابل شرقية
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                                ذهبية ومقرمشة مع بهارات الشيف
                              </p>
                              <div className="text-xs font-black text-[var(--text-primary)] pt-0.5">
                                ٣٠ ج.م
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-slate-400">
                              <Utensils size={20} aria-hidden="true" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Simulated Floating WhatsApp Bar (One-Voice Rule Protected) */}
                    <div className="p-3 bg-white border-t border-[var(--border-subtle)] shadow-md">
                      <div className="p-2.5 rounded-xl bg-[var(--whatsapp-green)] text-white flex items-center justify-between font-bold text-xs shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={16} aria-hidden="true" />
                          <span>إرسال الطلب عبر WhatsApp</span>
                        </div>
                        <span className="font-extrabold" dir="ltr">
                          ٧٦٥ ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Physical QR Stand Preview & Explanation */}
              <div className="md:col-span-5 space-y-6 text-right">
                <div className="p-6 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-xs">
                    <QrCode className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                    رمز QR ثابت ومطبوع لا يحتاج لتغيير
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    اطبع رمز الاستجابة السريعة مرة واحدة وضعه على طاولات الصالة، أو على استاند الأكريليك
                    عند الكاشير، أو اطبعه على كروت الدعاية والملصقات.
                  </p>
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-start gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                      <Check className="w-4 h-4 text-[var(--text-primary)] mt-0.5 shrink-0" aria-hidden="true" />
                      <span>إذا تغيرت أسعارك غداً، عدلها من هاتفك فوراً ويبقى نفس الرمز المطبوع شغالاً.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                      <Check className="w-4 h-4 text-[var(--text-primary)] mt-0.5 shrink-0" aria-hidden="true" />
                      <span>لا يحتاج الزبون لكتابة رابط ولا تثبيت برامج، الكاميرا تفتح المنيو فوراً.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-700 shrink-0" aria-hidden="true" />
                    <span>توفير حقيقي في تكاليف الطباعة</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    ودّع مصاريف إعادة طباعة المنيو الورقي مع كل تحديث في أسعار الخامات أو إضافة أطباق جديدة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Simple How It Works Section */}
        <section className="px-4 py-14 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              كيف يعمل ديجيتال منيو في ٣ خطوات بسيطة؟
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              خطوات سريعة تجعلك جاهزاً لاستقبال أول زبون خلال أقل من ٥ دقائق
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--border-subtle)] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">
                ١
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                سجل متجرك واختر رابطك
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                أنشئ حسابك في ثوانٍ وأدخل اسم متجرك ورقم WhatsApp المخصص لاستقبال الطلبات، وسننشئ لك رابطاً
                خاصاً فوراً.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--border-subtle)] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">
                ٢
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                أضف أقسامك وأسعارك
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                أدخل أصنافك مع الصور والأسعار وتفاصيل الأحجام أو الإضافات بسهولة من هاتفك أو جهاز الكمبيوتر.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--border-subtle)] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm">
                ٣
              </div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                اطبع الرمز وابدأ البيع
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                حمّل كود QR الخاص بمتجرك جاهزاً للطباعة وضعه على طاولاتك، واستقبل طلبات زبائنك منسقة على
                واتساب.
              </p>
            </div>
          </div>
        </section>

        {/* Industry Solutions Grid */}
        <section className="px-4 py-14 bg-white border-y border-[var(--border-subtle)]">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                مصمم ليلائم كافة الأنشطة التجارية
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                خصائص مخصصة تدعم طبيعة عمل كل متجر ومتطلبات زبائنه
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 text-right">
              {/* Restaurants & Cafes */}
              <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
                  <Utensils size={18} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">مطاعم وكافيهات</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  أحجام الوجبات، خيارات الإضافات، طلبات الطاولات والتوصيل بنقرة واحدة على واتساب.
                </p>
              </div>

              {/* Supermarket & Grocery */}
              <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
                  <ShoppingBag size={18} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">بقالة وسوبرماركت</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  تحديث الأسعار السريع، تصنيف الأوزان والعبوات، وتلقي طلبات النواقص المنزلية للحي.
                </p>
              </div>

              {/* Fashion & Boutiques */}
              <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
                  <Store size={18} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">ملابس ومحلات تجزئة</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  كتالوج بصري جذاب للمنتجات مع تفاصيل المقاسات والألوان المتوفرة بالمحل.
                </p>
              </div>

              {/* Salons & Services */}
              <div className="p-5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
                  <Smartphone size={18} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">صالونات وخدمات</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  قوائم الباقات والخدمات وأسعارها مع خيار الحجز والاستفسار المباشر.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Merchant FAQ Section */}
        <section className="px-4 py-14 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              أسئلة متكررة تهم أصحاب المتاجر
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              كل ما تحتاج معرفته عن المنصة وكيف تخدم نشاطك
            </p>
          </div>

          <div className="space-y-3 text-right">
            {/* FAQ 1 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(1)}
                className="w-full min-h-[44px] p-4 flex items-center justify-between gap-3 text-right font-bold text-xs sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none"
                aria-expanded={activeFaq === 1}
              >
                <span>ما هي تكلفة الخدمة؟ وهل توجد باقة لتجربة المتجر؟</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${
                    activeFaq === 1 ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {activeFaq === 1 && (
                <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                  نوفر لك باقة انطلاق أساسية مجانية بالكامل لتجربة الخدمة وتجهيز منيو متجرك بدون الحاجة لأي بطاقة بنكية وبدون أي عمولات على مبيعاتك وطلباتك. كما نوفر مستقبلاً خططاً متقدمة للأنشطة التي ترغب في ميزات إضافية وتوسعات أكبر.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(2)}
                className="w-full min-h-[44px] p-4 flex items-center justify-between gap-3 text-right font-bold text-xs sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none"
                aria-expanded={activeFaq === 2}
              >
                <span>إذا قمت بتغيير الأسعار، هل أحتاج لإعادة طباعة رمز QR مجدداً؟</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${activeFaq === 2 ? 'rotate-180' : ''
                    }`}
                  aria-hidden="true"
                />
              </button>
              {activeFaq === 2 && (
                <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                  إطلاقاً! الرمز الذي تطبعه على طاولاتك ومحلك دائم وثابت. عندما تعدل سعراً أو تضيف صنفاً جديداً
                  من لوحة تحكمك، يتم التحديث في نفس اللحظة لكل زبون يمسح الكود.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(3)}
                className="w-full min-h-[44px] p-4 flex items-center justify-between gap-3 text-right font-bold text-xs sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none"
                aria-expanded={activeFaq === 3}
              >
                <span>هل يحتاج الزبون لتحميل أي تطبيق لفتح المنيو؟</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${activeFaq === 3 ? 'rotate-180' : ''
                    }`}
                  aria-hidden="true"
                />
              </button>
              {activeFaq === 3 && (
                <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                  لا، يفتح المنيو تلقائياً بمجرد فتح كاميرا الهاتف ومسح الرمز، ويعمل كصفحة ويب فائقة السرعة
                  على أي نوع هاتف (آيفون أو أندرويد).
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(4)}
                className="w-full min-h-[44px] p-4 flex items-center justify-between gap-3 text-right font-bold text-xs sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none"
                aria-expanded={activeFaq === 4}
              >
                <span>كيف تصلني طلبات الزبائن؟</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${activeFaq === 4 ? 'rotate-180' : ''
                    }`}
                  aria-hidden="true"
                />
              </button>
              {activeFaq === 4 && (
                <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                  يختار الزبون أصنافه والكميات والملاحظات، ثم يضغط زر "إرسال عبر واتساب"، فتصلك رسالة جاهزة
                  ومنسقة ببيانات الطلب ورقم الطاولة مباشرة على محادثة الواتساب الخاصة بمتجرك.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* High-Impact Closing CTA Banner (Peak-End Closure) */}
        <section className="px-4 pb-14 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">
              جاهز لتحديث منيو متجرك وتوفير تكاليف الطباعة؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              انضم لمئات التجار وأصحاب المطاعم في السويس ومصر، وأنشئ الكتالوج الإلكتروني الخاص بنشاطك
              خلال دقائق معدودة وبدون الحاجة لبطاقة بنكية.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto px-8 gap-2 font-black text-sm min-h-[48px]"
                >
                  <span>ابدأ تجهيز منيو متجرك الآن</span>
                  <ArrowRight
                    className="w-4 h-4 rtl:rotate-180 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </Link>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[48px] px-6 rounded-[var(--radius-md)] border border-white/20 hover:bg-white/10 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={16} className="text-[var(--whatsapp-green)]" aria-hidden="true" />
                <span>تحتاج مساعدة في الإعداد؟ تواصل معنا</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer Landmark */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 px-4 sm:px-8 text-center text-xs text-[var(--text-muted)] space-y-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs"
              aria-hidden="true"
            >
              M
            </div>
            <span className="font-extrabold text-[var(--text-primary)]">
              ديجيتال منيو — Digital Menu
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
            <Link to="/auth/login" className="min-h-[44px] inline-flex items-center hover:underline">
              تسجيل الدخول
            </Link>
            <Link to="/auth/register" className="min-h-[44px] inline-flex items-center hover:underline">
              إنشاء متجر جديد
            </Link>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1 hover:underline text-[var(--text-primary)]"
            >
              <MessageCircle size={14} className="text-[var(--whatsapp-dark)]" aria-hidden="true" />
              <span>الدعم الفني عبر واتساب</span>
            </a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {currentYear} ديجيتال منيو (دليل السويس) — جميع الحقوق محفوظة.</p>
          <p>منصة سحابية فائقة السرعة مخصصة لخدمة التجار في مصر والمنطقة العربية.</p>
        </div>
      </footer>
    </div>
  );
}
