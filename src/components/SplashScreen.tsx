import React from 'react';
import { Sparkles, Box, Smartphone, ChevronRight, Eye, Layers } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface SplashScreenProps {
  onEnterMenu: () => void;
  tableNumber: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterMenu, tableNumber }) => {
  const { settings } = useRestaurant();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onEnterMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnterMenu]);

  return (
    <section
      aria-label="Boas-vindas ao Cardápio 3D"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#070709] text-white px-6 py-8 overflow-hidden select-none animate-fadeIn"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold">Mesa {tableNumber}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Salão</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realidade Aumentada</span>
        </div>
      </header>

      {/* Center Hero */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto max-w-md mx-auto w-full">
        {/* Holographic 3D Box Emblem */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-amber-500/20 rounded-full blur-2xl opacity-80 animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-b from-[#181820] to-[#0d0d12] border border-emerald-500/40 p-0.5 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#0d0d12] flex flex-col items-center justify-center gap-2">
              <Box className="w-11 h-11 text-emerald-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-300">
                3D & AR
              </span>
            </div>
          </div>
        </div>

        {/* Restaurant Name */}
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-wider text-white mb-2 leading-tight">
          {settings.name || 'AURUM'}
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold mb-6">
          {settings.subtitle || 'Cardápio Digital 3D & Realidade Aumentada'}
        </p>

        {/* Feature Highlights Card */}
        <div className="w-full rounded-3xl p-5 bg-[#121218]/90 border border-white/10 shadow-2xl backdrop-blur-xl mb-6 text-left space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">
                Veja os pratos na sua mesa em 3D
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Gire qualquer prato em 360° e projete na sua mesa em tamanho real (1:1) com a câmera do celular.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              iPhone e Android
            </span>
            <span className="text-emerald-400 font-bold">
              ✨ Sem baixar aplicativo
            </span>
          </div>
        </div>
      </main>

      {/* Bottom CTA Button */}
      <footer className="relative z-10 w-full max-w-md mx-auto pt-2">
        <button
          onClick={onEnterMenu}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-base shadow-[0_8px_30px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span>Abrir Cardápio Interativo</span>
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="text-[11px] text-center text-zinc-500 mt-2.5">
          Toque para explorar os pratos • Mesa {tableNumber}
        </p>
      </footer>
    </section>
  );
};
