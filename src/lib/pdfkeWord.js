export const BATAS_PDF = {
  ukuranMaks: 15 * 1024 * 1024, // 15 MB
  halamanMaks: 100,
}

export function periksaPdf(file) {
  const bernamaPdf = file.name.toLowerCase().endsWith('.pdf')
  if (file.type !== 'application/pdf' && !bernamaPdf) return 'File harus berformat PDF.'
  if (file.size > BATAS_PDF.ukuranMaks) {
    return `Ukuran file maksimal ${BATAS_PDF.ukuranMaks / 1024 / 1024} MB.`
  }
  return null
}

// Pustaka dimuat malas: hanya saat benar-benar dipakai
async function muatPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  const { default: urlPekerja } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = urlPekerja
  return pdfjs
}

const ukuranItem = (item) => Math.abs(item.transform[3]) || item.height || 10

function median(angka) {
  if (angka.length === 0) return 0
  const urut = [...angka].sort((a, b) => a - b)
  return urut[Math.floor(urut.length / 2)]
}

// Satu halaman: potongan teks -> baris (dikelompokkan menurut posisi vertikal)
function bacaBaris(items) {
  const teks = items.filter((i) => typeof i.str === 'string' && i.str !== '')
  const urut = [...teks].sort(
    (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
  )

  const kelompok = []
  for (const item of urut) {
    const y = item.transform[5]
    const terakhir = kelompok[kelompok.length - 1]
    if (terakhir && Math.abs(terakhir.y - y) <= ukuranItem(item) * 0.5) {
      terakhir.items.push(item)
    } else {
      kelompok.push({ y, items: [item] })
    }
  }

  return kelompok
    .map((k) => {
      k.items.sort((a, b) => a.transform[4] - b.transform[4])
      let isi = ''
      let akhirX = null
      for (const item of k.items) {
        const x = item.transform[4]
        const celah = akhirX === null ? 0 : x - akhirX
        if (celah > ukuranItem(item) * 0.2 && !isi.endsWith(' ') && !item.str.startsWith(' ')) {
          isi += ' '
        }
        isi += item.str
        akhirX = x + item.width
      }
      return {
        y: k.y,
        x: k.items[0].transform[4],
        ukuran: Math.max(...k.items.map(ukuranItem)),
        teks: isi.replace(/\s+/g, ' ').trim(),
      }
    })
    .filter((b) => b.teks)
}

// Baris -> judul dan paragraf, per halaman
function susunBlok(barisPerHalaman) {
  const ukuranBiasa = median(barisPerHalaman.flatMap((baris) => baris.map((b) => b.ukuran)))

  return barisPerHalaman.map((barisHalaman) => {
    const blok = []
    let paragraf = null
    let sebelumnya = null

    const tutup = () => {
      if (paragraf) {
        blok.push(paragraf)
        paragraf = null
      }
    }

    for (const b of barisHalaman) {
      const besar = ukuranBiasa > 0 && b.ukuran >= ukuranBiasa * 1.25 && b.teks.length <= 120

      if (besar) {
        tutup()
        const rasio = b.ukuran / ukuranBiasa
        const level = rasio >= 1.8 ? 1 : rasio >= 1.4 ? 2 : 3
        const terakhirBlok = blok[blok.length - 1]
        if (
          terakhirBlok?.jenis === 'judul' &&
          terakhirBlok.level === level &&
          sebelumnya &&
          sebelumnya.y - b.y <= b.ukuran * 1.8
        ) {
          terakhirBlok.teks += ` ${b.teks}`
        } else {
          blok.push({ jenis: 'judul', level, teks: b.teks })
        }
        sebelumnya = b
        continue
      }

      const barisBaru =
        !paragraf ||
        sebelumnya.y - b.y > b.ukuran * 1.7 ||
        Math.abs(b.ukuran - sebelumnya.ukuran) > 1.5 ||
        b.x - sebelumnya.x > b.ukuran

      if (barisBaru) {
        tutup()
        paragraf = { jenis: 'paragraf', teks: b.teks }
      } else if (/[-‐]$/.test(paragraf.teks) && !/\s[-‐]$/.test(paragraf.teks)) {
        // kata yang terpotong tanda hubung di akhir baris
        paragraf.teks = paragraf.teks.slice(0, -1) + b.teks
      } else {
        paragraf.teks += ` ${b.teks}`
      }
      sebelumnya = b
    }
    tutup()
    return blok
  })
}

// sinyal: objek { dibatalkan: boolean } untuk menghentikan proses di antara halaman
export async function pdfKeBlok(file, { onProgres, sinyal } = {}) {
  const pdfjs = await muatPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const tugas = pdfjs.getDocument({ data })

  let pdf
  try {
    pdf = await tugas.promise
  } catch (err) {
    await tugas.destroy().catch(() => {})
    if (err?.name === 'PasswordException') {
      throw new Error('PDF ini dikunci dengan kata sandi. Buka kuncinya dulu.', { cause: err })
    }
    throw new Error('PDF tidak bisa dibaca atau rusak.', { cause: err })
  }

  try {
    if (pdf.numPages > BATAS_PDF.halamanMaks) {
      throw new Error(
        `PDF terlalu panjang (${pdf.numPages} halaman). Maksimal ${BATAS_PDF.halamanMaks} halaman.`,
      )
    }

    const barisPerHalaman = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      if (sinyal?.dibatalkan) throw new Error('Dibatalkan.')
      const halaman = await pdf.getPage(i)
      const isi = await halaman.getTextContent()
      barisPerHalaman.push(bacaBaris(isi.items))
      halaman.cleanup()
      onProgres?.(i, pdf.numPages)
    }

    const blok = susunBlok(barisPerHalaman)
    const jumlahKarakter = blok.flat().reduce((n, b) => n + b.teks.length, 0)
    return { blok, jumlahHalaman: pdf.numPages, jumlahKarakter }
  } finally {
    await tugas.destroy().catch(() => {})
  }
}

