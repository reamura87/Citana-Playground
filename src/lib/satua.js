import { supabase } from './supabase'

// ---------- Baca (publik: hanya yang terbit) ----------
export async function ambilSatua() {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .eq('terbit', true)
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

export async function ambilSatuaBySlug(slug) {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .eq('slug', slug)
    .eq('terbit', true)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---------- Baca (admin: termasuk draf) ----------
export async function ambilSemuaUntukAdmin() {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .order('diperbarui_pada', { ascending: false })
  if (error) throw error
  return data
}

export async function ambilSatuaById(id) {
  const { data, error } = await supabase
    .from('satua')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ambilKategori() {
  const { data, error } = await supabase.from('satua').select('kategori')
  if (error) throw error
  return [...new Set(data.map((d) => d.kategori))]
}

// ---------- Tulis ----------
export async function simpanSatua(satua) {
  const { id, ...isi } = satua
  if (id) {
    const { error } = await supabase
      .from('satua')
      .update({ ...isi, diperbarui_pada: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('satua')
    .insert({ ...isi, slug: buatSlug(isi.judul) })
  if (error) throw error
}

export async function hapusSatua(id) {
  const { error } = await supabase.from('satua').delete().eq('id', id)
  if (error) throw error
}

function buatSlug(judul) {
  const dasar = judul
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${dasar || 'satua'}-${Math.random().toString(36).slice(2, 6)}`
}

// ---------- Gambar ----------
// Gambar dikecilkan (maks 1600px) dan diubah ke WebP sebelum diunggah,
// supaya jatah penyimpanan gratis tidak cepat habis.
export function kecilkanGambar(file, lebarMaks = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const skala = Math.min(1, lebarMaks / img.width)
      const kanvas = document.createElement('canvas')
      kanvas.width = Math.round(img.width * skala)
      kanvas.height = Math.round(img.height * skala)
      kanvas.getContext('2d').drawImage(img, 0, 0, kanvas.width, kanvas.height)
      URL.revokeObjectURL(url)
      kanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar'))),
        'image/webp',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File bukan gambar yang valid'))
    }
    img.src = url
  })
}

async function kirimBlob(blob, folder) {
  const path = `${folder}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage
    .from('gambar')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('gambar').getPublicUrl(path).data.publicUrl
}

export async function unggahGambar(file, { folder = 'satua', lebarMaks = 1600 } = {}) {
  const blob = await kecilkanGambar(file, lebarMaks)
  return kirimBlob(blob, folder)
}

export function unggahKanvas(kanvas, folder = 'seni-rupa') {
  return new Promise((resolve, reject) => {
    kanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal membuat gambar dari kanvas'))
          return
        }
        kirimBlob(blob, folder).then(resolve, reject)
      },
      'image/webp',
      0.92,
    )
  })
}

// ---------- Pembantu tampilan ----------
const hariIniLokal = () => new Date().toLocaleDateString('sv-SE')

export function adalahHariIni(item) {
  return new Date(item.diperbarui_pada).toLocaleDateString('sv-SE') === hariIniLokal()
}

export function formatTanggal(tanggal) {
  if (!tanggal) return ''
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function teksPolos(html) {
  return html.replace(/<[^>]+>/g, ' ')
}

// Kelompokkan per kategori; urutan kategori mengikuti cerita terbarunya.
export function kelompokkan(daftar) {
  const peta = new Map()
  for (const s of daftar) {
    if (!peta.has(s.kategori)) peta.set(s.kategori, [])
    peta.get(s.kategori).push(s)
  }
  return [...peta.entries()]
}