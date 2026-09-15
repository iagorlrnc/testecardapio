import React, { useState } from 'react';
import { useAuth, AppView } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Utensils, BellRing, ShieldCheck, Sparkles, Lock, Check, ChevronUp, ChevronDown } from 'lucide-react';

export const ProfileSwitcher: React.FC = () => {
  const { currentView, setCurrentView, profile, user } = useAuth();
  const { activeCallsCount, activeOrdersCount } = useRestaurant();
  const [minimized, setMinimized] = useState<boolean>(false);

  const panels: {
    id: AppView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    requireAuth?: boolean;
  }[] = [
    {
      id: 'cliente',
      label: 'Cardápio (Cliente)',
      icon: <Utensils className="w-3.5 h-3.5" />,
    },
    {
      id: 'garcom',
      label: 'Painel Garçom',
      icon: <BellRing className="w-3.5 h-3.5" />,
      badge: activeCallsCount + activeOrdersCount,
      requireAuth: true,
    },
    {
      id: 'admin',
      label: 'Administrador',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      requireAuth: true,
    },
  ];

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#121218]/95 backdrop-blur-xl border border-white/20 text-xs font-bold text-emerald-400 shadow-2xl hover:scale-105 transition-all cursor-pointer"
        title="Expandir seletor de ambiente"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ambientes</span>
        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Alternador de perfis de usuário"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-[#101016]/95 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)] select-none max-w-[95vw] overflow-x-auto no-scrollbar animate-fadeIn"
    >
      <div className="hidden md:flex items-center gap-1 pl-2.5 pr-1 text-[11px] font-extrabold text-emerald-400 shrink-0">
        <Sparkles className="w-3 h-3" />
        <span>Ambiente:</span>
      </div>

      <div className="flex items-center gap-1">
        {panels.map((p) => {
          const isActive = currentView === p.id;
          const isUserAuthorized =
            p.id === 'cliente'
              ? true
              : p.id === 'garcom'
              ? profile?.role === 'garcom' || profile?.role === 'admin'
              : profile?.role === 'admin';

          return (
            <button
              key={p.id}
              onClick={() => setCurrentView(p.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25 font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.icon}
              <span>{p.label}</span>

              {p.requireAuth && (
                <span className="opacity-70">
                  {user && isUserAuthorized ? (
                    <Check className="w-2.5 h-2.5 text-emerald-300" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-zinc-500" />
                  )}
                </span>
              )}

              {p.badge !== undefined && p.badge > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-black text-emerald-300'
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}
                >
                  {p.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setMinimized(true)}
        className="p-1.5 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer ml-1"
        title="Minimizar barra"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
