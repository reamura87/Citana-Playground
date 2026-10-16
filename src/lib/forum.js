import { supabase } from './supabase'
import { formatTanggal, kecilkanGambar } from './satua'

// ---------- Baca ----------
export async function ambilPost(urutan = 'terbaru') {
  let q = supabase.from('forum_post').select('*')
  if (urutan === 'teratas') q = q.order('skor', { ascending: false })
  const { data, error } = await q.order('dibuat_pada', { ascending: false }).limit(50)
  if (error) throw error
  return data
}

export async function ambilPostById(id) {
  const { data, error } = await supabase
    .from('forum_post')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ambilBalasan(postId) {
  const { data, error } = await supabase
    .from('forum_balasan')
    .select('*')
    .eq('post_id', postId)
    .order('dibuat_pada', { ascending: true })
  if (error) throw error
  return data
}

export async function ambilProfilSaya(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profil')
    .select('username, peran')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---------- Tulis ----------
// penulis_id, penulis_nama, dan skor sengaja tidak dikirim: diisi trigger di database.
export async function kirimPost({ isi, gambar_url }) {
  const { error } = await supabase.from('forum_post').insert({ isi, gambar_url })
  if (error) throw error
}

export async function kirimBalasan({ post_id, isi, gambar_url }) {
  const { error } = await supabase
    .from('forum_balasan')
    .insert({ post_id, isi, gambar_url })
  if (error) throw error
}

export async function hapusPost(post) {
  const { data: balasan } = await supabase
    .from('forum_balasan')
    .select('gambar_url')
    .eq('post_id', post.id)

  const { data, error } = await supabase
    .from('forum_post')
    .delete()
    .eq('id', post.id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus ini')

  const files = [post.gambar_url, ...(balasan ?? []).map((b) => b.gambar_url)].filter(Boolean)
  await Promise.all(files.map(hapusFileForum))
}

export async function hapusBalasan(balasan) {
  const { data, error } = await supabase
    .from('forum_balasan')
    .delete()
    .eq('id', balasan.id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus ini')
  if (balasan.gambar_url) await hapusFileForum(balasan.gambar_url)
}

// ---------- Suara ----------
const SUARA = {
  post: { tabel: 'suara_post', kolom: 'post_id' },
  balasan: { tabel: 'suara_balasan', kolom: 'balasan_id' },
}

export async function ambilSuaraSaya(jenis) {
  const { tabel, kolom } = SUARA[jenis]
  const { data, error } = await supabase.from(tabel).select(`${kolom}, nilai`)
  if (error) throw error
  return Object.fromEntries(data.map((d) => [d[kolom], d.nilai]))
}

// nilai: 1 (upvote), -1 (downvote), 0 (cabut suara)
export async function beriSuara(jenis, sasaranId, userId, nilai) {
  const { tabel, kolom } = SUARA[jenis]
  if (nilai === 0) {
    const { error } = await supabase
      .from(tabel)
      .delete()
      .eq(kolom, sasaranId)
      .eq('pengguna_id', userId)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from(tabel)
    .upsert(
      { [kolom]: sasaranId, pengguna_id: userId, nilai },
      { onConflict: `${kolom},pengguna_id` },
    )
  if (error) throw error
}

// ---------- Gambar ----------
export async function unggahGambarForum(file, userId) {
  const blob = await kecilkanGambar(file, 1200)
  const path = `${userId}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage
    .from('forum')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('forum').getPublicUrl(path).data.publicUrl
}

export async function hapusFileForum(url) {
  const path = url.split('/forum/')[1]
  if (path) await supabase.storage.from('forum').remove([path])
}

// ---------- Tampilan ----------
export function formatWaktu(iso) {
  const detik = (new Date(iso) - Date.now()) / 1000
  const mutlak = Math.abs(detik)
  if (mutlak < 60) return 'baru saja'
  if (mutlak > 7 * 86400) return formatTanggal(iso)
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  if (mutlak < 3600) return rtf.format(Math.round(detik / 60), 'minute')
  if (mutlak < 86400) return rtf.format(Math.round(detik / 3600), 'hour')
  return rtf.format(Math.round(detik / 86400), 'day')
}