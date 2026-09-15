import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { Dish } from '../../types/menu';
import { NovoPratoFoto } from './NovoPratoFoto';
import '@google/model-viewer';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  UserPlus,
  Settings,
  Plus,
  Camera,
  Eye,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Box,
  Sparkles,
  Smartphone,
  Save,
  Check,
  X,
  Clock,
  LogOut,
  ArrowLeftRight,
  QrCode,
  Download,
  Printer,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type AdminTab =
  | 'dashboard'
  | 'novo-prato-foto'
  | 'cardapio'
  | 'pedidos'
  | 'qrcodes'
  | 'colaboradores'
  | 'solicitacoes'
  | 'configuracoes';

export const AdminDashboard: React.FC = () => {
  const {
    dishes,
    addDish,
    updateDish,
    deleteDish,
    orders,
    collaborators,
    addCollaborator,
    updateCollaboratorStatus,
    deleteCollaborator,
    collaboratorRequests,
    approveCollaboratorRequest,
    rejectCollaboratorRequest,
    settings,
    updateSettings,
  } = useRestaurant();

  const { profile, signOut, setCurrentView } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showAddDishModal, setShowAddDishModal] = useState<boolean>(false);
  const [testViewerDish, setTestViewerDish] = useState<Dish | null>(null);
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');

  // New Dish Form State
  const [newDishForm, setNewDishForm] = useState<Partial<Dish>>({
    name: '',
    price: 0,
    category: 'principais',
    description: '',
    longDescription: '',
    glbUrl: '',
    usdzUrl: '',
    thumbnail: '',
    poster: '',
    ingredients: [],
    allergens: [],
    tags: ['Especial da Casa'],
  });

  // Settings Form State
  const [tempSettings, setTempSettings] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Selected table for QR Code detail
  const [qrCodeTable, setQrCodeTable] = useState<string>('07');

  // KPIs
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const formattedRevenue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalRevenue);

  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const formattedAvgTicket = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(avgTicket);

  const pendingRequestsCount = collaboratorRequests.filter(
    (r) => r.status === 'pendente'
  ).length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(tempSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleCreateManualDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishForm.name || !newDishForm.price) return;

    const dish: Dish = {
      id: `dish-${Date.now()}`,
      name: newDishForm.name,
      subtitle: newDishForm.subtitle || 'Especialidade da Casa',
      category: (newDishForm.category as any) || 'principais',
      price: Number(newDishForm.price),
      description: newDishForm.description || '',
      longDescription: newDishForm.longDescription || newDishForm.description || '',
      ingredients: newDishForm.ingredients && newDishForm.ingredients.length > 0 ? newDishForm.ingredients : ['Ingredientes Selecionados'],
      allergens: newDishForm.allergens || [],
      tags: newDishForm.tags && newDishForm.tags.length > 0 ? newDishForm.tags : ['Novo'],
      thumbnail: newDishForm.thumbnail || '',
      poster: newDishForm.poster || newDishForm.thumbnail || '',
      glbUrl: newDishForm.glbUrl || '',
      usdzUrl: newDishForm.usdzUrl || '',
      nutrition: {
        calories: 500,
        serves: 'Serve 1 a 2 pessoas',
        prepTime: '20 min',
      },
    };

    addDish(dish);
    setShowAddDishModal(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleUpdateExistingDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    updateDish(editingDish);
    setEditingDish(null);
  };

  const filteredDishesForAdmin = dishes.filter((d) => {
    if (selectedCategoryFilter !== 'todos' && d.category !== selectedCategoryFilter) return false;
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080c] text-white pb-24 select-none">
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 bg-[#0f0f14]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-white">
                  Painel de Gestão & Controle
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 uppercase tracking-wider">
                  Admin Pro
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gestor: <strong className="text-white">{profile?.name || 'Administrador'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('garcom')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all cursor-pointer"
              title="Alternar para Painel do Garçom"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Painel Garçom</span>
            </button>

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

      {/* Navigation Tabs Bar */}
      <nav
        aria-label="Navegação administrativa"
        className="w-full bg-[#0c0c11] border-b border-white/5 overflow-x-auto no-scrollbar py-2 px-4 sticky top-[57px] z-30"
      >
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('novo-prato-foto')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
              activeTab === 'novo-prato-foto'
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Criador 3D por Foto (IA)</span>
            <span className="text-[9px] bg-black/40 px-1 rounded text-emerald-300 uppercase">
              IA
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cardapio')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cardapio'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Cardápio</span>
            <span className="text-[10px] opacity-75">({dishes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pedidos'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pedidos</span>
            <span className="text-[10px] opacity-75">({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qrcodes'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Codes das Mesas</span>
          </button>

          <button
            onClick={() => setActiveTab('colaboradores')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'colaboradores'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipe</span>
          </button>

          <button
            onClick={() => setActiveTab('solicitacoes')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'solicitacoes'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Solicitações</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'configuracoes'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col justify-between shadow-xl">
                <span className="text-xs text-zinc-400 font-medium">Faturamento do Turno</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-serif font-extrabold text-emerald-400">
                    {formattedRevenue}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 mt-2">
                  {orders.length} pedidos confirmados
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col justify-between shadow-xl">
                <span className="text-xs text-zinc-400 font-medium">Ticket Médio por Mesa</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-serif font-extrabold text-white">
                    {formattedAvgTicket}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 mt-2">
                  Por comanda finalizada
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col justify-between shadow-xl">
                <span className="text-xs text-zinc-400 font-medium">Engajamento 3D / AR</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-serif font-extrabold text-amber-400">
                    1.280
                  </span>
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Box className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 mt-2 font-bold">
                  ↑ 42% taxa de conversão direta
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col justify-between shadow-xl">
                <span className="text-xs text-zinc-400 font-medium">Ocupação do Salão</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-serif font-extrabold text-purple-400">
                    {orders.filter((o) => o.status !== 'entregue').length} / {settings.totalTables}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 mt-2">
                  Mesas ativas no momento
                </span>
              </div>
            </div>

            {/* Top Dishes Performance Table */}
            <div className="p-6 rounded-3xl bg-[#111116] border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Ranking de Conversão & Visualizações 3D
                  </h3>
                  <p className="text-xs text-zinc-400">Métricas de interação do cardápio em tempo real</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3">Prato</th>
                      <th className="pb-3">Preço</th>
                      <th className="pb-3">Visualizações 3D</th>
                      <th className="pb-3">Pedidos</th>
                      <th className="pb-3">Taxa de Conversão</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dishes.slice(0, 6).map((dish, idx) => (
                      <tr key={dish.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 flex items-center gap-3">
                          <img
                            src={dish.thumbnail}
                            alt={dish.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                          />
                          <div>
                            <span className="font-bold text-white block">
                              {dish.name}
                            </span>
                            <span className="text-[11px] text-zinc-500 uppercase">
                              {dish.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(dish.price)}
                        </td>
                        <td className="py-3 font-semibold">{420 - idx * 45} views</td>
                        <td className="py-3 font-bold text-white">
                          {68 - idx * 7} pedidos
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold">
                            {(18.4 - idx * 1.2).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setTestViewerDish(dish)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 transition-colors cursor-pointer"
                            title="Testar 3D"
                          >
                            <Box className="w-4 h-4 text-emerald-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NOVO PRATO POR FOTO (IA 3D) */}
        {activeTab === 'novo-prato-foto' && (
          <div className="animate-fadeIn">
            <NovoPratoFoto
              onCreated={() => {
                setActiveTab('cardapio');
              }}
            />
          </div>
        )}

        {/* TAB 3: GERENCIAMENTO DO CARDÁPIO */}
        {activeTab === 'cardapio' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  Gerenciamento do Cardápio ({filteredDishesForAdmin.length})
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Adicione, edite preços, descrições e modelos 3D dos pratos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('novo-prato-foto')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Novo por Foto (IA 3D)</span>
                </button>
                <button
                  onClick={() => setShowAddDishModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastro Manual</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Buscar prato por nome ou ingrediente..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="flex-grow px-4 py-2.5 rounded-2xl bg-[#111116] border border-white/10 focus:border-emerald-400 text-white placeholder:text-zinc-500 text-xs outline-none transition-all"
              />

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#111116] border border-white/10 text-white text-xs outline-none cursor-pointer"
              >
                <option value="todos">Todas as Categorias</option>
                <option value="principais">Pratos Principais</option>
                <option value="entradas">Entradas</option>
                <option value="sobremesas">Sobremesas</option>
                <option value="bebidas">Bebidas</option>
              </select>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishesForAdmin.map((dish) => (
                <div
                  key={dish.id}
                  className="p-4 rounded-3xl bg-[#121217] border border-white/10 hover:border-emerald-500/40 flex flex-col justify-between space-y-3 transition-all shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                      <img
                        src={dish.thumbnail}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setTestViewerDish(dish)}
                        className="absolute bottom-2 right-2 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Testar 3D</span>
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif text-base font-bold text-white">
                          {dish.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">
                          {dish.category}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(dish.price)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      3D Pronto
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingDish(dish)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar Prato"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDish(dish.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir Prato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PEDIDOS GLOBAIS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Histórico Geral de Pedidos ({orders.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Todas as comandas e transações registradas no restaurante
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#111116] border border-white/5 space-y-4 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3">ID / Hora</th>
                      <th className="pb-3">Mesa</th>
                      <th className="pb-3">Itens</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02]">
                        <td className="py-3">
                          <span className="font-mono text-zinc-300 font-bold block">
                            #{order.id}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {order.createdAt}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-white">
                          Mesa {order.tableNumber}
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <span key={idx} className="block text-zinc-300">
                                {it.quantity}x {it.dish.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-400 text-sm">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(order.total)}
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white uppercase">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GERADOR DE QR CODES PARA AS MESAS */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Gerador de QR Codes para Mesas
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gere e imprima QR codes exclusivos para cada mesa com link direto para o cardápio 3D
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Table Picker */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-[#111116] border border-white/5 space-y-4">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Selecione a Mesa para Visualizar:
                </span>
                <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                  {Array.from({ length: settings.totalTables || 24 }, (_, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    const isSelected = qrCodeTable === num;

                    return (
                      <button
                        key={num}
                        onClick={() => setQrCodeTable(num)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                            : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        M{num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Printable Display Card */}
              <div className="lg:col-span-8 p-8 rounded-3xl bg-[#111116] border border-white/10 flex flex-col items-center text-center space-y-5 shadow-2xl">
                <div className="p-6 rounded-3xl bg-white text-black shadow-2xl space-y-3 max-w-xs w-full">
                  <div className="flex flex-col items-center">
                    <span className="font-serif text-2xl font-extrabold tracking-widest text-black">
                      {settings.name || 'AURUM'}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">
                      Cardápio Digital 3D & Realidade Aumentada
                    </span>
                  </div>

                  {/* QR Code Canvas Mockup */}
                  <div className="w-48 h-48 mx-auto bg-black p-2 rounded-2xl flex items-center justify-center shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        window.location.origin + window.location.pathname + '#/cardapio?mesa=' + qrCodeTable
                      )}`}
                      alt={`QR Code Mesa ${qrCodeTable}`}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="border-t border-zinc-200 pt-2 text-center">
                    <span className="font-serif text-xl font-black text-black block">
                      MESA {qrCodeTable}
                    </span>
                    <p className="text-[10px] text-zinc-600 font-medium">
                      Aponte a câmera do celular para abrir o cardápio e ver os pratos em 3D sobre a mesa.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Placa da Mesa {qrCodeTable}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COLABORADORES */}
        {activeTab === 'colaboradores' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Equipe de Atendimento ({collaborators.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Garçons, chefs e gerentes cadastrados no restaurante
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collaborators.map((colab) => (
                <div
                  key={colab.id}
                  className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-white">
                        {colab.name}
                      </h4>
                      <span className="text-xs text-emerald-400 font-semibold">
                        {colab.role}
                      </span>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        colab.status === 'ativo' ? 'bg-emerald-400' : 'bg-zinc-600'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400">
                    <p>Telefone: {colab.phone}</p>
                    <p>Turno: {colab.shift}</p>
                    <p className="text-[11px] text-zinc-500">Desde: {colab.joinedAt}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() =>
                        updateCollaboratorStatus(
                          colab.id,
                          colab.status === 'ativo' ? 'inativo' : 'ativo'
                        )
                      }
                      className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      {colab.status === 'ativo' ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => deleteCollaborator(colab.id)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SOLICITAÇÕES */}
        {activeTab === 'solicitacoes' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Solicitações de Novos Colaboradores
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Candidatos ou garçons que solicitaram acesso para trabalhar no salão
              </p>
            </div>

            {collaboratorRequests.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 bg-[#111116] rounded-3xl border border-white/5">
                Nenhuma solicitação pendente no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {collaboratorRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl bg-[#111116] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-white">
                          {req.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                          {req.role}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {req.requestedAt}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Contato: {req.phone}</p>
                      {req.notes && (
                        <p className="text-xs text-zinc-500 mt-0.5 italic">
                          "{req.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pendente' ? (
                        <>
                          <button
                            onClick={() => approveCollaboratorRequest(req.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => rejectCollaboratorRequest(req.id)}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                          >
                            Rejeitar
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                            req.status === 'aprovado'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: CONFIGURAÇÕES */}
        {activeTab === 'configuracoes' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Configurações do Restaurante
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dados exibidos aos clientes e canais de atendimento
              </p>
            </div>

            <form
              onSubmit={handleSaveSettings}
              className="p-6 rounded-3xl bg-[#111116] border border-white/5 space-y-4 shadow-xl"
            >
              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  value={tempSettings.name}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">
                  Subtítulo / Slogan
                </label>
                <input
                  type="text"
                  value={tempSettings.subtitle}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, subtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-300 font-bold block mb-1">
                    WhatsApp para Pedidos
                  </label>
                  <input
                    type="text"
                    value={tempSettings.whatsappNumber}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        whatsappNumber: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-bold block mb-1">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={tempSettings.pixKey}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pixKey: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">
                  Total de Mesas Ativas no Salão
                </label>
                <input
                  type="number"
                  value={tempSettings.totalTables}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      totalTables: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {settingsSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Configurações Atualizadas com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* 3D Model Tester Modal */}
      {testViewerDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-lg bg-[#14141a] border border-emerald-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-400" />
                <h3 className="font-serif text-lg font-bold text-white">
                  {testViewerDish.name} • Visualizador 3D
                </h3>
              </div>
              <button
                onClick={() => setTestViewerDish(null)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-2xl bg-[#09090c] border border-white/10 overflow-hidden">
              <model-viewer
                src={testViewerDish.glbUrl}
                ios-src={testViewerDish.usdzUrl}
                alt={testViewerDish.name}
                camera-controls
                auto-rotate
                shadow-intensity="1.2"
                exposure="1.1"
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Arquivo: {testViewerDish.glbUrl}</span>
              <span className="text-emerald-400 font-bold">
                Compatível com AR Nativo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manual Dish */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-[#14141a] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-lg font-bold text-white">
                Adicionar Prato Manualmente
              </h3>
              <button
                onClick={() => setShowAddDishModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualDish} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">Nome do Prato</label>
                <input
                  type="text"
                  required
                  value={newDishForm.name}
                  onChange={(e) =>
                    setNewDishForm({ ...newDishForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                  placeholder="Ex: Risoto de Trufas"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-300 font-bold block mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newDishForm.price}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-bold block mb-1">Categoria</label>
                  <select
                    value={newDishForm.category}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#14141a] border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                  >
                    <option value="principais">Prato Principal</option>
                    <option value="entradas">Entrada</option>
                    <option value="sobremesas">Sobremesa</option>
                    <option value="bebidas">Bebida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={newDishForm.description}
                  onChange={(e) =>
                    setNewDishForm({ ...newDishForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">URL da Imagem / Foto</label>
                <input
                  type="url"
                  placeholder="https://... ou caminho da foto"
                  value={newDishForm.thumbnail}
                  onChange={(e) =>
                    setNewDishForm({ ...newDishForm, thumbnail: e.target.value, poster: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">URL do Modelo 3D (.glb)</label>
                <input
                  type="text"
                  placeholder="https://.../modelo.glb (opcional)"
                  value={newDishForm.glbUrl}
                  onChange={(e) =>
                    setNewDishForm({ ...newDishForm, glbUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-md transition-all cursor-pointer mt-2"
              >
                Salvar Prato
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Dish */}
      {editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-[#14141a] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-lg font-bold text-white">
                Editar Prato: {editingDish.name}
              </h3>
              <button
                onClick={() => setEditingDish(null)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExistingDish} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">Nome</label>
                <input
                  type="text"
                  value={editingDish.name}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingDish.price}
                  onChange={(e) =>
                    setEditingDish({
                      ...editingDish,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-bold block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingDish.description}
                  onChange={(e) =>
                    setEditingDish({
                      ...editingDish,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-md transition-all cursor-pointer mt-2"
              >
                Atualizar Prato
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
