import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type UserRole = 'garcom' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  shift?: string;
}

export type AppView = 'cliente' | 'garcom' | 'admin';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  signIn: (email: string, password: string, forPanel: 'garcom' | 'admin') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  canAccessAdmin: boolean;
  canAccessWaiter: boolean;
  canToggleBetweenPanels: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Read initial route from window.location.hash or fallback to 'cliente'
  const getInitialView = (): AppView => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('admin')) return 'admin';
    if (hash.includes('garcom')) return 'garcom';
    return 'cliente';
  };

  const [currentView, setCurrentViewState] = useState<AppView>(getInitialView);

  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (view === 'cliente') {
      window.location.hash = '#/';
    } else {
      window.location.hash = `#/${view}`;
    }
  };

  // Listen to hash changes in browser URL
  useEffect(() => {
    const handleHashChange = () => {
      const view = getInitialView();
      setCurrentViewState(view);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadUserProfile = async (userId: string, authUser: any) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        const resolved: UserProfile = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role as UserRole,
          phone: profileData.phone,
          shift: profileData.shift,
        };
        setProfile(resolved);
        localStorage.setItem('degustar_auth_profile', JSON.stringify(resolved));
        return resolved;
      } else {
        // Use auth metadata if profile row isn't created yet
        const metaRole = (authUser?.user_metadata?.role as UserRole) || 'garcom';
        const metaName = authUser?.user_metadata?.name || authUser?.email || 'Usuário';
        const fallbackProfile: UserProfile = {
          id: userId,
          email: authUser?.email || '',
          name: metaName,
          role: metaRole,
        };
        setProfile(fallbackProfile);
        localStorage.setItem('degustar_auth_profile', JSON.stringify(fallbackProfile));
        return fallbackProfile;
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil do Supabase:', err);
      return null;
    }
  };

  // Check initial session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);

      // Check active Supabase session
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            setUser(data.session.user);
            await loadUserProfile(data.session.user.id, data.session.user);
          } else {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('degustar_auth_profile');
          }
        } catch (err) {
          console.warn('Supabase session fetch warning:', err);
        }
      }

      setLoading(false);
    };

    initSession();

    // Listen to Supabase Auth State changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id, session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('degustar_auth_profile');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign In Method via Supabase Auth
  const signIn = async (
    emailInput: string,
    passwordInput: string,
    forPanel: 'garcom' | 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Credenciais inválidas no Supabase Auth.',
        };
      }

      const authUser = authData.user;
      const resolvedProfile = await loadUserProfile(authUser.id, authUser);

      if (!resolvedProfile) {
        return { success: false, error: 'Perfil do usuário não encontrado na tabela profiles do Supabase.' };
      }

      // STRICT HIERARCHICAL PERMISSION VERIFICATION
      if (forPanel === 'admin') {
        if (resolvedProfile.role !== 'admin') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          localStorage.removeItem('degustar_auth_profile');
          return {
            success: false,
            error:
              'Acesso não autorizado: Esta conta possui perfil de Garçom e NÃO tem permissão para acessar o Painel de Administrador.',
          };
        }
      }

      if (forPanel === 'garcom') {
        if (resolvedProfile.role !== 'garcom' && resolvedProfile.role !== 'admin') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          localStorage.removeItem('degustar_auth_profile');
          return {
            success: false,
            error: 'Acesso não autorizado para o painel de garçom.',
          };
        }
      }

      setUser(authUser);
      setProfile(resolvedProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado na autenticação.' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('degustar_auth_profile');
  };

  // Permissions
  const canAccessAdmin = profile?.role === 'admin';
  const canAccessWaiter = profile?.role === 'garcom' || profile?.role === 'admin';
  // ONLY admins can toggle between both panels!
  const canToggleBetweenPanels = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        currentView,
        setCurrentView,
        signIn,
        signOut,
        canAccessAdmin,
        canAccessWaiter,
        canToggleBetweenPanels,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
