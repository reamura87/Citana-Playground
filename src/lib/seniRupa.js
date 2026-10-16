import { supabase } from './supabase'

export async function ambilSeniRupa() {
  const { data, error } = await supabase
    .from('seni_rupa')
    .select('*')
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

export async function ambilSeniRupaById(id) {
  const { data, error } = await supabase
    .from('seni_rupa')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ambilKategoriSeniRupa() {
  const { data, error } = await supabase.from('seni_rupa').select('kategori')
  if (error) throw error
  return [...new Set(data.map((d) => d.kategori))]
}

export async function ambilUsernameSaya() {
  const { data: sesi } = await supabase.auth.getSession()
  const user = sesi.session?.user
  if (!user) return null
  const { data, error } = await supabase
    .from('profil')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  return data?.username ?? null
}

// pembuat_id dan pembuat_nama sengaja tidak dikirim: diisi trigger di database.
export async function tambahSeniRupa({ nama, kategori, gambar_url, asal }) {
  const { error } = await supabase
    .from('seni_rupa')
    .insert({ nama, kategori, gambar_url, asal })
  if (error) throw error
}

export async function ubahSeniRupa(id, { nama, kategori }) {
  const { data, error } = await supabase
    .from('seni_rupa')
    .update({ nama, kategori, diperbarui_pada: new Date().toISOString() })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin mengubah karya ini')
}

export async function hapusFileGambar(url) {
  const path = url.split('/gambar/')[1]
  if (!path) return
  await supabase.storage.from('gambar').remove([path])
}

export async function hapusSeniRupa(karya) {
  const { data, error } = await supabase
    .from('seni_rupa')
    .delete()
    .eq('id', karya.id)
    .select('id')
  if (error) throw error
  // Aturan akses yang menolak tidak melempar error, hanya 0 baris terhapus.
  // File baru dihapus kalau barisnya benar-benar terhapus.
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus karya ini')
  await hapusFileGambar(karya.gambar_url)
}