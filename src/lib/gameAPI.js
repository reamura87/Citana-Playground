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
  const [item, tanaman, alat] = await Promise.all([
    supabase.from('game_item').select('*').eq('aktif', true),
    supabase.from('game_tanaman').select('*').eq('aktif', true),
    supabase.from('game_alat').select('*'),
  ])
  if (item.error) throw item.error
  if (tanaman.error) throw tanaman.error
  if (alat.error) throw alat.error
  return { item: item.data, tanaman: tanaman.data, alat: alat.data }
}

export const forageMulai = (titik) => rpc('game_forage_mulai', { p_titik: titik })
export const forageSelesai = () => rpc('game_forage_selesai')
export const forageBatal = () => rpc('game_forage_batal')

// ---------- Chat dan bisik ----------
const KOLOM_CHAT = 'id, penulis_id, penulis_nama, isi, dibuat_pada, penerima_id, penerima_nama, jenis, hadiah_id'

export async function ambilRiwayatChat() {
  const [umum, pribadi] = await Promise.all([
    supabase.from('game_chat').select(KOLOM_CHAT).is('penerima_id', null)
      .order('id', { ascending: false }).limit(30),
    supabase.from('game_chat').select(KOLOM_CHAT).not('penerima_id', 'is', null)
      .order('id', { ascending: false }).limit(30),
  ])
  if (umum.error) throw new Error(umum.error.message)
  if (pribadi.error) throw new Error(pribadi.error.message)
  return [...umum.data, ...pribadi.data].sort((a, b) => a.id - b.id)
}

export const kirimChat = (isi, ke = null) => rpc('game_kirim_chat', { p_isi: isi, p_ke: ke })
export const bisukan = (pemain, menit) => rpc('game_bisukan', { p_pemain: pemain, p_menit: menit })

export async function hapusChat(id) {
  const { error } = await supabase.from('game_chat').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- Hadiah ----------
export async function ambilHadiah() {
  const { data, error } = await supabase
    .from('game_hadiah')
    .select('*')
    .order('id', { ascending: false })
    .limit(40)
  if (error) throw new Error(error.message)
  return data
}

export const kirimHadiah = (penerima, item, jumlah) =>
  rpc('game_kirim_hadiah', { p_penerima: penerima, p_item: item, p_jumlah: jumlah })
export const prosesHadiah = (id, aksi) => rpc('game_proses_hadiah', { p_id: id, p_aksi: aksi })

// Pesan dan hadiah baru datang lewat Realtime (hanya yang boleh dilihat pemain ini).
// Mengembalikan fungsi untuk berhenti berlangganan.
export function langgananChat({ onBaru, onHapus, onHadiah }) {
  const kanal = supabase
    .channel('game-chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_chat' }, (p) => onBaru(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_chat' }, (p) => onHapus(p.old.id))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_hadiah' }, (p) => onHadiah(p.new))
    .subscribe()
  return () => {
    supabase.removeChannel(kanal)
  }
}