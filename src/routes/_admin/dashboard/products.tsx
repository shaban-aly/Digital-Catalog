import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/client/hooks/use-auth';
import { businessService } from '@/server/services/business';
import { productService } from '@/server/services/product';
import { categoryService } from '@/server/services/category';
import { ProductForm } from '@/client/components/forms/ProductForm';
import { CategoryForm } from '@/client/components/forms/CategoryForm';
import { ProductRowActions } from '@/client/components/tables/ProductRowActions';
import { Card, Badge } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { useDialog } from '@/client/components/ui/Dialog';
import {
  Plus,
  Search,
  Layers,
  Loader2,
  ArrowRight,
  X,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';
import type { Business, Category, Product } from '@/shared/types';
import type { CreateProductInput, CategoryInput } from '@/shared/schemas';

export const Route = createFileRoute('/_admin/dashboard/products')({
  component: DashboardProductsPage,
});

function DashboardProductsPage() {
  const { user } = useAuth();
  const dialog = useDialog();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const b = await businessService.getBusinessByUserId(user.id);
      if (b) {
        setBusiness(b);
        const [cats, prods] = await Promise.all([
          categoryService.getCategories(b.id),
          productService.getProducts(b.id),
        ]);
        setCategories(cats);
        setProducts(prods);
      }
    } catch (err) {
      console.error('Failed to load products page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle escape key to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddProductOpen) {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }
        if (isAddCategoryOpen) {
          setIsAddCategoryOpen(false);
          setEditingCategory(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddProductOpen, isAddCategoryOpen]);

  const handleSaveProduct = async (values: CreateProductInput) => {
    if (!business) return;
    setIsSubmittingProduct(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          category_id: values.category_id,
          name: values.name,
          description: values.description,
          base_price: values.base_price,
          compare_at_price: values.compare_at_price,
          status: values.status,
        });
      } else {
        await productService.createProduct(business.id, values);
      }
      setIsAddProductOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      throw err;
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleSaveCategory = async (values: CategoryInput) => {
    if (!business) return;
    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: values.name,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
      } else {
        await categoryService.createCategory(business.id, values);
      }
      setIsAddCategoryOpen(false);
      setEditingCategory(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      throw err;
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const hasProducts = products.some((p) => p.category_id === cat.id);
    if (hasProducts) {
      await dialog.alert({
        title: 'لا يمكن حذف القسم',
        message: `القسم "${cat.name.ar}" يحتوي على أصناف مرتبطة به. يرجى نقل الأصناف لتصنيف آخر أو حذفها أولاً.`,
        variant: 'danger',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'حذف القسم نهائياً',
      message: `هل أنت متأكد من رغبتك في حذف قسم "${cat.name.ar}"؟ لن يظهر هذا القسم في قائمة المنيو للزبائن.`,
      confirmText: 'نعم، حذف القسم',
      cancelText: 'إلغاء',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await categoryService.deleteCategory(cat.id);
        if (selectedCategory === cat.id) {
          setSelectedCategory(null);
        }
        await loadData();
      } catch (err: any) {
        await dialog.alert({
          title: 'تعذر حذف القسم',
          message: err?.message || 'حدث خطأ أثناء محاولة حذف القسم.',
          variant: 'danger',
        });
      }
    }
  };

  const handleToggleAvailability = async (productId: string, newStatus: boolean) => {
    // Optimistic UI update for immediate 0ms response
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, status: newStatus ? 'active' : 'out_of_stock' } : p
      )
    );

    try {
      await productService.setAvailability(productId, newStatus);
    } catch (err) {
      console.error('Failed to update product availability:', err);
      // Rollback on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: !newStatus ? 'active' : 'out_of_stock' } : p
        )
      );
      await dialog.alert({
        title: 'تعذر تعديل الحالة',
        message: 'حدث خطأ في الاتصال أثناء تحديث التوفر. تم استرجاع الحالة السابقة.',
        variant: 'danger',
      });
    }
  };

  const openEditProduct = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      setEditingProduct(p);
      setIsAddProductOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center"
      >
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" aria-hidden="true" />
        <p className="text-xs font-bold text-[var(--text-muted)]">
          جاري تحميل المنتجات والتصنيفات...
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] my-12 shadow-sm">
        <h1 className="text-base font-bold text-[var(--text-primary)]">
          لم يتم العثور على متجر مرتبط بهذا الحساب
        </h1>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          يرجى إكمال بيانات المتجر أولاً لتتمكن من إضافة وإدارة الأقسام والمنتجات.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] select-none bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px] w-full"
        >
          إعداد متجرك التجاري الآن
        </Link>
      </div>
    );
  }

  const currencySymbol = business?.currency_code === 'EGP' ? 'ج.م' : (business?.currency_code || 'ج.م');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesNameAr = p.name?.ar?.toLowerCase().includes(query);
    const matchesNameEn = p.name?.en?.toLowerCase().includes(query);
    const matchesDesc = p.description?.ar?.toLowerCase().includes(query);
    const category = categories.find((c) => c.id === p.category_id);
    const matchesCat = category?.name?.ar?.toLowerCase().includes(query);

    return matchesCategory && (matchesNameAr || matchesNameEn || matchesDesc || matchesCat);
  });

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-right max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-1">
            <ArrowRight size={14} aria-hidden="true" />
            <Link to="/dashboard" className="hover:underline font-bold">
              العودة للوحة التحكم الرئيسية
            </Link>
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">
            إدارة الأصناف والأقسام
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2 flex-wrap">
            <span>باقة الانطلاق الأساسية:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {products.length} / 100 صنف
            </span>
            <span>·</span>
            <span className="font-bold text-[var(--text-primary)]">
              {categories.length} / 15 قسم
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setEditingCategory(null);
              setIsAddCategoryOpen(true);
            }}
            className="gap-1.5 min-h-[44px]"
          >
            <Layers size={16} aria-hidden="true" />
            <span>إضافة قسم</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            className="gap-1.5 min-h-[44px]"
          >
            <Plus size={16} aria-hidden="true" />
            <span>إضافة صنف جديد</span>
          </Button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section aria-labelledby="filter-heading" className="space-y-3">
        <h2 id="filter-heading" className="sr-only">
          تصفية وبحث الأصناف
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Input
              id="products-search-input"
              aria-label="بحث عن صنف بالاسم أو الوصف أو القسم"
              placeholder="بحث عن صنف بالاسم أو القسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 pr-3.5 h-11 text-sm"
            />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 text-[var(--text-muted)]">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح نص البحث"
                  className="p-1 hover:text-[var(--text-primary)] rounded-full transition-colors"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
              <Search size={16} aria-hidden="true" />
            </div>
          </div>

          {/* Active Category Actions (Edit/Delete) */}
          {activeCategoryObj && (
            <div className="flex items-center gap-1.5 shrink-0 bg-[var(--bg-surface-subtle)] px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {activeCategoryObj.name.ar}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(activeCategoryObj);
                  setIsAddCategoryOpen(true);
                }}
                aria-label={`تعديل اسم قسم ${activeCategoryObj.name.ar}`}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors"
                title="تعديل هذا القسم"
              >
                <Edit2 size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(activeCategoryObj)}
                aria-label={`حذف قسم ${activeCategoryObj.name.ar}`}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-promo)] rounded-md transition-colors"
                title="حذف هذا القسم"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Categories Pills */}
        <div
          role="tablist"
          aria-label="أقسام قائمة الطعام"
          className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar py-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all min-h-[38px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
              selectedCategory === null
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
            }`}
          >
            الكل ({products.length})
          </button>

          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            const isSelected = selectedCategory === c.id;

            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all min-h-[38px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <span>{c.name.ar}</span>
                <span className="mr-1.5 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Results Announcement */}
        <div aria-live="polite" className="sr-only">
          {`يتم عرض ${filteredProducts.length} صنف من أصل ${products.length}`}
        </div>
      </section>

      {/* Products List or Empty States */}
      <section aria-labelledby="products-list-heading" className="space-y-3">
        <h2 id="products-list-heading" className="sr-only">
          قائمة أصناف المتجر
        </h2>

        {products.length === 0 ? (
          /* Empty State 1: Store has zero products */
          <Card className="p-12 text-center space-y-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Package size={28} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                قائمتك الرقمية فارغة حالياً
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                لم تقم بإضافة أي أصناف بعد. ابدأ الآن بتسجيل أول وجبة أو مشروب لعرضه في منيو الزبائن.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingProduct(null);
                setIsAddProductOpen(true);
              }}
              className="gap-2 min-h-[44px]"
            >
              <Plus size={16} aria-hidden="true" />
              <span>إضافة أول صنف الآن</span>
            </Button>
          </Card>
        ) : filteredProducts.length === 0 ? (
          /* Empty State 2: Active search or filter returned zero matches */
          <Card className="p-10 text-center space-y-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Search size={22} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                لا توجد نتائج مطابقة لبحثك
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                لم نجد أي صنف يطابق &quot;{searchQuery}&quot; في هذا القسم.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="min-h-[44px]"
            >
              عرض جميع الأصناف ({products.length})
            </Button>
          </Card>
        ) : (
          /* Products List */
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredProducts.map((p) => {
                const category = categories.find((c) => c.id === p.category_id);
                const isAvailable = p.status === 'active';
                const coverImg =
                  (p as any).media?.find((m: any) => m.is_cover)?.public_url ||
                  (p as any).media?.[0]?.public_url;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                      isAvailable ? 'hover:bg-[var(--bg-app)]/60' : 'bg-[var(--bg-surface-subtle)]/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Product Thumbnail */}
                      <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--bg-surface-subtle)] overflow-hidden shrink-0 border border-[var(--border-subtle)] flex items-center justify-center">
                        {coverImg ? (
                          <img
                            src={coverImg}
                            alt={p.name.ar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-[var(--text-muted)]">
                            لا صورة
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            {p.name.ar}
                          </h3>
                          {p.name.en && (
                            <span className="text-xs text-[var(--text-muted)] font-mono" dir="ltr">
                              ({p.name.en})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {category && (
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                              {category.name.ar}
                            </span>
                          )}
                          <span dir="ltr" className="text-sm font-extrabold text-[var(--text-primary)]">
                            {p.base_price
                              ? `${p.base_price} ${currencySymbol}`
                              : 'حسب الاختيار'}
                          </span>
                          {!isAvailable && (
                            <Badge variant="danger">
                              غير متوفر حالياً
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <ProductRowActions
                      productId={p.id}
                      productName={p.name.ar}
                      isAvailable={isAvailable}
                      onRefresh={loadData}
                      onEdit={openEditProduct}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit Product Modal */}
      {isAddProductOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddProductOpen(false);
              setEditingProduct(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto relative border border-[var(--border-subtle)] shadow-xl">
            <button
              type="button"
              onClick={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
              aria-label="إغلاق نافذة الصنف"
              className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <h2 id="product-modal-title" className="text-base font-extrabold text-[var(--text-primary)] mb-5">
              {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد لقائمتك'}
            </h2>

            <ProductForm
              categories={categories}
              currency={currencySymbol}
              initialValues={editingProduct}
              onSubmit={handleSaveProduct}
              onCancel={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
              isLoading={isSubmittingProduct}
            />
          </Card>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isAddCategoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddCategoryOpen(false);
              setEditingCategory(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <Card className="w-full max-w-md p-5 sm:p-6 relative border border-[var(--border-subtle)] shadow-xl">
            <button
              type="button"
              onClick={() => {
                setIsAddCategoryOpen(false);
                setEditingCategory(null);
              }}
              aria-label="إغلاق نافذة القسم"
              className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <h2 id="category-modal-title" className="text-base font-extrabold text-[var(--text-primary)] mb-5">
              {editingCategory ? 'تعديل بيانات القسم' : 'إضافة قسم / تصنيف جديد'}
            </h2>

            <CategoryForm
              initialValues={editingCategory}
              onSubmit={handleSaveCategory}
              onCancel={() => {
                setIsAddCategoryOpen(false);
                setEditingCategory(null);
              }}
              isLoading={isSubmittingCategory}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
