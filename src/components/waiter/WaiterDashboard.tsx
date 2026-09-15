import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { OrderStatus, TableCallReason, TableOrder } from '../../types/restaurant';
import { Dish } from '../../types/menu';
import {
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Filter,
  Users,
  Check,
  RotateCcw,
  Utensils,
  Receipt,
  HelpCircle,
  LogOut,
  ShieldCheck,
  ArrowLeftRight,
  LayoutGrid,
  ListOrdered,
  Plus,
  X,
  Volume2,
  VolumeX,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WaiterDashboard: React.FC = () => {
  const {
    orders,
    addOrder,
    updateOrderStatus,
    calls,
    markCallAnswered,
    dishes,
    settings,
    activeCallsCount,
    activeOrdersCount,
  } = useRestaurant();

  const { profile, signOut, setCurrentView, canToggleBetweenPanels } = useAuth();

  const [viewMode, setViewMode] = useState<'mapa' | 'fila' | 'chamadas'>('mapa');
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ativos');
  const [selectedTableForDrawer, setSelectedTableForDrawer] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // New POS Order modal state
  const [posTable, setPosTable] = useState<string>('01');
  const [posCart, setPosCart] = useState<{ dish: Dish; quantity: number }[]>([]);
  const [posNotes, setPosNotes] = useState<string>('');

  // Calls
  const pendingCalls = calls.filter((c) => c.status === 'aguardando');
  const answeredCalls = calls.filter((c) => c.status === 'atendido');

  // Orders Filtered
  const filteredOrders = orders.filter((order) => {
    if (selectedTableFilter !== 'todas' && order.tableNumber !== selectedTableFilter) {
      return false;
    }
    if (selectedStatusFilter === 'ativos') {
      return order.status !== 'entregue' && order.status !== 'cancelado';
    }
    if (selectedStatusFilter !== 'todos') {
      return order.status === selectedStatusFilter;
    }
    return true;
  });

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'preparando';
    if (currentStatus === 'pendente') nextStatus = 'preparando';
    else if (currentStatus === 'preparando') nextStatus = 'pronto';
    else if (currentStatus === 'pronto') {
      nextStatus = 'entregue';
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#FFFFFF'],
      });
    }

    updateOrderStatus(orderId, nextStatus);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            Pendente
          </span>
        );
      case 'preparando':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Na Cozinha
          </span>
        );
      case 'pronto':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-bounce">
            Pronto p/ Servir!
          </span>
        );
      case 'entregue':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Entregue
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-500/20 text-zinc-400 border border-zinc-500/40">
            Cancelado
          </span>
        );
    }
  };

  const getCallIcon = (reason: TableCallReason) => {
    switch (reason) {
      case 'Pedir a Conta':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case 'Atendimento na Mesa':
        return <HelpCircle className="w-4 h-4 text-blue-400" />;
      case 'Talheres, Taças ou Gelo':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Generate 24 tables for Floor Map
  const totalTables = settings.totalTables || 24;
  const tableList = Array.from({ length: totalTables }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const tableOrdersList = orders.filter((o) => o.tableNumber === num && o.status !== 'entregue' && o.status !== 'cancelado');
    const tableCall = calls.find((c) => c.tableNumber === num && c.status === 'aguardando');
    const hasReadyDish = tableOrdersList.some((o) => o.status === 'pronto');

    let status: 'livre' | 'ocupada' | 'chamando' | 'pronto' = 'livre';
    if (tableCall) status = 'chamando';
    else if (hasReadyDish) status = 'pronto';
    else if (tableOrdersList.length > 0) status = 'ocupada';

    return {
      number: num,
      status,
      orders: tableOrdersList,
      call: tableCall,
    };
  });

  const handleCreatePosOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    addOrder(posTable, posCart, posNotes);
    setPosCart([]);
    setPosNotes('');
    setShowNewOrderModal(false);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-white pb-24 select-none">
      {/* Top Fixed Header */}
      <header
        className="sticky top-0 z-40 bg-[#101015]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-white">
                  Painel do Garçom
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider">
                  Salão Ao Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Atendente: <strong className="text-white">{profile?.name || 'Colaborador'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick POS Launch Button */}
            <button
              onClick={() => setShowNewOrderModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              title="Lançar novo pedido manualmente"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Lançar Pedido</span>
            </button>

            {/* Admin Toggle */}
            {canToggleBetweenPanels && (
              <button
                onClick={() => setCurrentView('admin')}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => setCurrentView('cliente')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              Cardápio
            </button>

            <button
              onClick={signOut}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 hover:text-rose-200 transition-all cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sub-bar: View Modes & Quick Stats */}
      <div className="w-full bg-[#0d0d12] border-b border-white/5 px-4 py-2.5 sticky top-[57px] z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('mapa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mapa'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mapa do Salão</span>
            </button>

            <button
              onClick={() => setViewMode('fila')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'fila'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Fila de Pedidos</span>
              {activeOrdersCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    viewMode === 'fila' ? 'bg-black text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('chamadas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'chamadas'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Chamados</span>
              {pendingCalls.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {pendingCalls.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Livre</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Ocupada</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Chamando</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Pronto</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        {/* VIEW MODE 1: MAPA DO SALÃO */}
        {viewMode === 'mapa' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-white">
                  Mapa de Ocupação das Mesas ({totalTables} Mesas)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Toque em qualquer mesa para ver a comanda aberta, pedidos em preparo ou atender chamados
                </p>
              </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {tableList.map((tbl) => {
                const isCalling = tbl.status === 'chamando';
                const isReady = tbl.status === 'pronto';
                const isOccupied = tbl.status === 'ocupada';

                return (
                  <div
                    key={tbl.number}
                    onClick={() => setSelectedTableForDrawer(tbl.number)}
                    className={`relative p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between h-36 active:scale-95 shadow-md ${
                      isCalling
                        ? 'bg-gradient-to-br from-[#2a1714] to-[#170e0d] border-rose-500/70 shadow-rose-950/40 animate-pulse'
                        : isReady
                        ? 'bg-gradient-to-br from-[#21152a] to-[#120d18] border-purple-500/70 shadow-purple-950/40'
                        : isOccupied
                        ? 'bg-[#14141c] border-blue-500/40 hover:border-blue-400'
                        : 'bg-[#101015] border-white/10 hover:border-emerald-500/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-serif text-2xl font-bold text-white">
                        M{tbl.number}
                      </span>
                      {isCalling ? (
                        <span className="p-1 rounded-full bg-rose-500/20 text-rose-300 animate-bounce">
                          <BellRing className="w-4 h-4" />
                        </span>
                      ) : isReady ? (
                        <span className="p-1 rounded-full bg-purple-500/20 text-purple-300 animate-bounce">
                          <Sparkles className="w-4 h-4" />
                        </span>
                      ) : isOccupied ? (
                        <span className="p-1 rounded-full bg-blue-500/20 text-blue-300">
                          <ChefHat className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                      )}
                    </div>

                    <div>
                      {isCalling && tbl.call ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 block">
                            CHAMANDO
                          </span>
                          <span className="text-[11px] text-zinc-300 font-medium truncate block">
                            {tbl.call.reason}
                          </span>
                        </div>
                      ) : isReady ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                            PRONTO P/ SERVIR
                          </span>
                          <span className="text-[11px] text-zinc-300">
                            {tbl.orders.length} pedido(s)
                          </span>
                        </div>
                      ) : isOccupied ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                            EM PREPARO
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {tbl.orders.length} pedido(s)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Mesa Livre
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: FILA DE PEDIDOS KDS */}
        {viewMode === 'fila' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-400" />
                <h2 className="font-serif text-lg font-bold text-white">
                  Fila de Produção da Cozinha ({filteredOrders.length})
                </h2>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#14141a] border border-white/10 text-zinc-300 text-xs outline-none cursor-pointer"
                >
                  <option value="ativos">Apenas Ativos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="preparando">Em Preparo</option>
                  <option value="pronto">Prontos p/ Servir</option>
                  <option value="entregue">Entregues</option>
                  <option value="todos">Todos</option>
                </select>

                <select
                  value={selectedTableFilter}
                  onChange={(e) => setSelectedTableFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#14141a] border border-white/10 text-zinc-300 text-xs outline-none cursor-pointer"
                >
                  <option value="todas">Todas as Mesas</option>
                  {tableList.map((t) => (
                    <option key={t.number} value={t.number}>Mesa {t.number}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 space-y-2 bg-[#121218] rounded-3xl border border-white/5">
                <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-white">Nenhum pedido nesta fila</p>
                <p className="text-xs text-zinc-400">Os novos pedidos das mesas aparecerão automaticamente aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const formattedTotal = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(order.total);

                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-3xl bg-[#13131a] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-extrabold text-sm">
                              Mesa {order.tableNumber}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {order.createdAt}
                            </span>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        {/* Items */}
                        <div className="py-3 space-y-2 divide-y divide-white/5 text-xs">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="pt-2 first:pt-0 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                                  {item.quantity}x
                                </span>
                                <span className="text-zinc-200 font-semibold">
                                  {item.dish.name}
                                </span>
                              </div>
                              <span className="font-mono text-zinc-400">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(item.dish.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.customerNotes && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                            <strong>Obs da Mesa:</strong> {order.customerNotes}
                          </div>
                        )}
                      </div>

                      {/* Footer: Subtotal & 1-Click Action */}
                      <div className="pt-2 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Valor do Pedido:</span>
                          <span className="font-mono font-bold text-base text-emerald-400">
                            {formattedTotal}
                          </span>
                        </div>

                        {order.status !== 'entregue' && order.status !== 'cancelado' && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, order.status)}
                            className={`w-full py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg ${
                              order.status === 'pendente'
                                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                                : order.status === 'preparando'
                                ? 'bg-purple-500 hover:bg-purple-400 text-white'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                            }`}
                          >
                            {order.status === 'pendente' && (
                              <>
                                <ChefHat className="w-4 h-4" />
                                <span>Enviar para Preparo na Cozinha</span>
                              </>
                            )}
                            {order.status === 'preparando' && (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Marcar como Pronto para Servir</span>
                              </>
                            )}
                            {order.status === 'pronto' && (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Confirmar Entrega na Mesa</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 3: CHAMADOS DE MESAS */}
        {viewMode === 'chamadas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif text-lg font-bold text-white">
                  Chamadas de Garçom do Salão
                </h2>
                {pendingCalls.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 animate-pulse">
                    {pendingCalls.length} aguardando
                  </span>
                )}
              </div>
            </div>

            {pendingCalls.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#121218] border border-white/5 text-center text-zinc-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-sm font-semibold text-white">Nenhum chamado pendente no momento</p>
                <p className="text-xs text-zinc-500">O salão está em ordem e todas as mesas foram atendidas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-5 rounded-3xl bg-gradient-to-br from-[#231513] to-[#120d0c] border border-rose-500/50 shadow-2xl space-y-4 animate-fadeIn"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-2xl bg-rose-500 text-white font-extrabold text-sm shadow">
                          Mesa {call.tableNumber}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {call.createdAt}
                        </span>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    </div>

                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-2xl border border-white/5">
                      {getCallIcon(call.reason)}
                      <span className="text-xs font-bold text-white">
                        {call.reason}
                      </span>
                    </div>

                    <button
                      onClick={() => markCallAnswered(call.id)}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marcar como Atendido</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER: INSPECTOR DA MESA SELECIONADA */}
      {selectedTableForDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedTableForDrawer(null)}
        >
          <div
            className="w-full max-w-md h-full bg-[#111116] border-l border-white/10 p-6 flex flex-col justify-between text-white shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: 'max(1rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500 text-black font-extrabold text-base">
                    Mesa {selectedTableForDrawer}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Detalhes da Mesa
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTableForDrawer(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table active calls */}
              {calls.filter((c) => c.tableNumber === selectedTableForDrawer && c.status === 'aguardando').map((call) => (
                <div key={call.id} className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">Chamada Ativa ({call.reason})</span>
                    <button
                      onClick={() => markCallAnswered(call.id)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500 text-black text-xs font-bold cursor-pointer"
                    >
                      Atender
                    </button>
                  </div>
                </div>
              ))}

              {/* Table Orders */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Comandas desta Mesa
                </h4>

                {orders.filter((o) => o.tableNumber === selectedTableForDrawer).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    Nenhum pedido lançado para a Mesa {selectedTableForDrawer}.
                  </p>
                ) : (
                  orders.filter((o) => o.tableNumber === selectedTableForDrawer).map((o) => (
                    <div key={o.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-zinc-400">#{o.id} ({o.createdAt})</span>
                        {getStatusBadge(o.status)}
                      </div>
                      <div className="space-y-1">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-300">
                            <span>{it.quantity}x {it.dish.name}</span>
                            <span className="font-mono text-zinc-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.dish.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setPosTable(selectedTableForDrawer);
                  setSelectedTableForDrawer(null);
                  setShowNewOrderModal(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Pratos nesta Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAMENTO DE NOVO PEDIDO MANUAL DO GARÇOM */}
      {showNewOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowNewOrderModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] bg-[#14141a] border border-white/15 rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-lg font-bold text-white">
                Lançar Pedido no Salão
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePosOrder} className="flex-grow overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Mesa Destino:
                </label>
                <select
                  value={posTable}
                  onChange={(e) => setPosTable(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                >
                  {tableList.map((t) => (
                    <option key={t.number} value={t.number} className="bg-[#14141a]">
                      Mesa {t.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Selecione os Pratos do Cardápio:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {dishes.map((dish) => {
                    const inCart = posCart.find((i) => i.dish.id === dish.id);

                    return (
                      <div
                        key={dish.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-white block truncate">{dish.name}</span>
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dish.price)}
                          </span>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-0.5 border border-white/10">
                            <button
                              type="button"
                              onClick={() =>
                                setPosCart((prev) =>
                                  prev
                                    .map((i) =>
                                      i.dish.id === dish.id ? { ...i, quantity: i.quantity - 1 } : i
                                    )
                                    .filter((i) => i.quantity > 0)
                                )
                              }
                              className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs">{inCart.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPosCart((prev) =>
                                  prev.map((i) =>
                                    i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
                                  )
                                )
                              }
                              className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPosCart((prev) => [...prev, { dish, quantity: 1 }])}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black text-xs font-bold transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Observações para a cozinha:
                </label>
                <input
                  type="text"
                  placeholder="Ex: sem cebola, ponto da carne..."
                  value={posNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={posCart.length === 0}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-black font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar e Enviar para Cozinha</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
