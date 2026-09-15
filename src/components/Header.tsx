import React from 'react';
import { Box, BellRing, ShoppingBag, Sparkles, MapPin, CheckCircle2, ChevronDown } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface HeaderProps {
  tableNumber: string;
  onOpenWaiter: () => void;
  onOpenCart: () => void;
  onOpenTableModal: () => void;
  cartItemCount: number;
  cartTotal?: number;
}

export const Header: React.FC<HeaderProps> = ({
  tableNumber,
  onOpenWaiter,
  onOpenCart,
  onOpenTableModal,
  cartItemCount,
  cartTotal = 0,
}) => {
  const { calls, settings, orders } = useRestaurant();

  // Check if current table has an active call waiting
  const hasPendingCall = calls.some(
    (c) => c.tableNumber === tableNumber && c.status === 'aguardando'
  );

  // Check if table has active orders in kitchen
  const activeTableOrders = orders.filter(
    (o) => o.tableNumber === tableNumber && o.status !== 'entregue' && o.status !== 'cancelado'
  );

  const formattedCartTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cartTotal);

  return (
    <header
      className="sticky top-0 z-40 w-full bg-[#08080a]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-all duration-300"
      style={{ paddingTop: 'max(0.6rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Table Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0">
            <Box className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-white">
                {settings.name || 'AURUM'}
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest hidden sm:inline-flex">
                3D • AR
              </span>
            </div>

            {/* Table interactive trigger button */}
            <button
              onClick={onOpenTableModal}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer group text-left"
              title="Clique para alterar a mesa"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-zinc-200">Mesa {tableNumber}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400 group-hover:text-emerald-400 transition-colors underline decoration-dotted">
                Trocar
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-white transition-transform" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Chamar Garçom & Comanda */}
        <div className="flex items-center gap-2">
          {/* Chamar Garçom Button */}
          <button
            onClick={onOpenWaiter}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 border ${
              hasPendingCall
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Chamar Atendimento do Garçom"
          >
            <BellRing className={`w-4 h-4 ${hasPendingCall ? 'text-amber-400 animate-bounce' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {hasPendingCall ? 'Garçom Chamado' : 'Chamar Garçom'}
            </span>
            <span className="sm:hidden">
              {hasPendingCall ? 'Chamado' : 'Garçom'}
            </span>
          </button>

          {/* Comanda / Pedidos Button */}
          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
              cartItemCount > 0 || activeTableOrders.length > 0
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-black border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Abrir Comanda e Pedidos"
          >
            <ShoppingBag className={`w-4 h-4 ${cartItemCount > 0 || activeTableOrders.length > 0 ? 'text-black' : 'text-emerald-400'}`} />
            
            <div className="flex items-center gap-1.5">
              <span>Comanda</span>
              {cartItemCount > 0 ? (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-black text-emerald-300 text-[10px] font-extrabold">
                  {cartItemCount}
                </span>
              ) : activeTableOrders.length > 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </div>

            {cartTotal > 0 && (
              <span className="hidden md:inline font-mono font-extrabold text-[11px] pl-1 border-l border-black/20">
                {formattedCartTotal}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
