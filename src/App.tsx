import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useRestaurant } from './context/RestaurantContext';
import { CATEGORIES } from './data/dishes';
import { CategoryId, Dish, CartItem } from './types/menu';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { DishCard } from './components/DishCard';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WaiterModal } from './components/WaiterModal';
import { TableModal } from './components/TableModal';
import { Footer } from './components/Footer';
import { ProfileSwitcher } from './components/common/ProfileSwitcher';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { WaiterLoginPage } from './components/auth/WaiterLoginPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { Search, Sparkles, Box, Utensils, Heart, ArrowUpDown, ShoppingBag, ChevronRight, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const { currentView, user, profile, canAccessAdmin, canAccessWaiter, setCurrentView } = useAuth();
  const { dishes, settings, orders, isLoadingData } = useRestaurant();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [tableNumber, setTableNumber] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaFromUrl = urlParams.get('mesa');
    return mesaFromUrl || '07';
  });
  const [activeCategory, setActiveCategory] = useState<CategoryId>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'fastest'>('relevance');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('aurum_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals state
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showWaiter, setShowWaiter] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    localStorage.setItem('aurum_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const handleToggleFavorite = (dishId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const dishCountPerCategory = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      todos: dishes.length,
      entradas: 0,
      principais: 0,
      sobremesas: 0,
      bebidas: 0,
    };

    dishes.forEach((d) => {
      if (counts[d.category] !== undefined) {
        counts[d.category]++;
      }
    });

    return counts;
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    let list = dishes.filter((dish) => {
      if (activeCategory !== 'todos' && dish.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description.toLowerCase().includes(q);
        const matchIng = dish.ingredients?.some((ing) => ing.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchIng) return false;
      }
      if (selectedTag === 'favorites') {
        if (!favoriteIds.includes(dish.id)) return false;
      } else if (selectedTag === 'chef') {
        if (!dish.nutrition?.chefSpecial) return false;
      } else if (selectedTag !== 'all') {
        if (!dish.tags?.includes(selectedTag)) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'fastest') {
      list = [...list].sort((a, b) => {
        const timeA = parseInt(a.nutrition?.prepTime || '20', 10);
        const timeB = parseInt(b.nutrition?.prepTime || '20', 10);
        return timeA - timeB;
      });
    }

    return list;
  }, [dishes, activeCategory, searchQuery, selectedTag, favoriteIds, sortBy]);

  const featuredDish = useMemo(() => {
    return dishes.find((d) => d.featured) || (dishes.length > 0 ? dishes[0] : null);
  }, [dishes]);

  const handleAddToCart = (dish: Dish, quantity: number, notes?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.dish.id === dish.id && item.notes === notes);
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { dish, quantity, notes }];
    });
  };

  const handleQuickAdd = (dish: Dish) => {
    handleAddToCart(dish, 1);
  };

  const handleUpdateCartQuantity = (dishId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (dishId: string) => {
    setCartItems((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  // Active table orders in kitchen
  const activeTableOrders = orders.filter(
    (o) => o.tableNumber === tableNumber && o.status !== 'entregue' && o.status !== 'cancelado'
  );

  // =========================================================================
  // ROUTE 1: WAITER PANEL (#/garcom)
  // Protected with Supabase Auth: requires 'garcom' or 'admin' role
  // =========================================================================
  if (currentView === 'garcom') {
    if (user && canAccessWaiter) {
      return (
        <>
          <WaiterDashboard />
          <ProfileSwitcher />
        </>
      );
    }
    return (
      <>
        <WaiterLoginPage />
        <ProfileSwitcher />
      </>
    );
  }

  // =========================================================================
  // ROUTE 2: ADMIN PANEL (#/admin)
  // Protected with Supabase Auth: strictly requires 'admin' role
  // =========================================================================
  if (currentView === 'admin') {
    if (user && canAccessAdmin) {
      return (
        <>
          <AdminDashboard />
          <ProfileSwitcher />
        </>
      );
    }
    return (
      <>
        <AdminLoginPage />
        <ProfileSwitcher />
      </>
    );
  }

  // =========================================================================
  // ROUTE 3: CLIENT 3D MENU (#/ or #/cardapio)
  // Public, no authentication required
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-200 font-sans">
      {/* Splash Screen on initial visit */}
      {showSplash && (
        <SplashScreen
          tableNumber={tableNumber}
          onEnterMenu={() => setShowSplash(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-grow">
        {/* Fixed Header */}
        <Header
          tableNumber={tableNumber}
          onOpenWaiter={() => setShowWaiter(true)}
          onOpenCart={() => setShowCart(true)}
          onOpenTableModal={() => setShowTableModal(true)}
          cartItemCount={totalCartCount}
          cartTotal={cartTotalPrice}
        />

        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 pb-28 flex-grow">
          {/* Welcome Banner / AR Table Callout */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141718] via-[#0f1112] to-[#0a0a0c] border border-emerald-500/30 p-5 sm:p-7 mb-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-2 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    Cardápio 3D & Realidade Aumentada
                  </span>
                </div>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight leading-snug">
                  Veja o prato na sua mesa antes de pedir.
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light">
                  Toque em qualquer prato para girar em 360° e projetar em tamanho real (1:1) sobre a toalha da sua mesa via câmera do celular. Sem baixar nada.
                </p>
              </div>

              {/* Quick Hero 3D Trigger */}
              {featuredDish && (
                <button
                  onClick={() => setSelectedDish(featuredDish)}
                  className="shrink-0 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
                >
                  <Box className="w-4 h-4" />
                  <span>Ver {featuredDish.name} em 3D</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar prato, ingrediente (ex: burger, camarão, trufas)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-16 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-emerald-400/60 text-white placeholder:text-zinc-500 text-xs sm:text-sm outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-zinc-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white outline-none cursor-pointer font-medium text-xs pr-2"
                >
                  <option value="relevance" className="bg-[#111116]">Relevância</option>
                  <option value="price_asc" className="bg-[#111116]">Menor Preço</option>
                  <option value="price_desc" className="bg-[#111116]">Maior Preço</option>
                  <option value="fastest" className="bg-[#111116]">Mais Rápidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable Category Tabs */}
          <CategoryTabs
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            dishCountPerCategory={dishCountPerCategory}
          />

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-5 text-xs">
            <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              Filtro:
            </span>

            {[
              { id: 'all', label: 'Todos os Estilos' },
              { id: 'favorites', label: `Meus Favoritos (${favoriteIds.length})`, isHeart: true },
              { id: 'chef', label: "👨‍🍳 Sugestão do Chef" },
              { id: 'Mais Pedido', label: '🔥 Mais Pedidos' },
              { id: 'Artesanal', label: 'Artesanal' },
              { id: 'Forno a Lenha', label: 'Forno a Lenha' },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.id ? 'all' : tag.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTag === tag.id
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {tag.isHeart && <Heart className={`w-3 h-3 ${selectedTag === tag.id ? 'fill-current' : 'text-rose-400'}`} />}
                <span>{tag.label}</span>
              </button>
            ))}
          </div>

          {/* Dishes Grid */}
          {isLoadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-[#111116] border border-white/5 p-4 space-y-4"
                >
                  <div className="w-full h-44 rounded-2xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 w-20 bg-white/5 rounded" />
                    <div className="h-8 w-24 bg-white/5 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : dishes.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-[#111116] rounded-3xl border border-emerald-500/20 p-8 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Utensils className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Nenhum prato cadastrado ainda
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  O cardápio está conectado diretamente ao Supabase. Adicione novos pratos e modelos 3D através do Painel Administrativo.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Cadastrar Pratos no Painel Admin</span>
                </button>
              </div>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#111116] rounded-3xl border border-white/5 p-8">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-white/5 flex items-center justify-center text-zinc-500">
                <Utensils className="w-7 h-7 text-emerald-400/60" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                Nenhum prato encontrado
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tente buscar por outro termo ou selecione uma categoria diferente acima.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('all');
                  setActiveCategory('todos');
                }}
                className="mt-2 text-xs text-emerald-400 underline font-bold cursor-pointer hover:text-emerald-300"
              >
                Redefinir todos os filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onSelect={(d) => setSelectedDish(d)}
                  onQuickAdd={handleQuickAdd}
                  isFavorite={favoriteIds.includes(dish.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </main>

        {/* Floating Quick Comanda Bottom Bar (when items in cart or active orders exist) */}
        {(totalCartCount > 0 || activeTableOrders.length > 0) && (
          <aside
            aria-label="Barra rápida da comanda"
            className="fixed inset-x-4 max-w-lg mx-auto z-40 animate-slideUp"
            style={{ bottom: 'max(4.25rem, calc(3.5rem + env(safe-area-inset-bottom)))' }}
          >
            <button
              onClick={() => setShowCart(true)}
              className="w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-black font-extrabold text-sm shadow-[0_12px_35px_rgba(16,185,129,0.4)] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-emerald-300 font-extrabold text-xs">
                  {totalCartCount > 0 ? totalCartCount : activeTableOrders.length}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black">
                    {totalCartCount > 0
                      ? 'Ver Comanda e Enviar Pedido'
                      : 'Acompanhar Pedido na Cozinha'}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">
                    Mesa {tableNumber} • {totalCartCount} item(s) no carrinho
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono font-black text-base">
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotalPrice)}
                </span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </aside>
        )}

        {/* Footer */}
        <Footer />
      </div>

      {/* Dish Detail & 3D/AR Viewer Modal */}
      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={handleAddToCart}
        isFavorite={selectedDish ? favoriteIds.includes(selectedDish.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Cart / Comanda Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
        tableNumber={tableNumber}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOpenWaiterCall={() => {
          setShowCart(false);
          setShowWaiter(true);
        }}
      />

      {/* Waiter Call Modal */}
      <WaiterModal
        isOpen={showWaiter}
        onClose={() => setShowWaiter(false)}
        tableNumber={tableNumber}
      />

      {/* Table Change Modal */}
      <TableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        currentTable={tableNumber}
        onSaveTable={(t) => setTableNumber(t)}
      />

      {/* Profile Switcher floating toolbar */}
      <ProfileSwitcher />
    </div>
  );
};
