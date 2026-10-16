import { supabase } from './supabase'

function potongPersegi(file, sisi = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ukuran = Math.min(img.width, img.height)
      const sx = (img.width - ukuran) / 2
      const sy = (img.height - ukuran) / 2
      const kanvas = document.createElement('canvas')
      kanvas.width = sisi
      kanvas.height = sisi
      kanvas.getContext('2d').drawImage(img, sx, sy, ukuran, ukuran, 0, 0, sisi, sisi)
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

export async function gantiAvatar(file, userId, avatarLama) {
  const blob = await potongPersegi(file)
  const path = `${userId}/${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage
    .from('avatar')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (error) throw error

  const url = supabase.storage.from('avatar').getPublicUrl(path).data.publicUrl
  const { error: errorRpc } = await supabase.rpc('ganti_avatar', { p_url: url })
  if (errorRpc) {
    await supabase.storage.from('avatar').remove([path])
    throw errorRpc
  }

  const lama = avatarLama?.split('/avatar/')[1]
  if (lama) await supabase.storage.from('avatar').remove([lama])
  return url
}