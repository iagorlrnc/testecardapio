import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { signIn, setCurrentView } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    // Explicitly requesting 'admin' panel access
    const res = await signIn(email, password, 'admin');
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Falha na autenticação administrativa.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between px-4 py-8 select-none">
      {/* Top bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => setCurrentView('cliente')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </button>

        <span className="text-[11px] text-emerald-400 font-mono font-semibold">
          DegustAR • Gestão & Controle
        </span>
      </header>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto my-auto p-7 rounded-3xl bg-[#111116] border border-emerald-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Acesso Administrativo
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Área restrita exclusivamente para gerentes e administradores do restaurante.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-rose-200">Acesso Negado</strong>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-300 font-semibold block">
              Email do Administrador
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@seurestaurante.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-400 text-white placeholder:text-zinc-600 text-xs outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-300 font-semibold block">
              Senha Mestra
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-400 text-white placeholder:text-zinc-600 text-xs outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Autenticar como Administrador</span>
              </>
            )}
          </button>
        </form>
      </div>

      <footer className="text-center text-xs text-zinc-500 max-w-md mx-auto">
        Autenticado via <strong>Supabase Auth</strong> vinculado à tabela <code>public.profiles</code>.
      </footer>
    </div>
  );
};

