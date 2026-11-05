import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
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
import { Plus, Search, Layers, Loader2, ArrowRight } from 'lucide-react';
import type { Business, Category, Product } from '@/shared/types';
import type { CreateProductInput, CategoryInput } from '@/shared/schemas';

export const Route = createFileRoute('/_admin/dashboard/products')({
  component: DashboardProductsPage,
});

function DashboardProductsPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
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

  const handleCreateProduct = async (values: CreateProductInput) => {
    if (!business) return;
    await productService.createProduct(business.id, values);
    setIsAddProductOpen(false);
    await loadData();
  };

  const handleCreateCategory = async (values: CategoryInput) => {
    if (!business) return;
    await categoryService.createCategory(business.id, values);
    setIsAddCategoryOpen(false);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-white rounded-2xl border border-[var(--border-subtle)] my-12 shadow-sm">
        <h2 className="text-base font-bold text-[var(--text-primary)]">لم يتم العثور على متجر مرتبط بهذا الحساب</h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          يرجى إكمال بيانات المتجر أولاً لتتمكن من إضافة وإدارة الأقسام والمنتجات.
        </p>
        <a href="/auth/register" className="inline-block w-full">
          <Button variant="primary" size="md" className="w-full">
            إعداد متجرك التجاري الآن
          </Button>
        </a>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? p.name.ar.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 text-right max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <a href="/dashboard" className="text-xs text-[var(--text-muted)] hover:underline flex items-center gap-1">
              <ArrowRight size={14} /> العودة للرئيسية
            </a>
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)] mt-1">إدارة المنتجات والأقسام</h1>
          <p className="text-xs text-[var(--text-muted)]">
            المنتجات الحالية: {products.length} من أصل 100 مسموحة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsAddCategoryOpen(true)} className="gap-1.5">
            <Layers size={15} /> إضافة قسم
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddProductOpen(true)} className="gap-1.5">
            <Plus size={16} /> إضافة منتج جديد
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="بحث عن منتج بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              {c.name.ar}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table / Cards */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center text-[var(--text-muted)] space-y-3">
          <p className="text-sm">لا توجد منتجات مسجلة تطابق البحث.</p>
          <Button variant="outline" size="sm" onClick={() => setIsAddProductOpen(true)}>
            إضافة أول منتج الآن
          </Button>
        </Card>
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredProducts.map((p) => {
              const category = categories.find((c) => c.id === p.category_id);
              const isAvailable = p.status === 'active';
              const coverImg =
                (p as any).media?.find((m: any) => m.is_cover)?.public_url ||
                (p as any).media?.[0]?.public_url;

              return (
                <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-app)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-surface-subtle)] overflow-hidden shrink-0 border border-[var(--border-subtle)] flex items-center justify-center">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={p.name.ar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">لا صورة</span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{p.name.ar}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[var(--text-muted)]">{category?.name.ar}</span>
                        <span className="text-xs font-extrabold text-[var(--text-primary)]">
                          {p.base_price ? `${p.base_price} ${business?.currency_code}` : 'حسب الاختيار'}
                        </span>
                        {!isAvailable && <Badge variant="danger">غير متوفر</Badge>}
                      </div>
                    </div>
                  </div>

                  <ProductRowActions
                    productId={p.id}
                    isAvailable={isAvailable}
                    onRefresh={loadData}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 my-auto">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-4">إضافة منتج جديد للكتالوج</h3>
            <ProductForm
              categories={categories}
              currency={business?.currency_code || 'SAR'}
              onSubmit={handleCreateProduct}
              onCancel={() => setIsAddProductOpen(false)}
            />
          </Card>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-5">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-4">إضافة قسم / تصنيف جديد</h3>
            <CategoryForm
              onSubmit={handleCreateCategory}
              onCancel={() => setIsAddCategoryOpen(false)}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
