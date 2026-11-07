import type { PublicCategory } from '../../shared/schemas';

interface CategoryPillsProps {
  categories: PublicCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryPills({ categories, activeCategoryId, onSelectCategory }: CategoryPillsProps) {
  return (
    <nav
      role="tablist"
      aria-label="أقسام الكتالوج وقوائم الأصناف"
      className="sticky top-0 z-30 bg-[var(--bg-app)]/95 backdrop-blur-md py-2.5 px-3 border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar"
    >
      <div className="flex items-center gap-2 min-w-max">
        {/* All items pill */}
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryId === null}
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all select-none min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
            activeCategoryId === null
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)]'
          }`}
        >
          <span>الكل</span>
        </button>

        {/* Dynamic categories */}
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all select-none min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)]'
              }`}
            >
              <span>{cat.name.ar}</span>
              {cat.product_count > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                  }`}
                  dir="ltr"
                >
                  {cat.product_count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
