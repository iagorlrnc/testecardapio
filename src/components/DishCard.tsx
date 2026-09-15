import React, { useState } from 'react';
import { Dish } from '../types/menu';
import { Box, Sparkles, Clock, Users, ArrowUpRight, Plus, Check, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DishCardProps {
  dish: Dish;
  onSelect: (dish: Dish) => void;
  onQuickAdd?: (dish: Dish) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (dishId: string) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  onSelect,
  onQuickAdd,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [quickAdded, setQuickAdded] = useState(false);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(dish.price);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(dish);
    }
    setQuickAdded(true);
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#10B981', '#34D399', '#FFFFFF'],
    });
    setTimeout(() => setQuickAdded(false), 1500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(dish.id);
    }
  };

  return (
    <article
      onClick={() => onSelect(dish)}
      className="group relative flex flex-col rounded-3xl bg-[#111116] border border-white/[0.08] hover:border-emerald-500/40 overflow-hidden transition-all duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.7)] cursor-pointer active:scale-[0.985] text-left"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-zinc-950">
        <img
          src={dish.thumbnail}
          alt={dish.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />

        {/* Gradient shadow for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-black/40 pointer-events-none" />

        {/* 3D / AR Interactive Floating Badge (Top Left) */}
        {dish.modelStatus === 'processing' ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[11px] font-bold tracking-wide shadow-lg">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>3D Gerando...</span>
          </div>
        ) : dish.modelStatus === 'failed' ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-rose-400/50 text-rose-300 text-[11px] font-bold tracking-wide shadow-lg">
            <Box className="w-3.5 h-3.5 text-rose-400" />
            <span>3D Indisponível</span>
          </div>
        ) : (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-400/60 text-emerald-300 text-[11px] font-bold tracking-wide ar-badge-pulse shadow-lg">
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver em 3D / AR</span>
          </div>
        )}

        {/* Top Right: Favorite Button & Chef Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {dish.nutrition?.chefSpecial && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Chef</span>
            </div>
          )}

          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg'
                  : 'bg-black/60 hover:bg-black/80 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Salvar prato'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Quick meta (bottom image) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/5">
            <Clock className="w-3 h-3 text-emerald-400" />
            {dish.nutrition?.prepTime || '20 min'}
          </span>
          <span className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/5">
            <Users className="w-3 h-3 text-emerald-400" />
            {dish.nutrition?.serves || '1 pessoa'}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(dish.tags || []).slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/5 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Dish Name */}
          <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
            {dish.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed font-light">
            {dish.description}
          </p>
        </div>

        {/* Footer: Price & Actions */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block font-medium">
              Valor
            </span>
            <span className="font-mono text-lg sm:text-xl font-bold text-emerald-400">
              {formattedPrice}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Button */}
            {onQuickAdd && (
              <button
                onClick={handleQuickAddClick}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all cursor-pointer active:scale-90 ${
                  quickAdded
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border-white/10'
                }`}
                title="Adicionar direto à comanda"
              >
                {quickAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline text-[11px]">Pedir</span>
                  </>
                )}
              </button>
            )}

            {/* Explore 3D Button */}
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-xl border border-emerald-500/30 group-hover:border-emerald-500/50 transition-all">
              <span>3D & AR</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
