import React, { useState, useRef, useCallback } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Dish } from '../../types/menu';
import {
  uploadPhotoToStorage,
  runFullPipeline,
  isTripoConfigured,
  resetSimulation,
} from '../../lib/tripoService';
import '@google/model-viewer';
import {
  Camera,
  Image as ImageIcon,
  FolderOpen,
  X,
  Sparkles,
  Check,
  RotateCcw,
  Box,
  Layers,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Upload,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PhotoSlot {
  id: 'frente' | 'fundo' | 'direita' | 'esquerda';
  label: string;
  sublabel: string;
  previewUrl: string | null;
  file: File | null;
  storageUrl: string | null; // URL in Supabase Storage
  uploading: boolean;
}

export const NovoPratoFoto: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const { addDish } = useRestaurant();

  const [itemType, setItemType] = useState<string>('prato');
  const [activeSlotMenu, setActiveSlotMenu] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: fotos, 2: tamanho, 3: IA gerando, 4: aprovar 3D
  const [plateWidthCm, setPlateWidthCm] = useState<number>(28);

  // AI Generation State
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedGlbUrl, setGeneratedGlbUrl] = useState<string>('');
  const [generatedUsdzUrl, setGeneratedUsdzUrl] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Dish details for publishing
  const [dishName, setDishName] = useState<string>('');
  const [dishPrice, setDishPrice] = useState<number>(0);
  const [dishCategory, setDishCategory] = useState<string>('principais');
  const [dishServes, setDishServes] = useState<string>('Serve 1 a 2 pessoas');
  const [dishDesc, setDishDesc] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSlotForInput, setSelectedSlotForInput] = useState<string | null>(null);

  // Generate a stable dish ID for this session
  const dishIdRef = useRef<string>(`dish-ai-${Date.now()}`);

  // 4 Photo Slots
  const [slots, setSlots] = useState<PhotoSlot[]>([
    {
      id: 'frente',
      label: 'Frente',
      sublabel: 'Ângulo principal (0°)',
      previewUrl: null,
      file: null,
      storageUrl: null,
      uploading: false,
    },
    {
      id: 'fundo',
      label: 'Fundo',
      sublabel: 'Parte de trás (180°)',
      previewUrl: null,
      file: null,
      storageUrl: null,
      uploading: false,
    },
    {
      id: 'direita',
      label: 'Direita',
      sublabel: '90° à direita',
      previewUrl: null,
      file: null,
      storageUrl: null,
      uploading: false,
    },
    {
      id: 'esquerda',
      label: 'Esquerda',
      sublabel: '90° à esquerda',
      previewUrl: null,
      file: null,
      storageUrl: null,
      uploading: false,
    },
  ]);

  const filledCount = slots.filter((s) => s.previewUrl !== null).length;
  const uploadingCount = slots.filter((s) => s.uploading).length;
  const allUploaded = slots.filter((s) => s.file !== null).every((s) => s.storageUrl !== null);

  const handleOpenSlotMenu = (slotId: string) => {
    setActiveSlotMenu(activeSlotMenu === slotId ? null : slotId);
  };

  const handleSelectSource = (source: 'library' | 'camera' | 'file', slotId: string) => {
    setActiveSlotMenu(null);
    setSelectedSlotForInput(slotId);
    if (fileInputRef.current) {
      if (source === 'camera') {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSlotForInput) {
      const objectUrl = URL.createObjectURL(file);
      const slotId = selectedSlotForInput;

      // Set preview immediately with the file reference
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId
            ? { ...s, previewUrl: objectUrl, file, uploading: true, storageUrl: null }
            : s
        )
      );

      // Upload to Supabase Storage in background
      try {
        const storageUrl = await uploadPhotoToStorage(file, dishIdRef.current, slotId);
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId ? { ...s, storageUrl, uploading: false } : s
          )
        );
      } catch (err: any) {
        console.error('Photo upload error:', err);
        // Still keep the preview, just mark as not uploading
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? { ...s, uploading: false, storageUrl: objectUrl }
              : s
          )
        );
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearSlot = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, previewUrl: null, file: null, storageUrl: null, uploading: false }
          : s
      )
    );
  };

  // Start the real AI generation pipeline
  const handleStartAIGeneration = useCallback(async () => {
    setStep(3);
    setAiProgress(0);
    setAiError(null);
    setAiStatusMessage('Preparando fotos para envio...');
    resetSimulation();

    // Gather all uploaded photo URLs
    const photoSlots = slots.filter((s) => s.storageUrl || s.previewUrl);
    if (photoSlots.length === 0) {
      setAiError('Nenhuma foto disponível. Volte e adicione pelo menos 1 foto.');
      return;
    }

    const primaryUrl = photoSlots[0].storageUrl || photoSlots[0].previewUrl!;
    const additionalUrls = photoSlots
      .slice(1)
      .map((s) => s.storageUrl || s.previewUrl!)
      .filter(Boolean);

    // Run the full pipeline
    await runFullPipeline(
      primaryUrl,
      additionalUrls,
      plateWidthCm,
      dishIdRef.current,
      {
        onProgress: (progress, message) => {
          setAiProgress(progress);
          setAiStatusMessage(message);
        },
        onComplete: (glbUrl, usdzUrl) => {
          setGeneratedGlbUrl(glbUrl);
          setGeneratedUsdzUrl(usdzUrl || '');
          setStep(4);
          setIsRegenerating(false);
        },
        onError: (error) => {
          setAiError(error);
          setIsRegenerating(false);
        },
      }
    );
  }, [slots, plateWidthCm]);

  // Regenerate 3D model with same photos
  const handleRegenerate = useCallback(() => {
    setIsRegenerating(true);
    setGeneratedGlbUrl('');
    setGeneratedUsdzUrl('');
    dishIdRef.current = `dish-ai-${Date.now()}`; // New ID so the model doesn't overwrite
    handleStartAIGeneration();
  }, [handleStartAIGeneration]);

  const handlePublishDish = () => {
    const sourcePhotoUrls = slots
      .filter((s) => s.storageUrl || s.previewUrl)
      .map((s) => s.storageUrl || s.previewUrl!);

    const newDish: Dish = {
      id: dishIdRef.current,
      name: dishName || 'Novo Prato',
      subtitle: `${itemType.toUpperCase()} • Gerado por IA 3D`,
      category:
        dishCategory === 'entradas'
          ? 'entradas'
          : dishCategory === 'sobremesas'
            ? 'sobremesas'
            : dishCategory === 'bebidas'
              ? 'bebidas'
              : 'principais',
      price: Number(dishPrice) || 0,
      description: dishDesc || 'Prato criado com tecnologia de reconstrução 3D por IA.',
      longDescription: `${dishDesc || 'Prato criado com tecnologia de reconstrução 3D por IA.'} Modelo tridimensional reconstruído automaticamente a partir de ${sourcePhotoUrls.length} foto(s) em escala 1:1 (${plateWidthCm} cm). Pronto para projeção na mesa do cliente via Realidade Aumentada.`,
      ingredients: ['Ingredientes Selecionados'],
      allergens: ['Verifique com o garçom'],
      tags: ['Novo no Cardápio', 'Gerado por IA', '3D / AR'],
      thumbnail: sourcePhotoUrls[0] || '/images/shishkebab.jpg',
      poster: sourcePhotoUrls[0] || '/images/shishkebab.jpg',
      glbUrl: generatedGlbUrl,
      usdzUrl: generatedUsdzUrl || '',
      featured: true,
      shadowIntensity: 1.2,
      exposure: 1.1,
      nutrition: {
        calories: 0,
        serves: dishServes || 'Serve 1 a 2 pessoas',
        prepTime: '15 - 20 min',
        chefSpecial: true,
      },
      // 3D Generation tracking
      sourcePhotos: sourcePhotoUrls,
      tripoTaskId: '',
      modelStatus: 'ready',
      plateWidthCm,
    };

    addDish(newDish);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22C55E', '#FCD34D', '#FFFFFF'],
    });

    setTimeout(() => {
      onCreated();
    }, 1500);
  };

  const isApiConfigured = isTripoConfigured();

  return (
    <div className="w-full max-w-5xl mx-auto text-white select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INTERACTIVE FORM (7 COLS) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#111116] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Novo prato por foto
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Fotografe o prato e a IA monta o modelo 3D autêntico.
              {!isApiConfigured && (
                <span className="block text-amber-400 mt-1 font-medium">
                  ⚠ Modo demonstração — configure VITE_TRIPO_API_KEY no .env para geração real
                </span>
              )}
            </p>
          </div>

          {/* ============================================================= */}
          {/* STEP 1: PHOTOS */}
          {/* ============================================================= */}
          {step === 1 && (
            <>
              {/* Tipo de item */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Tipo de item
                </label>
                <p className="text-[11px] text-zinc-500">
                  Escolha antes das fotos: é ele que define qual medida vamos pedir e quanto detalhe a IA vai gerar.
                </p>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white text-sm outline-none focus:border-emerald-400 transition-all cursor-pointer"
                >
                  <option value="prato" className="bg-[#111116]">Prato Executivo / Gourmet</option>
                  <option value="lanche" className="bg-[#111116]">Hambúrguer / Lanche Artesanal</option>
                  <option value="pizza" className="bg-[#111116]">Pizza / Torta</option>
                  <option value="sobremesa" className="bg-[#111116]">Sobremesa</option>
                  <option value="bebida" className="bg-[#111116]">Bebida / Coquetel</option>
                </select>
              </div>

              {/* Fotos do prato (X/4) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">
                    Fotos do prato ({filledCount}/4)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {uploadingCount > 0
                      ? `Enviando ${uploadingCount} foto(s)...`
                      : filledCount >= 2
                        ? '✓ Fotos suficientes para iniciar'
                        : 'Mínimo 1 foto, recomendado 3 ou 4'}
                  </span>
                </div>

                {/* 4 slots grid */}
                <div className="grid grid-cols-2 gap-3 relative">
                  {slots.map((slot) => {
                    const hasPhoto = slot.previewUrl !== null;
                    const isMenuOpen = activeSlotMenu === slot.id;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => !hasPhoto && handleOpenSlotMenu(slot.id)}
                        className={`relative aspect-[4/3] rounded-2xl border transition-all flex flex-col items-center justify-center p-3 text-center overflow-hidden cursor-pointer ${
                          hasPhoto
                            ? 'border-emerald-500/50 bg-black/60 shadow-lg'
                            : 'border-white/10 hover:border-emerald-400/50 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        {hasPhoto ? (
                          <>
                            <img
                              src={slot.previewUrl!}
                              alt={slot.label}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                            {/* Upload status indicator */}
                            {slot.uploading ? (
                              <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-md">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Enviando...</span>
                              </div>
                            ) : slot.storageUrl ? (
                              <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-black/70 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3" />
                                <span>Enviada</span>
                              </div>
                            ) : null}

                            <span className="absolute bottom-2 left-2 text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">
                              {slot.label}
                            </span>

                            <button
                              onClick={(e) => handleClearSlot(slot.id, e)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-zinc-300 hover:text-rose-400 flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                              title="Remover foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Camera className="w-6 h-6 text-zinc-500 mb-1.5" />
                            <span className="text-xs font-bold text-white block">
                              {slot.label}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              {slot.sublabel}
                            </span>
                          </>
                        )}

                        {/* Dropdown menu */}
                        {isMenuOpen && (
                          <div
                            className="absolute inset-x-2 bottom-2 z-30 bg-[#1e1e24] border border-white/20 rounded-xl p-1 shadow-2xl space-y-1 animate-fadeIn text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleSelectSource('library', slot.id)}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-zinc-200 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Galeria de Fotos</span>
                            </button>
                            <button
                              onClick={() => handleSelectSource('camera', slot.id)}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-zinc-200 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tirar Foto</span>
                            </button>
                            <button
                              onClick={() => handleSelectSource('file', slot.id)}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-zinc-200 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Escolher Arquivo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-zinc-400 leading-relaxed">
                <p className="font-semibold text-zinc-300">
                  💡 Cada foto gera um modelo 3D <strong className="text-emerald-400">único e autêntico</strong> — nunca reutilizado de outro prato.
                </p>
                <p className="text-[11px]">
                  • Não mexa na comida entre as fotos, mantenha a mesma luz e a mesma distância.
                </p>
                <p className="text-[11px]">
                  • Fotografe de cima, uns 45° — como quem está sentado olhando para o prato.
                </p>
                <p className="text-[11px]">
                  • A comida deve preencher o quadro. Evite fundo com taças, talheres ou decoração.
                </p>
              </div>

              {/* Step 1 Button */}
              <button
                onClick={() => setStep(2)}
                disabled={filledCount === 0 || uploadingCount > 0}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aguardando upload de {uploadingCount} foto(s)...</span>
                  </>
                ) : (
                  <>
                    <span>Avançar para Medida do Prato</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* ============================================================= */}
          {/* STEP 2: SIZE CALIBRATION */}
          {/* ============================================================= */}
          {step === 2 && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Passo 02 • Calibração de Escala
                </span>
                <h3 className="font-serif text-xl font-bold text-white">
                  Qual o diâmetro / largura do prato?
                </h3>
                <p className="text-xs text-zinc-400">
                  Essa medida em centímetros é fundamental para o prato aparecer sobre a mesa do cliente no tamanho real exato (1:1), sem distorções.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Largura da louça:
                  </span>
                  <span className="text-2xl font-serif font-bold text-emerald-400">
                    {plateWidthCm} cm
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="50"
                  value={plateWidthCm}
                  onChange={(e) => setPlateWidthCm(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>10 cm (Xícara/Sobremesa)</span>
                  <span>28 cm (Prato Padrão)</span>
                  <span>45 cm (Pizza Família)</span>
                </div>
              </div>

              {/* Dish details (name, price, description) */}
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Detalhes do Prato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Nome do Prato *</label>
                    <input
                      type="text"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="Ex: Filé Mignon ao Molho Madeira"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dishPrice || ''}
                      onChange={(e) => setDishPrice(Number(e.target.value))}
                      placeholder="85.00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Categoria</label>
                    <select
                      value={dishCategory}
                      onChange={(e) => setDishCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#111116] border border-white/15 text-white text-xs outline-none focus:border-emerald-400"
                    >
                      <option value="principais">Prato Principal</option>
                      <option value="entradas">Entrada</option>
                      <option value="sobremesas">Sobremesa</option>
                      <option value="bebidas">Bebida</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Serve</label>
                    <select
                      value={dishServes}
                      onChange={(e) => setDishServes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#111116] border border-white/15 text-white text-xs outline-none focus:border-emerald-400"
                    >
                      <option value="Serve 1 pessoa">Serve 1 pessoa</option>
                      <option value="Serve 1 a 2 pessoas">Serve 1 a 2 pessoas</option>
                      <option value="Serve 2 a 3 pessoas">Serve 2 a 3 pessoas</option>
                      <option value="Serve 3 a 4 pessoas">Serve 3 a 4 pessoas</option>
                      <option value="Serve 4+ pessoas">Serve 4+ pessoas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={dishDesc}
                    onChange={(e) => setDishDesc(e.target.value)}
                    placeholder="Descreva o prato, seus ingredientes e preparo..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleStartAIGeneration}
                  disabled={!dishName.trim()}
                  className="flex-grow py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Modelo 3D com IA</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: AI GENERATING */}
          {/* ============================================================= */}
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
              {aiError ? (
                // Error state
                <div className="space-y-4 max-w-sm">
                  <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Erro na Geração 3D
                  </h3>
                  <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                    {aiError}
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setStep(1);
                        setAiError(null);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-semibold cursor-pointer"
                    >
                      Trocar Fotos
                    </button>
                    <button
                      onClick={handleStartAIGeneration}
                      className="flex-grow py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar Novamente</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Progress state
                <>
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                    <div className="w-full h-full rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                      <Box className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <h3 className="font-serif text-xl font-bold text-white">
                      {isRegenerating ? 'Regenerando modelo 3D...' : 'A IA está montando seu prato 3D...'}
                    </h3>
                    <p className="text-xs text-emerald-400/90 font-medium">
                      {aiStatusMessage}
                    </p>
                  </div>

                  <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-500"
                      style={{ width: `${aiProgress}%` }}
                    />
                  </div>

                  <span className="text-xs text-zinc-500">
                    {aiProgress}% concluído • {isTripoConfigured() ? 'Tripo 3D AI Pipeline' : 'Modo Demonstração'}
                  </span>

                  {!isTripoConfigured() && (
                    <p className="text-[11px] text-amber-400/70 max-w-xs">
                      Modo demo: usando modelo pré-existente. Configure VITE_TRIPO_API_KEY para gerar modelos reais.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4: APPROVE & PUBLISH */}
          {/* ============================================================= */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Modelo 3D Gerado com Sucesso!</span>
              </div>

              {/* 3D Interactive Preview */}
              <div className="relative w-full h-64 rounded-2xl bg-gradient-to-b from-[#18181f] to-[#0d0d10] border border-emerald-500/40 overflow-hidden shadow-inner">
                {generatedGlbUrl && (
                  <model-viewer
                    src={generatedGlbUrl}
                    alt={dishName || 'Prato Gerado pela IA'}
                    camera-controls
                    auto-rotate
                    shadow-intensity="1.2"
                    exposure="1.1"
                    environment-image="neutral"
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
                <div className="absolute bottom-2 left-3 text-[11px] text-zinc-400 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full pointer-events-none">
                  Gire para inspecionar antes de aprovar
                </div>
                <div className="absolute top-2 right-3 text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Escala 1:1 ({plateWidthCm} cm)
                </div>
                {!isTripoConfigured() && (
                  <div className="absolute top-2 left-3 text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    Demo Mode
                  </div>
                )}
              </div>

              {/* Editable Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nome do Prato</label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dishPrice || ''}
                    onChange={(e) => setDishPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              {/* Source photos preview strip */}
              {slots.filter((s) => s.previewUrl).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-500 font-medium">Fotos originais usadas:</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {slots
                      .filter((s) => s.previewUrl)
                      .map((s) => (
                        <img
                          key={s.id}
                          src={s.previewUrl!}
                          alt={s.label}
                          className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Gerar Novamente</span>
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setGeneratedGlbUrl('');
                    setGeneratedUsdzUrl('');
                  }}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Tirar Outras Fotos
                </button>
                <button
                  onClick={handlePublishDish}
                  disabled={!generatedGlbUrl || !dishName.trim()}
                  className="flex-grow py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprovar e Publicar no Cardápio</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 3 PROCESS CARDS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* CARD 01 */}
          <div className={`p-6 rounded-3xl bg-[#111116] border transition-all space-y-2 ${
            step === 1 ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-white/10 hover:border-emerald-500/30'
          }`}>
            <span className="font-mono text-xs font-bold text-emerald-400 block tracking-widest">
              01
            </span>
            <h3 className="font-serif text-lg font-bold text-white">
              Manda 3 ou 4 fotos
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Do mesmo prato, em ângulos diferentes. Celular comum resolve. O que importa é a comida preencher o quadro. Cada foto gera um modelo <strong className="text-emerald-400">único e exclusivo</strong>.
            </p>
          </div>

          {/* CARD 02 */}
          <div className={`p-6 rounded-3xl bg-[#111116] border transition-all space-y-2 ${
            step === 2 ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-white/10 hover:border-emerald-500/30'
          }`}>
            <span className="font-mono text-xs font-bold text-emerald-400 block tracking-widest">
              02
            </span>
            <h3 className="font-serif text-lg font-bold text-white">
              Diz o tamanho e os detalhes
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              A largura do prato em centímetros, nome, preço e descrição. É esse número que faz o modelo aparecer na mesa do cliente no tamanho certo.
            </p>
          </div>

          {/* CARD 03 */}
          <div className={`p-6 rounded-3xl bg-[#111116] border transition-all space-y-2 ${
            step >= 3 ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-white/10 hover:border-emerald-500/30'
          }`}>
            <span className="font-mono text-xs font-bold text-emerald-400 block tracking-widest">
              03
            </span>
            <h3 className="font-serif text-lg font-bold text-white">
              Aprova e publica
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Você gira o resultado antes de qualquer coisa ir ao ar. Não gostou? Pede para montar de novo, com as mesmas fotos. O modelo gerado é <strong className="text-emerald-400">exclusivo deste prato</strong>.
            </p>
          </div>

          {/* API Status Card */}
          <div className={`p-4 rounded-2xl border space-y-1 ${
            isTripoConfigured()
              ? 'bg-emerald-500/5 border-emerald-500/30'
              : 'bg-amber-500/5 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isTripoConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className={`text-xs font-bold ${
                isTripoConfigured() ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                {isTripoConfigured() ? 'Tripo 3D AI Conectada' : 'Modo Demonstração'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {isTripoConfigured()
                ? 'IA de reconstrução 3D ativa. Modelos gerados são autênticos e únicos.'
                : 'Configure VITE_TRIPO_API_KEY no .env para ativar a geração 3D real via Tripo 3D AI.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
