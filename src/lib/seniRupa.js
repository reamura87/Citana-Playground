import { supabase } from './supabase'
import { kecilkanGambar } from './satua'

export async function ambilSeniRupa() {
  const { data, error } = await supabase
    .from('seni_rupa')
    .select('*')
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

export async function ambilSeniRupaSaya(userId) {
  const { data, error } = await supabase
    .from('seni_rupa')
    .select('*')
    .eq('pembuat_id', userId)
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

// ---------- Gambar ----------
function kanvasKeBlob(kanvas) {
  return new Promise((resolve, reject) => {
    kanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat gambar dari kanvas'))),
      'image/webp',
      0.92,
    )
  })
}

// sumber: elemen kanvas (hasil lukisan) atau File (gambar yang diunggah)
export async function unggahKarya(sumber) {
  const { data: sesi } = await supabase.auth.getSession()
  const userId = sesi.session?.user.id
  if (!userId) throw new Error('Kamu harus masuk dulu')

  const blob =
    sumber instanceof HTMLCanvasElement
      ? await kanvasKeBlob(sumber)
      : await kecilkanGambar(sumber, 2000)

  const path = `${userId}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage
    .from('karya')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('karya').getPublicUrl(path).data.publicUrl
}

// Bisa menghapus file dari bucket mana pun (gambar lama maupun karya baru)
export async function hapusFileGambar(url) {
  const cocok = url.match(/\/object\/public\/([^/]+)\/(.+)$/)
  if (!cocok) return
  await supabase.storage.from(cocok[1]).remove([decodeURIComponent(cocok[2])])
}

// ---------- Tulis ----------
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
    .update({ nama, kategori })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Kamu tidak punya izin mengubah karya ini')
}

export async function hapusSeniRupa(karya) {
  const { data, error } = await supabase
    .from('seni_rupa')
    .delete()
    .eq('id', karya.id)
    .select('id')
  if (error) throw error
  // Aturan akses yang menolak tidak melempar error, hanya 0 baris terhapus.
  if (data.length === 0) throw new Error('Kamu tidak punya izin menghapus karya ini')
  await hapusFileGambar(karya.gambar_url)
}