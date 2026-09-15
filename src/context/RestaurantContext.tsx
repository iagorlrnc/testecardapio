import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Dish } from '../types/menu';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile,
  TableOrder,
  TableCall,
  TableCallReason,
  Collaborator,
  CollaboratorRequest,
  RestaurantSettings,
  OrderStatus,
} from '../types/restaurant';

interface RestaurantContextType {
  currentProfile: UserProfile;
  setProfile: (profile: UserProfile) => void;

  // Loading indicator for database queries
  isLoadingData: boolean;
  refreshData: () => Promise<void>;

  // Dishes
  dishes: Dish[];
  addDish: (dish: Dish) => Promise<void>;
  updateDish: (dish: Dish) => Promise<void>;
  deleteDish: (dishId: string) => Promise<void>;
  updateDishModelStatus: (
    dishId: string,
    status: 'pending' | 'processing' | 'ready' | 'failed',
    glbUrl?: string,
    usdzUrl?: string
  ) => Promise<void>;

  // Orders
  orders: TableOrder[];
  addOrder: (tableNumber: string, items: { dish: Dish; quantity: number; notes?: string }[], notes?: string) => TableOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  activeOrdersCount: number;

  // Calls
  calls: TableCall[];
  addCall: (tableNumber: string, reason: TableCallReason) => void;
  markCallAnswered: (callId: string) => Promise<void>;
  activeCallsCount: number;

  // Collaborators
  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'joinedAt'>) => Promise<void>;
  updateCollaboratorStatus: (id: string, status: 'ativo' | 'inativo') => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;

  // Requests
  collaboratorRequests: CollaboratorRequest[];
  approveCollaboratorRequest: (requestId: string) => Promise<void>;
  rejectCollaboratorRequest: (requestId: string) => Promise<void>;

  // Settings
  settings: RestaurantSettings;
  updateSettings: (settings: Partial<RestaurantSettings>) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: 'Restaurante DegustAR',
  subtitle: 'Cardápio Digital 3D & Realidade Aumentada',
  whatsappNumber: '5511999998888',
  pixKey: 'financeiro@degustar.io',
  totalTables: 24,
  instagram: '@degustar.io',
};

// Row-to-Type Mappers
function mapDishFromRow(row: any): Dish {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle || '',
    category: row.category,
    price: Number(row.price) || 0,
    description: row.description || '',
    longDescription: row.long_description || row.description || '',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    thumbnail: row.thumbnail || '',
    poster: row.poster || row.thumbnail || '',
    glbUrl: row.glb_url || '',
    usdzUrl: row.usdz_url || '',
    featured: Boolean(row.featured),
    shadowIntensity: row.shadow_intensity != null ? Number(row.shadow_intensity) : 1.2,
    exposure: row.exposure != null ? Number(row.exposure) : 1.1,
    nutrition: {
      calories: Number(row.calories) || 0,
      serves: row.serves || 'Serve 1 pessoa',
      prepTime: row.prep_time || '15 min',
      chefSpecial: Boolean(row.chef_special),
    },
    pairingRecommendation: row.pairing_drink_name
      ? {
          drinkName: row.pairing_drink_name,
          description: row.pairing_drink_desc || '',
        }
      : undefined,
    sourcePhotos: Array.isArray(row.source_photos) ? row.source_photos : [],
    tripoTaskId: row.tripo_task_id || '',
    modelStatus: row.model_status || 'ready',
    plateWidthCm: Number(row.plate_width_cm) || 28,
  };
}

function mapOrderFromRow(row: any): TableOrder {
  const items = (row.order_items || []).map((item: any) => ({
    dish: {
      id: item.dish_id || item.id,
      name: item.dish_name,
      price: Number(item.price) || 0,
      description: '',
      longDescription: '',
      category: 'principais',
      ingredients: [],
      allergens: [],
      tags: [],
      thumbnail: '',
      poster: '',
      glbUrl: '',
      usdzUrl: '',
      nutrition: { calories: 0, serves: '', prepTime: '' },
    } as Dish,
    quantity: Number(item.quantity) || 1,
    notes: item.notes || '',
  }));

  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(
    createdDate.getMinutes()
  ).padStart(2, '0')}`;

  return {
    id: row.id,
    tableNumber: row.table_number,
    items,
    total: Number(row.total) || 0,
    status: row.status as OrderStatus,
    createdAt: timeStr,
    customerNotes: row.customer_notes || '',
  };
}

function mapCallFromRow(row: any): TableCall {
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(
    createdDate.getMinutes()
  ).padStart(2, '0')}`;

  return {
    id: row.id,
    tableNumber: row.table_number,
    reason: row.reason,
    status: row.status,
    createdAt: timeStr,
  };
}

