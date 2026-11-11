import { supabase } from './supabase'

// Mengirim riwayat obrolan ke /api/asisten dan menerima jawaban yang mengalir.
// onPotongan(teksLengkapSejauhIni) dipanggil setiap ada teks baru. Mengembalikan { teks, sisa }.
export async function tanyaAsisten(riwayat, onPotongan, sinyal) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Masuk dulu ya supaya bisa ngobrol denganku.')

  const res = await fetch('/api/asisten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pesan: riwayat }),
    signal: sinyal,
  })
  if (!res.ok) {
    let teks = 'Maaf, aku sedang bermasalah. Coba lagi nanti ya.'
    try {
      teks = (await res.json()).pesan ?? teks
    } catch {
      // badan bukan JSON, pakai pesan bawaan
    }
    throw new Error(teks)
  }

  const sisaHeader = res.headers.get('X-Asisten-Sisa')
  const pembaca = res.body.getReader()
  const dekoder = new TextDecoder()
  let semua = ''
  for (;;) {
    const { done, value } = await pembaca.read()
    if (done) break
    semua += dekoder.decode(value, { stream: true })
    onPotongan(semua)
  }
  return { teks: semua, sisa: sisaHeader === null ? null : Number(sisaHeader) }
}
