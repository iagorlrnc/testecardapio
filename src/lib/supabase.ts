import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20
  );
};

// Create real client or fallback dummy client to avoid crashes
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (createClient(
      'https://placeholder-degustar-app.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-key-for-local-development',
      {
        auth: {
          persistSession: true,
        },
      }
    ) as any);
