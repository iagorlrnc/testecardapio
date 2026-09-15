import React, { useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: string;
  onSaveTable: (table: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onSaveTable,
}) => {
  const [table, setTable] = useState(currentTable);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (table.trim()) {
      onSaveTable(table.trim());
      onClose();
    }
  };

  const sampleTables = ['01', '02', '03', '04', '05', '06', '07', '08', '12', 'VIP 1', 'Varanda 2', 'Balcão'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#111116] border border-white/15 rounded-3xl p-6 text-white shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg font-bold text-white">
              Identificação da Mesa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-300 font-semibold block mb-1.5">
              Número da Mesa onde você está sentado:
            </label>
            <input
              type="text"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 focus:border-emerald-400 text-white outline-none text-base font-bold transition-all"
              placeholder="Ex: 07"
              autoFocus
            />
          </div>

          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Escolha rápida:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {sampleTables.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTable(t)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate text-center ${
                    table === t
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Mesa</span>
          </button>
        </form>
      </div>
    </div>
  );
};