function mapCollaboratorFromRow(row: any): Collaborator {
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const dateStr = `${String(createdDate.getDate()).padStart(2, '0')}/${String(
    createdDate.getMonth() + 1
  ).padStart(2, '0')}/${createdDate.getFullYear()}`;

  const roleFormatted =
    row.role === 'admin' ? 'Gerente' : row.role === 'garcom' ? 'Garçom' : row.role;

  return {
    id: row.id,
    name: row.name || 'Colaborador',
    role: roleFormatted as any,
    phone: row.phone || '',
    shift: (row.shift as any) || 'Noite',
    status: row.status || 'ativo',
    joinedAt: dateStr,
  };
}

function mapRequestFromRow(row: any): CollaboratorRequest {
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const timeStr = `${String(createdDate.getDate()).padStart(2, '0')}/${String(
    createdDate.getMonth() + 1
  ).padStart(2, '0')} ${String(createdDate.getHours()).padStart(2, '0')}:${String(
    createdDate.getMinutes()
  ).padStart(2, '0')}`;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role as any,
    notes: row.notes || '',
    requestedAt: timeStr,
    status: row.status,
  };
}

function mapSettingsFromRow(row: any): RestaurantSettings {
  return {
    name: row.name || DEFAULT_SETTINGS.name,
    subtitle: row.subtitle || DEFAULT_SETTINGS.subtitle,
    whatsappNumber: row.whatsapp_number || DEFAULT_SETTINGS.whatsappNumber,
    pixKey: row.pix_key || DEFAULT_SETTINGS.pixKey,
    totalTables: Number(row.total_tables) || DEFAULT_SETTINGS.totalTables,
    instagram: row.instagram || DEFAULT_SETTINGS.instagram,
  };
}

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>('cliente');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [calls, setCalls] = useState<TableCall[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorRequests, setCollaboratorRequests] = useState<CollaboratorRequest[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);

  // ---------------------------------------------------------------------------
  // Supabase Fetchers
  // ---------------------------------------------------------------------------
  const fetchDishes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pratos no Supabase:', error);
        return;
      }
      if (data) {
        setDishes(data.map(mapDishFromRow));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchDishes:', err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos no Supabase:', error);
        return;
      }
      if (data) {
        setOrders(data.map(mapOrderFromRow));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchOrders:', err);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('table_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar chamadas no Supabase:', error);
        return;
      }
      if (data) {
        setCalls(data.map(mapCallFromRow));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchCalls:', err);
    }
  }, []);

  const fetchCollaborators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar colaboradores no Supabase:', error);
        return;
      }
      if (data) {
        setCollaborators(data.map(mapCollaboratorFromRow));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchCollaborators:', err);
    }
  }, []);

  const fetchCollaboratorRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collaborator_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar solicitações no Supabase:', error);
        return;
      }
      if (data) {
        setCollaboratorRequests(data.map(mapRequestFromRow));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchCollaboratorRequests:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configurações no Supabase:', error);
        return;
      }
      if (data) {
        setSettings(mapSettingsFromRow(data));
      }
    } catch (err) {
      console.error('Erro inesperado em fetchSettings:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    await Promise.all([
      fetchDishes(),
      fetchOrders(),
      fetchCalls(),
      fetchCollaborators(),
      fetchCollaboratorRequests(),
      fetchSettings(),
    ]);
    setIsLoadingData(false);
  }, [
    fetchDishes,
    fetchOrders,
    fetchCalls,
    fetchCollaborators,
    fetchCollaboratorRequests,
    fetchSettings,
  ]);

  // ---------------------------------------------------------------------------
  // Initial Load & Realtime Channels
  // ---------------------------------------------------------------------------
  useEffect(() => {
    refreshData();

    if (!isSupabaseConfigured()) return;

    // Realtime Subscriptions
    const dishesChannel = supabase
      .channel('public:dishes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
        fetchDishes();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const orderItemsChannel = supabase
      .channel('public:order_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchOrders();
      })
      .subscribe();

    const callsChannel = supabase
      .channel('public:table_calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_calls' }, () => {
        fetchCalls();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchCollaborators();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('public:collaborator_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collaborator_requests' },
        () => {
          fetchCollaboratorRequests();
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('public:restaurant_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
      supabase.removeChannel(callsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [
    refreshData,
    fetchDishes,
    fetchOrders,
    fetchCalls,
    fetchCollaborators,
    fetchCollaboratorRequests,
    fetchSettings,
  ]);

  // ---------------------------------------------------------------------------
  // Dish Operations (100% Supabase)
  // ---------------------------------------------------------------------------
  const addDish = async (dish: Dish) => {
    // Optimistic update
    setDishes((prev) => [dish, ...prev.filter((d) => d.id !== dish.id)]);

    const payload = {
      id: dish.id,
      name: dish.name,
      subtitle: dish.subtitle || '',
      category: dish.category,
      price: dish.price,
      description: dish.description,
      long_description: dish.longDescription || '',
      ingredients: dish.ingredients,
      allergens: dish.allergens,
      tags: dish.tags,
      thumbnail: dish.thumbnail,
      poster: dish.poster,
      glb_url: dish.glbUrl,
      usdz_url: dish.usdzUrl || '',
      featured: dish.featured || false,
      shadow_intensity: dish.shadowIntensity || 1.2,
      exposure: dish.exposure || 1.1,
      serves: dish.nutrition?.serves || 'Serve 1 pessoa',
      calories: dish.nutrition?.calories || 0,
      prep_time: dish.nutrition?.prepTime || '15 min',
      chef_special: dish.nutrition?.chefSpecial || false,
      source_photos: dish.sourcePhotos || [],
      tripo_task_id: dish.tripoTaskId || '',
      model_status: dish.modelStatus || 'ready',
      plate_width_cm: dish.plateWidthCm || 28,
    };

    const { error } = await supabase.from('dishes').upsert(payload);
    if (error) {
      console.error('Supabase dish upsert error:', error);
    } else {
      fetchDishes();
    }
  };

  const updateDish = async (updatedDish: Dish) => {
    setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)));

    const { error } = await supabase
      .from('dishes')
      .update({
        name: updatedDish.name,
        subtitle: updatedDish.subtitle || '',
        price: updatedDish.price,
        description: updatedDish.description,
        long_description: updatedDish.longDescription || '',
        category: updatedDish.category,
        ingredients: updatedDish.ingredients,
        allergens: updatedDish.allergens,
        tags: updatedDish.tags,
        thumbnail: updatedDish.thumbnail,
        poster: updatedDish.poster,
        glb_url: updatedDish.glbUrl,
        usdz_url: updatedDish.usdzUrl || '',
        featured: updatedDish.featured || false,
        shadow_intensity: updatedDish.shadowIntensity || 1.2,
        exposure: updatedDish.exposure || 1.1,
        serves: updatedDish.nutrition?.serves || 'Serve 1 pessoa',
        calories: updatedDish.nutrition?.calories || 0,
        prep_time: updatedDish.nutrition?.prepTime || '15 min',
        chef_special: updatedDish.nutrition?.chefSpecial || false,
      })
      .eq('id', updatedDish.id);

    if (error) {
      console.error('Supabase dish update error:', error);
    } else {
      fetchDishes();
    }
  };

  const deleteDish = async (dishId: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== dishId));

    const { error } = await supabase.from('dishes').delete().eq('id', dishId);
    if (error) {
      console.error('Supabase dish delete error:', error);
    }
  };

  const updateDishModelStatus = async (
    dishId: string,
    status: 'pending' | 'processing' | 'ready' | 'failed',
    glbUrl?: string,
    usdzUrl?: string
  ) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          return {
            ...d,
            modelStatus: status,
            glbUrl: glbUrl || d.glbUrl,
            usdzUrl: usdzUrl || d.usdzUrl,
          };
        }
        return d;
      })
    );

    const updateData: Record<string, any> = { model_status: status };
    if (glbUrl) updateData.glb_url = glbUrl;
    if (usdzUrl) updateData.usdz_url = usdzUrl;

    const { error } = await supabase.from('dishes').update(updateData).eq('id', dishId);
    if (error) {
      console.error('Supabase model status update error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Orders Operations (100% Supabase)
  // ---------------------------------------------------------------------------
  const addOrder = (
    tableNumber: string,
    items: { dish: Dish; quantity: number; notes?: string }[],
    notes?: string
  ) => {
    const total = items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const orderId = `ord-${Date.now().toString().slice(-4)}`;

    const newOrder: TableOrder = {
      id: orderId,
      tableNumber,
      items,
      total,
      status: 'pendente',
      createdAt: timeStr,
      customerNotes: notes,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Insert into Supabase orders and order_items
    supabase
      .from('orders')
      .insert({
        id: orderId,
        table_number: tableNumber,
        total,
        status: 'pendente',
        customer_notes: notes || '',
      })
      .then(async ({ error: orderError }) => {
        if (orderError) {
          console.error('Supabase addOrder error:', orderError);
          return;
        }

        const orderItemsToInsert = items.map((item) => ({
          order_id: orderId,
          dish_id: item.dish.id,
          dish_name: item.dish.name,
          price: item.dish.price,
          quantity: item.quantity,
          notes: item.notes || '',
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) {
          console.error('Supabase order_items insert error:', itemsError);
        }
        fetchOrders();
      });

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Supabase updateOrderStatus error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Calls Operations (100% Supabase)
  // ---------------------------------------------------------------------------
  const addCall = (tableNumber: string, reason: TableCallReason) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const callId = `call-${Date.now().toString().slice(-4)}`;

    const newCall: TableCall = {
      id: callId,
      tableNumber,
      reason,
      status: 'aguardando',
      createdAt: timeStr,
    };

    setCalls((prev) => [newCall, ...prev]);

    supabase
      .from('table_calls')
      .insert({
        id: callId,
        table_number: tableNumber,
        reason,
        status: 'aguardando',
      })
      .then(({ error }) => {
        if (error) console.error('Supabase addCall error:', error);
        else fetchCalls();
      });
  };

  const markCallAnswered = async (callId: string) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: 'atendido' } : c))
    );

    const { error } = await supabase
      .from('table_calls')
      .update({ status: 'atendido', answered_at: new Date().toISOString() })
      .eq('id', callId);

    if (error) {
      console.error('Supabase markCallAnswered error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Collaborators Operations (100% Supabase Profiles)
  // ---------------------------------------------------------------------------
  const addCollaborator = async (colab: Omit<Collaborator, 'id' | 'joinedAt'>) => {
    const roleCode = colab.role === 'Gerente' ? 'admin' : 'garcom';
    const newId = `colab-${Date.now()}`;

    const { error } = await supabase.from('profiles').insert({
      id: newId,
      name: colab.name,
      email: `${newId}@degustar.io`,
      role: roleCode,
      phone: colab.phone,
      shift: colab.shift,
      status: colab.status,
    });

    if (error) {
      console.error('Supabase addCollaborator error:', error);
    } else {
      fetchCollaborators();
    }
  };

  const updateCollaboratorStatus = async (id: string, status: 'ativo' | 'inativo') => {
    setCollaborators((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) {
      console.error('Supabase updateCollaboratorStatus error:', error);
    }
  };

  const deleteCollaborator = async (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteCollaborator error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Requests Operations (100% Supabase)
  // ---------------------------------------------------------------------------
  const approveCollaboratorRequest = async (requestId: string) => {
    const req = collaboratorRequests.find((r) => r.id === requestId);
    if (!req) return;

    setCollaboratorRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'aprovado' } : r))
    );

    await supabase
      .from('collaborator_requests')
      .update({ status: 'aprovado' })
      .eq('id', requestId);

    const roleCode = req.role === 'Gerente' ? 'admin' : 'garcom';
    await supabase.from('profiles').insert({
      id: `colab-${Date.now()}`,
      name: req.name,
      email: `${requestId}@degustar.io`,
      role: roleCode,
      phone: req.phone,
      shift: 'Noite',
      status: 'ativo',
    });

    fetchCollaborators();
    fetchCollaboratorRequests();
  };

  const rejectCollaboratorRequest = async (requestId: string) => {
    setCollaboratorRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejeitado' } : r))
    );

    const { error } = await supabase
      .from('collaborator_requests')
      .update({ status: 'rejeitado' })
      .eq('id', requestId);

    if (error) {
      console.error('Supabase rejectCollaboratorRequest error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // Settings Operations (100% Supabase)
  // ---------------------------------------------------------------------------
  const updateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    const dbSettings: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (newSettings.name !== undefined) dbSettings.name = newSettings.name;
    if (newSettings.subtitle !== undefined) dbSettings.subtitle = newSettings.subtitle;
    if (newSettings.whatsappNumber !== undefined)
      dbSettings.whatsapp_number = newSettings.whatsappNumber;
    if (newSettings.pixKey !== undefined) dbSettings.pix_key = newSettings.pixKey;
    if (newSettings.totalTables !== undefined) dbSettings.total_tables = newSettings.totalTables;
    if (newSettings.instagram !== undefined) dbSettings.instagram = newSettings.instagram;

    const { error } = await supabase
      .from('restaurant_settings')
      .upsert({ id: 'default', ...dbSettings });

    if (error) {
      console.error('Supabase updateSettings error:', error);
    }
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'entregue' && o.status !== 'cancelado'
  ).length;
  const activeCallsCount = calls.filter((c) => c.status === 'aguardando').length;

  return (
    <RestaurantContext.Provider
      value={{
        currentProfile,
        setProfile: setCurrentProfile,
        isLoadingData,
        refreshData,
        dishes,
        addDish,
        updateDish,
        deleteDish,
        updateDishModelStatus,
        orders,
        addOrder,
        updateOrderStatus,
        activeOrdersCount,
        calls,
        addCall,
        markCallAnswered,
        activeCallsCount,
        collaborators,
        addCollaborator,
        updateCollaboratorStatus,
        deleteCollaborator,
        collaboratorRequests,
        approveCollaboratorRequest,
        rejectCollaboratorRequest,
        settings,
        updateSettings,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

