import { useState, useEffect } from 'react';
import { createFileRoute, Outlet, useNavigate, useLocation, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { Button } from '@/client/components/ui/Button';
import {
  LayoutDashboard,
  Package,
  ExternalLink,
  LogOut,
  Loader2,
  Store,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import type { Business } from '@/shared/types';

export const Route = createFileRoute('/_admin')({
  component: AdminProtectedLayout,
});

function AdminProtectedLayout() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 1. Route Protection Guard: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = location.pathname;
      navigate({
        to: '/auth/login',
        search: {
          redirect: currentPath !== '/dashboard' ? currentPath : undefined,
        },
        replace: true,
      });
    }
  }, [user, isLoading, navigate, location.pathname]);

  // 2. Fetch business profile for the authenticated merchant
  useEffect(() => {
    let isSubscribed = true;

    async function fetchMerchantBusiness() {
      if (!user) return;
      try {
        const b = await businessService.getBusinessByUserId(user.id);
        if (isSubscribed && b) {
          setBusiness(b);
        }
      } catch (err) {
        console.warn('Failed to load merchant business profile:', err);
      }
    }

    if (user) {
      fetchMerchantBusiness();
    }

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate({ to: '/auth/login', replace: true });
    } catch (err) {
      console.error('Sign out error:', err);
      setIsSigningOut(false);
    }
  };

  // State A: Loading authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-app)] text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">
          جاري التحقق من صلاحيات الدخول...
        </h2>
        <p className="text-xs text-[var(--text-muted)]">لوحة إدارة المتجر - دليل السويس</p>
      </div>
    );
  }

  // State B: Unauthenticated (Redirecting)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-app)] text-center">
        <div className="p-6 max-w-sm w-full bg-white rounded-2xl shadow-sm border border-[var(--border-subtle)] space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
              تسجيل الدخول مطلوب
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              يجب تسجيل الدخول بحساب تاجر للوصول إلى لوحة الإدارة.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() =>
              navigate({
                to: '/auth/login',
                search: { redirect: location.pathname },
              })
            }
          >
            الانتقال لصفحة تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  // Active navigation tab detection
  const isOverview = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  const isProducts = location.pathname.startsWith('/dashboard/products');

  const catalogPublicUrl = business?.slug
    ? `/c/${business.slug}`
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col text-[var(--text-primary)]">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--border-subtle)] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Right Section: Brand & Business Name */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 select-none group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--brand-primary,#0F172A)] to-emerald-700 flex items-center justify-center text-white font-black text-lg shadow-sm">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-emerald-700 transition-colors">
                  ديجيتال منيو
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  لوحة إدارة المنيو | دليل السويس
                </span>
              </div>
            </Link>

            {business && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
                <Store size={13} className="text-emerald-600" />
                <span>{business.name}</span>
              </div>
            )}
          </div>

          {/* Center Section: Navigation Tabs (Desktop) */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all ${
                isOverview
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>نظرة عامة</span>
            </Link>

            <Link
              to="/dashboard/products"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all ${
                isProducts
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
            >
              <Package size={15} />
              <span>المنتجات والتصنيفات</span>
            </Link>
          </nav>

          {/* Left Section: Catalog Preview, User & Sign Out */}
          <div className="flex items-center gap-2">
            {catalogPublicUrl && (
              <a
                href={catalogPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <ExternalLink size={13} />
                  <span>معاينة الكتالوج</span>
                </Button>
              </a>
            )}

            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-muted)]" title={user.email}>
              <UserIcon size={14} />
              <span className="max-w-[140px] truncate" dir="ltr">{user.email}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
              title="تسجيل الخروج من الحساب"
            >
              {isSigningOut ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </Button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="sm:hidden flex items-center justify-around border-t border-[var(--border-subtle)] px-2 py-1.5 bg-slate-50/70">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isOverview
                ? 'bg-slate-900 text-white'
                : 'text-[var(--text-secondary)] hover:bg-white'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>نظرة عامة</span>
          </Link>

          <Link
            to="/dashboard/products"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isProducts
                ? 'bg-slate-900 text-white'
                : 'text-[var(--text-secondary)] hover:bg-white'
            }`}
          >
            <Package size={14} />
            <span>المنتجات</span>
          </Link>

          {catalogPublicUrl && (
            <a
              href={catalogPublicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100"
            >
              <ExternalLink size={12} />
              <span>الكتالوج</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Protected Content Area */}
      <main className="flex-1 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
