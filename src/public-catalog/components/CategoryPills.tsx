import type { PublicCategory } from '../../shared/schemas';

interface CategoryPillsProps {
  categories: PublicCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryPills({ categories, activeCategoryId, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-app)]/95 backdrop-blur-md py-2.5 px-3 border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {/* All items pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all select-none min-h-[38px] ${
            activeCategoryId === null
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)]'
          }`}
        >
          الكل
        </button>

        {/* Dynamic categories */}
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all select-none min-h-[38px] flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)]'
              }`}
            >
              <span>{cat.name.ar}</span>
              {cat.product_count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {cat.product_count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
