import { supabase } from './supabase'

export async function cariSemua(q) {
  const { data, error } = await supabase.rpc('cari_semua', { q })
  if (error) throw error
  return data
}