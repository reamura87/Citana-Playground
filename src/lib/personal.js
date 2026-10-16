import { supabase } from './supabase'
import { hapusFileGambar } from './seniRupa'

function buatSlug(judul) {
  const dasar = judul
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${dasar || 'satua'}-${Math.random().toString(36).slice(2, 6)}`
}

// ---------- Tulisan ----------
export async function ambilPersonal() {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .in('jenis', ['cerpen', 'serial'])
    .eq('terbit', true)
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

export async function ambilTulisanSaya(userId) {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .eq('penulis_id', userId)
    .in('jenis', ['cerpen', 'serial'])
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

// Mengembalikan id tulisan
export async function simpanPersonal({ id, jenis, judul, kategori, isi, thumbnail_url, terbit }) {
  if (id) {
    const { data, error } = await supabase
      .from('satua')
      .update({ judul, kategori, isi, thumbnail_url, terbit })
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('Kamu tidak punya izin mengubah tulisan ini')
    return id
  }
  const { data, error } = await supabase
    .from('satua')
    .insert({ jenis, judul, kategori, isi, thumbnail_url, terbit, slug: buatSlug(judul) })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function hapusPersonal(satua) {
  const { data, error } = await supabase
    .from('satua')
    .delete()
    .eq('id', satua.id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus tulisan ini')
  if (satua.thumbnail_url) await hapusFileGambar(satua.thumbnail_url)
}

// ---------- Episode ----------
export async function ambilEpisodeTerbit(satuaId) {
  const { data, error } = await supabase
    .from('satua_episode')
    .select('id, satua_id, nomor, judul, skor, jumlah_komentar, diperbarui_pada')
    .eq('satua_id', satuaId)
    .eq('terbit', true)
    .order('nomor', { ascending: true })
  if (error) throw error
  return data
}

// Untuk pemilik: termasuk draf
export async function ambilSemuaEpisode(satuaId) {
  const { data, error } = await supabase
    .from('satua_episode')
    .select('id, nomor, judul, terbit, skor, jumlah_komentar')
    .eq('satua_id', satuaId)
    .order('nomor', { ascending: true })
  if (error) throw error
  return data
}

export async function ambilEpisodeById(id) {
  const { data, error } = await supabase
    .from('satua_episode')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function simpanEpisode({ id, satua_id, judul, isi, terbit }) {
  if (id) {
    const { data, error } = await supabase
      .from('satua_episode')
      .update({ judul, isi, terbit })
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('Kamu tidak punya izin mengubah episode ini')
    return
  }
  const { error } = await supabase.from('satua_episode').insert({ satua_id, judul, isi, terbit })
  if (error) throw error
}

export async function hapusEpisode(id) {
  const { data, error } = await supabase
    .from('satua_episode')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus episode ini')
}

// ---------- Upvote dan komentar ----------
const TARGET = {
  satua: { tabel: 'suara_satua', kolom: 'satua_id' },
  episode: { tabel: 'suara_episode', kolom: 'episode_id' },
}

export async function sudahUpvote(jenis, id) {
  const { tabel, kolom } = TARGET[jenis]
  const { data, error } = await supabase
    .from(tabel)
    .select(kolom)
    .eq(kolom, id)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function aturUpvote(jenis, id, userId, aktif) {
  const { tabel, kolom } = TARGET[jenis]
  if (aktif) {
    const { error } = await supabase.from(tabel).insert({ [kolom]: id, pengguna_id: userId })
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from(tabel)
    .delete()
    .eq(kolom, id)
    .eq('pengguna_id', userId)
  if (error) throw error
}

export async function ambilKomentar(jenis, id) {
  const { data, error } = await supabase
    .from('komentar_satua')
    .select('*')
    .eq(TARGET[jenis].kolom, id)
    .order('dibuat_pada', { ascending: true })
  if (error) throw error
  return data
}

export async function kirimKomentar(jenis, id, isi) {
  const { error } = await supabase
    .from('komentar_satua')
    .insert({ [TARGET[jenis].kolom]: id, isi })
  if (error) throw error
}

export async function hapusKomentar(id) {
  const { data, error } = await supabase
    .from('komentar_satua')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus komentar ini')
}