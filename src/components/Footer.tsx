import React from 'react';
import { Instagram, MapPin, Clock, Phone, Sparkles, Box } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#070709] border-t border-white/[0.08] text-zinc-400 py-10 px-5 mt-12">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Box className="w-5 h-5" />
            <span className="font-serif text-2xl font-bold tracking-widest text-white">
              AURUM
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80">
            Atelier Gastronômico • Cardápio 3D & AR
          </span>
        </div>

        {/* Restaurant Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl py-4 border-y border-white/5 text-xs">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Alameda dos Chefs, 1040 - Jardins</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Terça a Domingo • 19h às 23h30</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>(11) 3456-7890</span>
          </div>
        </div>

        {/* Social Links & Dev credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl gap-4 text-xs">
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-amber-400" />
              <span>@aurum.gastronomia</span>
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Experiência Web 3D alimentada por Google WebXR</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 pt-2">
          © {new Date().getFullYear()} AURUM Gastronomia. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};
