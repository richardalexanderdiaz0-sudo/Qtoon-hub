import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL o Anon Key no configuradas en .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para verificar conexión
export const verifySupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('works').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Conexión con Supabase exitosa');
    return true;
  } catch (error: any) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    return false;
  }
};
