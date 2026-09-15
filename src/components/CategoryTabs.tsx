import React from 'react';
import { Category, CategoryId } from '../types/menu';
import { Utensils, Sparkles, Coffee, Cake, Flame, Wine } from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  dishCountPerCategory: Record<CategoryId, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  dishCountPerCategory,
}) => {
  const getCategoryIcon = (id: CategoryId) => {
    switch (id) {
      case 'todos':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'principais':
        return <Flame className="w-3.5 h-3.5" />;
      case 'entradas':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'sobremesas':
        return <Cake className="w-3.5 h-3.5" />;
      case 'bebidas':
        return <Wine className="w-3.5 h-3.5" />;
      default:
        return <Utensils className="w-3.5 h-3.5" />;
    }
  };

  return (
    <nav
      aria-label="Categorias do cardápio"
      className="w-full overflow-x-auto no-scrollbar py-2 select-none scroll-smooth"
    >
      <div className="flex items-center gap-2 max-w-6xl mx-auto">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const count = dishCountPerCategory[category.id] ?? 0;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 border ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/20 to-teal-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white border-white/[0.08]'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-zinc-500'}>
                {getCategoryIcon(category.id)}
              </span>
              <span>{category.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-emerald-400 text-black'
                    : 'bg-white/[0.07] text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
