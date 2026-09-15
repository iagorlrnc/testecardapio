import React from 'react';
import { Smartphone, Move, CheckCircle2, X, Sparkles, Box } from 'lucide-react';

interface ARGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAR: () => void;
}

export const ARGuideModal: React.FC<ARGuideModalProps> = ({
  isOpen,
  onClose,
  onProceedAR,
}) => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#141418] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-amber-400">
            <Box className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-white">
              Como Ver na Sua Mesa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="py-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Permita o acesso à câmera
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                O navegador solicitará permissão. É 100% seguro e não grava nada.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Aponte para a mesa e mova suavemente
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Faça movimentos circulares lentos com o celular para que o sistema identifique a superfície da mesa.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Prato projetado em escala real 1:1
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ande ao redor da mesa para ver o prato de qualquer ângulo como se já estivesse servido.
              </p>
            </div>
          </div>
        </div>

        {/* Compatibility info */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5 text-[11px] text-zinc-300 mb-5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Compatível com iPhone (AR Quick Look) e Android (Google Scene Viewer).
          </span>
        </div>

        {/* Action button */}
        <button
          onClick={onProceedAR}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Ativar Realidade Aumentada</span>
          <Move className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
