import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

/**
 * Cliente Supabase normal (anon key) — para auth y operaciones de usuario.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Cliente Supabase Admin (service_role key) — para gestión de usuarios desde el ERP.
 * Solo disponible cuando VITE_SUPABASE_SERVICE_KEY está configurada.
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'givamic-admin-sb',   // key distinto para no pisar la sesión del cliente normal
      }
    })
  : null

export const isSupabaseEnabled = !!supabase
