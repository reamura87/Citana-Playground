import { supabase } from './supabase'

async function rpc(nama, args) {
  const { data, error } = await supabase.rpc(nama, args)
  if (error) throw new Error(error.message)
  return data
}

export const masukGame = () => rpc('game_masuk')
export const ambilDunia = () => rpc('game_dunia')
export const serang = (idSpawn) => rpc('game_serang', { p_spawn: idSpawn })
export const tanam = (indeks, tanaman) => rpc('game_tanam', { p_indeks: indeks, p_tanaman: tanaman })
export const panen = (indeks) => rpc('game_panen', { p_indeks: indeks })
export const beli = (item, jumlah) => rpc('game_beli', { p_item: item, p_jumlah: jumlah })
export const jual = (item, jumlah) => rpc('game_jual', { p_item: item, p_jumlah: jumlah })
export const upgradeRumah = () => rpc('game_upgrade_rumah')

export async function ambilKatalog() {
  const [item, tanaman] = await Promise.all([
    supabase.from('game_item').select('*').eq('aktif', true),
    supabase.from('game_tanaman').select('*').eq('aktif', true),
  ])
  if (item.error) throw item.error
  if (tanaman.error) throw tanaman.error
  return { item: item.data, tanaman: tanaman.data }
}