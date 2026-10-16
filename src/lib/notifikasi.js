import { supabase } from './supabase'

export async function hitungBelumDibaca() {
  const { count, error } = await supabase
    .from('notifikasi')
    .select('id', { count: 'exact', head: true })
    .eq('dibaca', false)
  if (error) throw error
  return count ?? 0
}

export async function ambilNotifikasi(batas = 8) {
  const { data, error } = await supabase
    .from('notifikasi')
    .select('*')
    .order('dibuat_pada', { ascending: false })
    .limit(batas)
  if (error) throw error
  return data
}

export async function tandaiDibaca(id) {
  const { error } = await supabase.from('notifikasi').update({ dibaca: true }).eq('id', id)
  if (error) throw error
}

export async function tandaiSemuaDibaca() {
  const { error } = await supabase.from('notifikasi').update({ dibaca: true }).eq('dibaca', false)
  if (error) throw error
}