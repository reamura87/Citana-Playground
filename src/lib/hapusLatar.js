export const BATAS = {
  ukuranMaks: 10 * 1024 * 1024, // 10 MB
  tipeBoleh: ['image/png', 'image/jpeg', 'image/webp'],
}

const layarSentuh = () => window.matchMedia?.('(pointer: coarse)').matches ?? false
const sisiMaks = () => (layarSentuh() ? 1536 : 2048)

export function periksaFile(file) {
  if (!BATAS.tipeBoleh.includes(file.type)) return 'Format harus PNG, JPG, atau WebP.'
  if (file.size > BATAS.ukuranMaks) {
    return `Ukuran file maksimal ${BATAS.ukuranMaks / 1024 / 1024} MB.`
  }
  return null
}

// Memperkecil gambar kalau terlalu besar, supaya memori perangkat aman
export async function siapkanGambar(file) {
  const bitmap = await createImageBitmap(file)
  try {
    const skala = Math.min(1, sisiMaks() / Math.max(bitmap.width, bitmap.height))
    if (skala === 1) {
      return { blob: file, lebar: bitmap.width, tinggi: bitmap.height, dikecilkan: false }
    }
    const lebar = Math.round(bitmap.width * skala)
    const tinggi = Math.round(bitmap.height * skala)
    const kanvas = document.createElement('canvas')
    kanvas.width = lebar
    kanvas.height = tinggi
    kanvas.getContext('2d').drawImage(bitmap, 0, 0, lebar, tinggi)
    const blob = await new Promise((resolve, reject) => {
      kanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar'))),
        'image/png',
      )
    })
    return { blob, lebar, tinggi, dikecilkan: true }
  } finally {
    bitmap.close()
  }
}

// Pustaka dimuat malas: hanya saat benar-benar dipakai
export async function hapusLatar(blob, onProgress) {
  if (typeof WebAssembly === 'undefined') {
    throw new Error('Browser ini tidak mendukung WebAssembly')
  }
  const modul = await import('@imgly/background-removal')
  const removeBackground = modul.removeBackground ?? modul.default
  return removeBackground(blob, {
    model: layarSentuh() ? 'isnet_quint8' : 'isnet_fp16',
    output: { format: 'image/png' },
    progress: (kunci, sekarang, total) => onProgress?.(kunci, sekarang, total),
  })
}