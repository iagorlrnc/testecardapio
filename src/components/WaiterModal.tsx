import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { TableCallReason } from '../types/restaurant';
import { BellRing, CheckCircle2, X, Receipt, HelpCircle, Utensils, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
}

export const WaiterModal: React.FC<WaiterModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
}) => {
  const { addCall } = useRestaurant();
  const [called, setCalled] = useState(false);
  const [selectedReason, setSelectedReason] = useState<TableCallReason>('Atendimento na Mesa');

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

  const handleCall = (reason: TableCallReason) => {
    setSelectedReason(reason);
    addCall(tableNumber, reason);

    setCalled(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#FFFFFF'],
    });

    setTimeout(() => {
      setCalled(false);
      onClose();
    }, 2200);
  };

  const callOptions: {
    reason: TableCallReason;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      reason: 'Atendimento na Mesa',
      title: 'Atendimento na Mesa',
      description: 'Dúvidas sobre o cardápio, sugestões ou pedidos especiais',
      icon: <HelpCircle className="w-5 h-5 text-emerald-400" />,
    },
    {
      reason: 'Pedir a Conta',
      title: 'Pedir a Conta',
      description: 'Solicitar fechamento e máquina de cartão ou chave Pix',
      icon: <Receipt className="w-5 h-5 text-amber-400" />,
    },
    {
      reason: 'Talheres, Taças ou Gelo',
      title: 'Talheres, Taças ou Gelo',
      description: 'Itens de apoio, guardanapos ou balde de gelo',
      icon: <Utensils className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#111116] border border-emerald-500/30 rounded-3xl p-6 text-white shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white leading-tight">
                Chamar Garçom
              </h3>
              <span className="text-[11px] text-zinc-400">Mesa {tableNumber}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {called ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="font-serif text-2xl font-bold text-white">
              Chamada Notificada!
            </h4>
            <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">
              O garçom do salão já recebeu o chamado para a <strong>Mesa {tableNumber}</strong> ({selectedReason}).
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-2.5">
            <p className="text-xs text-zinc-400 mb-2">
              Escolha o tipo de solicitação rápida para agilizar o atendimento:
            </p>

            {callOptions.map((opt) => (
              <button
                key={opt.reason}
                onClick={() => handleCall(opt.reason)}
                className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/40 flex items-center gap-3.5 transition-all text-left cursor-pointer group active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-emerald-500/20 flex items-center justify-center shrink-0 transition-colors">
                  {opt.icon}
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors block">
                    {opt.title}
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
