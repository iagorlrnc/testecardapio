import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { Dish } from '../types/menu';
import { ModelViewerElement } from '../types/model-viewer';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  User,
  ExternalLink,
  Copy,
  Layers,
  Wine,
  AlertCircle,
  Sun,
  Moon,
  Maximize2,
  Clock,
  Heart,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DishDetailModalProps {
  dish: Dish | null;
  onClose: () => void;
  onAddToCart: (dish: Dish, quantity: number, notes?: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (dishId: string) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  dish,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const modelViewerRef = useRef<ModelViewerElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [showPreCameraGuide, setShowPreCameraGuide] = useState<boolean>(false);
  const [showInstagramBrowserSheet, setShowInstagramBrowserSheet] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'warm' | 'studio' | 'neutral'>('warm');
  const [modelError, setModelError] = useState<boolean>(false);

  // Check if inside In-App browser (Instagram, TikTok, Facebook)
  const isAppBrowser = () => {
    const ua = navigator.userAgent || '';
    return /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|Line\/|Snapchat/i.test(ua);
  };

  useEffect(() => {
    if (!dish) return;

    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTop = 0;
    }
    setQuantity(1);
    setItemNotes('');
    setAddedSuccess(false);
    setShowPreCameraGuide(false);
    setShowInstagramBrowserSheet(false);
    setModelError(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPreCameraGuide) {
          setShowPreCameraGuide(false);
        } else if (showInstagramBrowserSheet) {
          setShowInstagramBrowserSheet(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dish, showPreCameraGuide, showInstagramBrowserSheet, onClose]);

  if (!dish) return null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(dish.price);

  const formattedSubtotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(dish.price * quantity);

  const handleTriggerARClick = () => {
    if (isAppBrowser()) {
      setShowInstagramBrowserSheet(true);
      return;
    }
    setShowPreCameraGuide(true);
  };

  const handleOpenNativeAR = () => {
    setShowPreCameraGuide(false);
    if (modelViewerRef.current) {
      try {
        modelViewerRef.current.activateAR();
      } catch (err) {
        console.warn('Erro ao acionar AR:', err);
      }
    }
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
      modelViewerRef.current.cameraTarget = 'auto auto auto';
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(dish, quantity, itemNotes.trim() ? itemNotes.trim() : undefined);
    setAddedSuccess(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#10B981', '#34D399', '#FCD34D', '#FFFFFF'],
    });
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      ref={modalContainerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-title"
      className="fixed inset-0 z-50 flex flex-col bg-[#08080a] text-white overflow-y-auto overscroll-contain select-none animate-fadeIn"
    >
      {/* Top Floating Header (Mobile / Tablet) */}
      <header
        className="lg:hidden sticky top-0 z-40 w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-[#08080a]/95 via-[#08080a]/70 to-transparent backdrop-blur-xl border-b border-white/[0.06]"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer text-sm font-semibold py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(dish.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-md'
                  : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Favoritar prato"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-400' : ''}`} />
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visualização</span>
            <span>3D & AR</span>
          </div>
        </div>
      </header>

      {/* Main Container: Split View on lg (1024px+), Vertical on Mobile/Tablet */}
      <div className="w-full flex-grow flex flex-col lg:grid lg:grid-cols-12 lg:h-full lg:overflow-hidden">
        {/* 3D Model Viewport Stage (Left side on Desktop / Top on Mobile) */}
        <section
          aria-label="Palco 3D do Prato"
          className="relative w-full h-[46vh] sm:h-[50vh] lg:h-full lg:col-span-7 flex items-center justify-center overflow-hidden shrink-0"
          style={{
            background:
              lightingMode === 'warm'
                ? 'radial-gradient(circle at 50% 45%, #181c1c 0%, #08080a 75%)'
                : lightingMode === 'studio'
                ? 'radial-gradient(circle at 50% 45%, #20242a 0%, #08080a 75%)'
                : 'radial-gradient(circle at 50% 45%, #141718 0%, #08080a 75%)',
          }}
        >
          {/* Desktop Back button */}
          <div className="hidden lg:flex absolute top-6 left-6 z-20 items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer text-sm font-semibold py-2 px-4 rounded-2xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 shadow-xl"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Voltar ao Cardápio</span>
            </button>
          </div>

          <model-viewer
            ref={modelViewerRef as any}
            src={modelError ? '/models/cheese-bacon-burger.glb' : (dish.glbUrl || '/models/cheese-bacon-burger.glb')}
            ios-src={dish.usdzUrl}
            alt={dish.name}
            poster={dish.poster}
            camera-controls
            touch-action="pan-y"
            auto-rotate={autoRotate ? true : undefined}
            auto-rotate-delay="1500"
            rotation-per-second="18deg"
            shadow-intensity={dish.shadowIntensity || 1.2}
            exposure={dish.exposure || 1.1}
            environment-image="neutral"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            loading="eager"
            onError={() => {
              console.warn('DishDetailModal model-viewer failed to load glbUrl, falling back to default model');
              setModelError(true);
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <div slot="ar-button" />
          </model-viewer>

          {/* 3D Stage Floating Controls (Top Right) */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex flex-col gap-2 z-20">
            {/* Reset Camera */}
            <button
              onClick={handleResetCamera}
              className="p-3 rounded-2xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xl hover:scale-105"
              title="Resetar Câmera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Auto Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-3 rounded-2xl backdrop-blur-md border transition-all cursor-pointer shadow-xl hover:scale-105 text-xs font-bold ${
                autoRotate
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-black/60 hover:bg-black/85 border-white/15 text-zinc-400 hover:text-white'
              }`}
              title={autoRotate ? 'Pausar rotação automática' : 'Girar automaticamente'}
            >
              <span className="text-[11px] font-black">360°</span>
            </button>

            {/* Lighting Preset Switch */}
            <button
              onClick={() =>
                setLightingMode(
                  lightingMode === 'warm' ? 'studio' : lightingMode === 'studio' ? 'neutral' : 'warm'
                )
              }
              className="p-3 rounded-2xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-xl hover:scale-105"
              title="Trocar iluminação do prato (Quente, Estúdio, Neutra)"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>

          {/* Caption below 3D model */}
          <div className="absolute bottom-3 sm:bottom-6 inset-x-0 text-center text-xs text-zinc-400 pointer-events-none px-4 flex items-center justify-center gap-2">
            <span className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] shadow-lg text-zinc-300">
              ✨ Arraste para girar 360° • Pinça ou Scroll para aproximar
            </span>
          </div>
        </section>

        {/* Dish Details Content Panel (Right side on Desktop / Bottom Sheet on Mobile) */}
        <div
          className="w-full lg:col-span-5 bg-[#101014] rounded-t-[32px] lg:rounded-none border-t lg:border-t-0 lg:border-l border-white/[0.12] px-5 sm:px-8 py-7 space-y-6 flex-grow lg:overflow-y-auto shadow-[0_-15px_40px_rgba(0,0,0,0.8)] lg:shadow-none"
          style={{
            paddingBottom: 'max(7rem, calc(5.5rem + env(safe-area-inset-bottom)))',
          }}
        >
          {/* Title, Subtitle, Price & Favorite (Desktop) */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="dish-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
              >
                {dish.name}
              </h2>

              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 whitespace-nowrap">
                  {formattedPrice}
                </span>

                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(dish.id)}
                    className={`hidden lg:flex p-2 rounded-xl border transition-all cursor-pointer ${
                      isFavorite
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-md'
                        : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title="Favoritar prato"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {dish.subtitle && (
              <p className="text-xs font-medium text-amber-300/90 tracking-wide">
                {dish.subtitle}
              </p>
            )}
          </div>

          {/* Meta badges: Serves, Prep Time, Category */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-zinc-200">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{dish.nutrition?.serves || '1 pessoa'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-zinc-200">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{dish.nutrition?.prepTime || '15-20 min'}</span>
            </div>

            {dish.nutrition?.chefSpecial && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Destaque do Chef</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Sobre este prato
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              {dish.longDescription || dish.description}
            </p>
          </div>

          {/* Ingredients & Allergens Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ingredientes Principais
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1">
                  {dish.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dish.allergens && dish.allergens.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alérgenos</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {dish.allergens.map((alg, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-medium"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sommelier Drink Pairing Suggestion */}
          {dish.pairingRecommendation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#171c1b] to-[#121616] border border-emerald-500/30 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                  Harmonização Recomendada
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {dish.pairingRecommendation.drinkName}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {dish.pairingRecommendation.description}
                </p>
              </div>
            </div>
          )}

          {/* Real Augmented Reality Trigger Button */}
          <div className="pt-2 space-y-2.5">
            {dish.modelStatus === 'processing' ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-amber-300 font-bold text-sm">
                  Modelo 3D sendo gerado pela Inteligência Artificial...
                </span>
              </div>
            ) : dish.modelStatus === 'failed' ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2.5">
                <span className="text-rose-300 font-semibold text-sm">
                  Modelo 3D indisponível para este item.
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleTriggerARClick}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] text-[#022c22] font-extrabold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-[0_8px_30px_rgba(16,185,129,0.35)]"
                >
                  {/* Viewfinder AR Icon */}
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
                    <path d="M12 8.5l4 2.2v4.6l-4 2.2-4-2.2v-4.6z" />
                  </svg>
                  <span>Ver em Tamanho Real na Minha Mesa (AR)</span>
                </button>

                <p className="text-center text-xs text-zinc-400">
                  Compatível com iPhone (Quick Look) e Android (Scene Viewer) • Sem instalar apps
                </p>
              </>
            )}
          </div>

          {/* Quantity, Item Notes and Add to Cart Section */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Quantidade</span>
                <span className="text-[11px] text-zinc-400">Defina quantas porções deseja</span>
              </div>

              <div className="flex items-center gap-3 bg-black/60 border border-white/15 rounded-2xl p-1.5 shadow-inner">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-25 transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-base w-6 text-center text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Observations / Notes for Chef */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-medium block">
                Observação para a cozinha (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: ponto da carne, sem cebola, molho à parte..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white placeholder:text-zinc-600 text-xs outline-none transition-all"
              />
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddToCartClick}
              className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                addedSuccess
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-emerald-400/50 shadow-md'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Adicionado à Comanda da Mesa!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Adicionar à Comanda • {formattedSubtotal}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Pre-camera AR guide */}
      {showPreCameraGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowPreCameraGuide(false)}
        >
          <div
            className="w-full max-w-md bg-[#141419] border border-white/15 rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Antes de abrir a câmera
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dica rápida para o prato se posicionar perfeitamente na mesa.
                </p>
              </div>
              <button
                onClick={() => setShowPreCameraGuide(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ol className="space-y-3.5 py-1 text-xs">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="block text-white">Aponte para a mesa</strong>
                  <span className="text-zinc-400">A cerca de 40 a 50 cm de distância com boa luz.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="block text-white">Mova o celular suavemente</strong>
                  <span className="text-zinc-400">Em pequenos círculos para mapear a superfície plana.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="block text-white">Escala Real 1:1</strong>
                  <span className="text-zinc-400">O prato aparecerá no diâmetro exato servido na casa.</span>
                </div>
              </li>
            </ol>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleOpenNativeAR}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Abrir Câmera Agora
              </button>
              <button
                onClick={() => setShowPreCameraGuide(false)}
                className="w-full py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Instagram In-App Browser Fallback */}
      {showInstagramBrowserSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowInstagramBrowserSheet(false)}
        >
          <div
            className="w-full max-w-md bg-[#141419] border border-white/15 rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-serif text-xl font-bold text-white">
                Abra no navegador do celular
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                O navegador do Instagram não suporta a câmera 3D WebXR. No Safari (iPhone) ou Chrome (Android) funciona nativamente sem instalar nada.
              </p>
            </div>

            <ol className="space-y-3 py-1 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-white">Toque nos três pontinhos (•••)</strong>
                  <span className="block text-zinc-400">No canto superior ou inferior da tela.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-white">Escolha "Abrir no navegador externo"</strong>
                  <span className="block text-zinc-400">(Safari ou Chrome).</span>
                </div>
              </li>
            </ol>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? 'Link copiado com sucesso!' : 'Copiar link do cardápio'}</span>
              </button>
              <button
                onClick={() => setShowInstagramBrowserSheet(false)}
                className="w-full py-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
