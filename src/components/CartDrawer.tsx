import React, { useState } from 'react';
import { CartItem } from '../types/menu';
import { useRestaurant } from '../context/RestaurantContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ChefHat,
  Receipt,
  Users,
  CreditCard,
  Copy,
  Check,
  Utensils,
  BellRing,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  tableNumber: string;
  onUpdateQuantity: (dishId: string, delta: number) => void;
  onRemoveItem: (dishId: string) => void;
  onClearCart: () => void;
  onOpenWaiterCall?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenWaiterCall,
}) => {
  const { addOrder, orders, addCall, settings } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'carrinho' | 'pedidos_mesa' | 'dividir_conta'>('carrinho');
  const [orderSent, setOrderSent] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [splitCount, setSplitCount] = useState<number>(2);
  const [includeServiceFee, setIncludeServiceFee] = useState<boolean>(true);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [calledBill, setCalledBill] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Orders placed by this table
  const tableOrders = orders.filter((o) => o.tableNumber === tableNumber);
  const tableOrdersTotal = tableOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const cartTotal = items.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

  const totalComandaValue = tableOrdersTotal + cartTotal;

  // Split calculation
  const totalWithService = includeServiceFee
    ? totalComandaValue * 1.1
    : totalComandaValue;
  const perPersonAmount = splitCount > 0 ? totalWithService / splitCount : totalWithService;

  const formattedCartTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cartTotal);

  const formattedComandaTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalComandaValue);

  const formattedPerPerson = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(perPersonAmount);

  const handleSendOrder = () => {
    if (items.length === 0) return;

    addOrder(tableNumber, items, customerNotes);

    setOrderSent(true);
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#FCD34D', '#FFFFFF'],
    });

    setTimeout(() => {
      setOrderSent(false);
      setCustomerNotes('');
      onClearCart();
      setActiveTab('pedidos_mesa');
    }, 2000);
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(settings.pixKey || 'financeiro@degustar.io');
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      setCopiedPix(true);
    }
  };

  const handleRequestBill = () => {
    addCall(tableNumber, 'Pedir a Conta');
    setCalledBill(true);
    setTimeout(() => setCalledBill(false), 3000);
  };

  const getOrderStatusDisplay = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3" />
            Fila de Espera
          </span>
        );
      case 'preparando':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
            <ChefHat className="w-3 h-3" />
            Em Preparo
          </span>
        );
      case 'pronto':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full animate-bounce">
            <Sparkles className="w-3 h-3" />
            Pronto p/ Servir!
          </span>
        );
      case 'entregue':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Entregue na Mesa
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full bg-[#0d0d12] border-l border-white/10 flex flex-col justify-between text-white shadow-2xl animate-slideUp"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Comanda da Mesa
              </h2>
              <span className="px-2.5 py-0.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                Mesa {tableNumber}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/5 mt-3 text-xs">
            <button
              onClick={() => setActiveTab('carrinho')}
              className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'carrinho'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Novos Itens</span>
              {items.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'carrinho' ? 'bg-black text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pedidos_mesa')}
              className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pedidos_mesa'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Pedidos ao Vivo</span>
              {tableOrders.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'pedidos_mesa' ? 'bg-black text-emerald-300' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {tableOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dividir_conta')}
              className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'dividir_conta'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rachar</span>
            </button>
          </div>
        </div>

        {/* Order Sent Animation State */}
        {orderSent ? (
          <div className="p-8 flex flex-col items-center justify-center text-center my-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              Pedido Enviado à Cozinha!
            </h3>
            <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">
              Os pratos da <strong>Mesa {tableNumber}</strong> já entraram na fila de preparo. Acompanhe o status nesta mesma tela.
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: UNCONFIRMED CART ITEMS */}
            {activeTab === 'carrinho' && (
              <div className="flex-grow overflow-y-auto px-5 py-4 space-y-3.5 divide-y divide-white/5">
                {items.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-600">
                      <Sparkles className="w-7 h-7 text-emerald-400/50" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Nenhum item pendente
                    </p>
                    <p className="text-xs max-w-xs mx-auto text-zinc-400">
                      Explore os pratos em 3D, selecione seus favoritos e envie para a cozinha quando estiver pronto.
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    const itemSubtotal = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(item.dish.price * item.quantity);

                    return (
                      <div
                        key={item.dish.id}
                        className="pt-3.5 first:pt-0 flex items-center justify-between gap-3"
                      >
                        <img
                          src={item.dish.thumbnail}
                          alt={item.dish.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <h4 className="font-serif text-sm font-bold text-white truncate">
                            {item.dish.name}
                          </h4>
                          <span className="text-xs text-emerald-400 font-bold font-mono">
                            {itemSubtotal}
                          </span>

                          {item.notes && (
                            <p className="text-[10px] text-amber-300/90 italic truncate mt-0.5">
                              "{item.notes}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-0.5 border border-white/10">
                              <button
                                onClick={() => onUpdateQuantity(item.dish.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-extrabold w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.dish.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.dish.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: LIVE ORDERS PLACED IN KITCHEN */}
            {activeTab === 'pedidos_mesa' && (
              <div className="flex-grow overflow-y-auto px-5 py-4 space-y-4">
                {tableOrders.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-600">
                      <ChefHat className="w-7 h-7 text-emerald-400/50" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Nenhum pedido enviado ainda
                    </p>
                    <p className="text-xs max-w-xs mx-auto text-zinc-400">
                      Assim que você confirmar seus pratos, a evolução do preparo pelo Chef aparecerá aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  tableOrders.map((order) => {
                    const formattedOrderTotal = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(order.total);

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-zinc-400 font-bold">
                              Pedido #{order.id}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {order.createdAt}
                            </span>
                          </div>
                          {getOrderStatusDisplay(order.status)}
                        </div>

                        {/* Order items */}
                        <div className="space-y-1.5 text-xs divide-y divide-white/5">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="pt-1.5 first:pt-0 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center font-bold text-emerald-400 text-[11px]">
                                  {it.quantity}x
                                </span>
                                <span className="text-zinc-200 font-medium">
                                  {it.dish.name}
                                </span>
                              </div>
                              <span className="font-mono text-zinc-400">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(it.dish.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.customerNotes && (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                            <strong>Obs:</strong> {order.customerNotes}
                          </div>
                        )}

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold">
                          <span className="text-zinc-400">Total deste envio:</span>
                          <span className="font-mono text-emerald-400">
                            {formattedOrderTotal}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: SPLIT BILL CALCULATOR */}
            {activeTab === 'dividir_conta' && (
              <div className="flex-grow overflow-y-auto px-5 py-4 space-y-5">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#13131a] to-[#0c0c10] border border-white/10 space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-xs text-zinc-400 font-medium">
                      Valor por pessoa (Mesa {tableNumber})
                    </span>
                    <h3 className="font-mono text-3xl font-extrabold text-emerald-400">
                      {formattedPerPerson}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-semibold">
                        Número de pessoas na mesa:
                      </span>
                      <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-2xl p-1">
                        <button
                          onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                          disabled={splitCount <= 1}
                          className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-sm w-4 text-center">
                          {splitCount}
                        </span>
                        <button
                          onClick={() => setSplitCount(splitCount + 1)}
                          className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-1">
                      <span>Incluir taxa de serviço (10%)</span>
                      <input
                        type="checkbox"
                        checked={includeServiceFee}
                        onChange={(e) => setIncludeServiceFee(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Pix Key and Bill Request */}
                <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Chave Pix do Restaurante
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {settings.pixKey || 'financeiro@degustar.io'}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyPix}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Pix</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleRequestBill}
                    className="w-full py-3 rounded-2xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-xs font-bold text-zinc-300 hover:text-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>{calledBill ? 'Garçom Notificado p/ Trazer a Conta!' : 'Solicitar Conta com Garçom'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer Summary & Order Action */}
            <div className="px-5 py-4 border-t border-white/10 bg-[#08080c]/90 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-zinc-400">Total Consumido na Mesa</span>
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-400">
                  {formattedComandaTotal}
                </span>
              </div>

              {activeTab === 'carrinho' && items.length > 0 && (
                <>
                  <input
                    type="text"
                    placeholder="Observação geral para a cozinha..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 text-xs outline-none focus:border-emerald-400 transition-all"
                  />

                  <button
                    onClick={handleSendOrder}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-sm shadow-[0_8px_25px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmar e Enviar Pedido ({formattedCartTotal})</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
