// Mengubah aliran SSE dari penyedia AI menjadi aliran teks biasa untuk klien.
// jenis: 'anthropic' (event content_block_delta) atau 'openai' (choices[0].delta.content,
// dipakai Groq, Cloudflare Workers AI, Qwen/DashScope, OpenRouter, dan sebagian besar penyedia lain).

// Panjang akhiran s yang merupakan awalan tag (untuk menahan potongan "<thi" sampai lengkap)
function awalanTag(s, tag) {
  for (let n = Math.min(s.length, tag.length - 1); n > 0; n -= 1) {
    if (tag.startsWith(s.slice(s.length - n))) return n
  }
  return 0
}

// Membuang blok <think>...</think> (model penalaran) yang bisa terpotong di antara potongan aliran
export function buatPenyaringPikir() {
  let dalam = false
  let sisa = ''
  return {
    dorong(teks) {
      sisa += teks
      let hasil = ''
      for (;;) {
        if (!dalam) {
          const i = sisa.indexOf('<think>')
          if (i === -1) {
            const tahan = awalanTag(sisa, '<think>')
            hasil += sisa.slice(0, sisa.length - tahan)
            sisa = sisa.slice(sisa.length - tahan)
            return hasil
          }
          hasil += sisa.slice(0, i)
          sisa = sisa.slice(i + 7)
          dalam = true
        } else {
          const j = sisa.indexOf('</think>')
          if (j === -1) {
            sisa = sisa.slice(Math.max(0, sisa.length - 8))
            return hasil
          }
          sisa = sisa.slice(j + 8)
          dalam = false
        }
      }
    },
    selesai() {
      const s = dalam ? '' : sisa
      sisa = ''
      return s
    },
  }
}

function ambilTeks(e, jenis) {
  if (jenis === 'anthropic') {
    return e.type === 'content_block_delta' && e.delta?.type === 'text_delta' ? e.delta.text : ''
  }
  const t = e.choices?.[0]?.delta?.content
  return typeof t === 'string' ? t : ''
}

export function ubahAliran(badan, jenis = 'anthropic') {
  const pembaca = badan.getReader()
  const dekoder = new TextDecoder()
  const pengkode = new TextEncoder()
  const saring = buatPenyaringPikir()
  let sisa = ''
  let habis = false
  return new ReadableStream({
    async pull(pengendali) {
      while (!habis) {
        const { done, value } = await pembaca.read()
        let keluar = ''
        if (done) {
          habis = true
          keluar = saring.selesai()
        } else {
          sisa += dekoder.decode(value, { stream: true })
          const baris = sisa.split('\n')
          sisa = baris.pop() ?? ''
          for (const b of baris) {
            if (!b.startsWith('data:')) continue
            const isi = b.slice(5).trim()
            if (!isi || isi === '[DONE]') continue
            let e
            try {
              e = JSON.parse(isi)
            } catch {
              continue
            }
            keluar += saring.dorong(ambilTeks(e, jenis))
          }
        }
        if (keluar) {
          pengendali.enqueue(pengkode.encode(keluar))
          return
        }
      }
      pengendali.close()
    },
    cancel() {
      return pembaca.cancel()
    },
  })
}
