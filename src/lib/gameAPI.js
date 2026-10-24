import { supabase } from './supabase'

async function rpc(nama, args) {
  const { data, error } = await supabase.rpc(nama, args)
  if (error) throw new Error(error.message)
  return data
}

export const masukGame = () => rpc('game_masuk')
export const ambilDunia = () => rpc('game_dunia')
export const serang = (idSpawn) => rpc('game_serang', { p_spawn: idSpawn })
export const diserang = (idSpawn) => rpc('game_diserang', { p_spawn: idSpawn })
export const pakai = (item) => rpc('game_pakai', { p_item: item })
export const tambahPoin = (jenis, jumlah) => rpc('game_tambah_poin', { p_jenis: jenis, p_jumlah: jumlah })
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

export async function ambilRiwayatChat() {
  const { data, error } = await supabase
    .from('game_chat')
    .select('id, penulis_id, penulis_nama, isi, dibuat_pada')
    .order('id', { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  return data.reverse()
}

export const kirimChat = (isi) => rpc('game_kirim_chat', { p_isi: isi })
export const bisukan = (pemain, menit) => rpc('game_bisukan', { p_pemain: pemain, p_menit: menit })

export async function hapusChat(id) {
  const { error } = await supabase.from('game_chat').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Pesan baru dan pesan terhapus datang lewat Realtime. Mengembalikan fungsi untuk berhenti berlangganan.
export function langgananChat({ onBaru, onHapus }) {
  const kanal = supabase
    .channel('game-chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_chat' }, (p) => onBaru(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_chat' }, (p) => onHapus(p.old.id))
    .subscribe()
  return () => {
    supabase.removeChannel(kanal)
  }
}