export async function buatDocx(blok, { pisahHalaman = true } = {}) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = await import('docx')
  const tingkat = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3]

  const isi = []
  blok.forEach((halaman, i) => {
    for (const b of halaman) {
      if (b.jenis === 'judul') {
        isi.push(new Paragraph({ heading: tingkat[b.level - 1], children: [new TextRun(b.teks)] }))
      } else {
        isi.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun(b.teks)] }))
      }
    }
    if (pisahHalaman && i < blok.length - 1) {
      isi.push(new Paragraph({ children: [new PageBreak()] }))
    }
  })
  if (isi.length === 0) isi.push(new Paragraph({}))

  const dokumen = new Document({ sections: [{ children: isi }] })
  return Packer.toBlob(dokumen)
}

export const BATAS_GAMBAR = { halamanMaks: 30 }

const sisiMaksPx = () => (window.matchMedia?.('(pointer: coarse)').matches ? 1400 : 1800)

async function bukaDokumen(file) {
  const pdfjs = await muatPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const tugas = pdfjs.getDocument({ data })
  try {
    const pdf = await tugas.promise
    return { tugas, pdf }
  } catch (err) {
    await tugas.destroy().catch(() => {})
    if (err?.name === 'PasswordException') {
      throw new Error('PDF ini dikunci dengan kata sandi. Buka kuncinya dulu.', { cause: err })
    }
    throw new Error('PDF tidak bisa dibaca atau rusak.', { cause: err })
  }
}

// Setiap halaman PDF digambar jadi JPEG. Ukuran asli halaman (dalam poin) ikut disimpan.
export async function pdfKeGambarHalaman(file, { onProgres, sinyal } = {}) {
  const { tugas, pdf } = await bukaDokumen(file)
  try {
    if (pdf.numPages > BATAS_GAMBAR.halamanMaks) {
      throw new Error(
        `PDF terlalu panjang untuk mode ini (${pdf.numPages} halaman). Maksimal ${BATAS_GAMBAR.halamanMaks} halaman.`,
      )
    }

    const hasil = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      if (sinyal?.dibatalkan) throw new Error('Dibatalkan.')
      const halaman = await pdf.getPage(i)

      const asli = halaman.getViewport({ scale: 1 })
      const skala = Math.min(2, sisiMaksPx() / Math.max(asli.width, asli.height))
      const viewport = halaman.getViewport({ scale: skala })

      const kanvas = document.createElement('canvas')
      kanvas.width = Math.round(viewport.width)
      kanvas.height = Math.round(viewport.height)
      await halaman.render({ canvasContext: kanvas.getContext('2d'), viewport }).promise

      const blob = await new Promise((resolve, reject) => {
        kanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar halaman'))),
          'image/jpeg',
          0.85,
        )
      })
      hasil.push({ data: await blob.arrayBuffer(), lebarPt: asli.width, tinggiPt: asli.height })

      kanvas.width = 0
      kanvas.height = 0
      halaman.cleanup()
      onProgres?.(i, pdf.numPages)
    }
    return hasil
  } finally {
    await tugas.destroy().catch(() => {})
  }
}

// Satu halaman Word per halaman PDF, ukuran kertas sama, gambar memenuhi halaman
export async function buatDocxGambar(halaman) {
  const { Document, Packer, Paragraph, ImageRun } = await import('docx')
  const kecilSedikit = 0.995 // supaya Word tidak menambah halaman kosong

  const dokumen = new Document({
    sections: halaman.map((h) => ({
      properties: {
        page: {
          size: { width: Math.round(h.lebarPt * 20), height: Math.round(h.tinggiPt * 20) },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: 'jpg',
              data: h.data,
              transformation: {
                width: Math.round(((h.lebarPt * 96) / 72) * kecilSedikit),
                height: Math.round(((h.tinggiPt * 96) / 72) * kecilSedikit),
              },
            }),
          ],
        }),
      ],
    })),
  })
  return Packer.toBlob(dokumen)
}