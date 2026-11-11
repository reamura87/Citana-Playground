// Reaksi sentuh karakter. Semua kalimat ditulis lokal, jadi tidak memakai kuota AI.
const L = {
  kepala: ['Eh?! Kepalaku...', 'Hyaa! Jangan tiba-tiba, dong!', 'Hm? Ada apa?'],
  wajah: ['H-hei, pipiku jangan dicolek...', 'Geli, tau!', 'A-apaan sih...'],
  badan: ['Hei, jangan iseng~', 'Hm? Kamu butuh sesuatu? Tanya aja langsung.', 'Colek-colek itu bukan cara bertanya, lho.'],
  rambut: ['Rambutku jangan ditarik-tarik!', 'Eh, baru kusisir tadi...', 'Hati-hati sama rambutku, dong!'],
  elus: ['Ehehe... enak juga.', 'Hmm~ nyaman...', 'Jangan berhenti... eh, maksudku, terserah kamu.'],
  reda: ['...Hmph. Yaudah, dimaafkan. Tapi sekali ini aja!', 'Se-sebenarnya aku nggak marah banget kok...'],
  kesal1: ['Eh... kok dicolek terus?', 'Mulai agak kesal, nih...'],
  kesal2: ['Sudah ya, jangan colek lagi.', 'Aku bisa marah beneran, lho.'],
  marah: ['SUDAH CUKUP! Jangan colek terus!!', 'AWAS YA!! Aku marah, nih!'],
  ngambek: ['Hmph.', 'Aku masih marah!', 'Nggak mau ngomong sama kamu.', '...Elus kepalaku dulu kalau mau minta maaf.'],
}

const PER_ZONA = {
  kepala: { ekspresi: 'kaget', baris: L.kepala },
  wajah: { ekspresi: 'malu', baris: L.wajah, partikel: 'bintang' },
  badan: { ekspresi: 'bingung', baris: L.badan },
  rambut: { ekspresi: 'kaget', baris: L.rambut },
}

const pilih = (daftar, acak) => daftar[Math.floor(acak() * daftar.length)]

export function bikinPerasaan() {
  return { kesal: 0, terakhir: 0, marahSampai: 0, elusTerakhir: 0 }
}

// s: objek perasaan (diubah langsung). jenis: 'colek' | 'elus'.
// Mengembalikan { ekspresi, teks, durasi, partikel } atau null bila tidak ada reaksi.
export function reaksiSentuh(s, zonaAsli, jenis, sekarang = Date.now(), acak = Math.random) {
  const zona = zonaAsli === 'rok' ? 'badan' : zonaAsli
  if (!PER_ZONA[zona]) return null

  // rasa kesal mereda 1 poin tiap 4 detik
  const lewat = s.terakhir ? Math.floor((sekarang - s.terakhir) / 4000) : 0
  s.kesal = Math.max(0, s.kesal - lewat)
  s.terakhir = sekarang
  const marah = sekarang < s.marahSampai

  if (jenis === 'elus') {
    if (zona !== 'kepala' && zona !== 'rambut') return null
    if (marah) {
      s.marahSampai = 0
      s.kesal = 0
      return { ekspresi: 'malu', teks: pilih(L.reda, acak), durasi: 4000, partikel: 'hati' }
    }
    s.kesal = Math.max(0, s.kesal - 1)
    const bicara = sekarang - s.elusTerakhir > 5000
    s.elusTerakhir = sekarang
    return { ekspresi: acak() < 0.25 ? 'malu' : 'senang', teks: bicara ? pilih(L.elus, acak) : null, durasi: 2500, partikel: 'hati' }
  }

  s.kesal += 1
  if (marah) {
    s.marahSampai = Math.max(s.marahSampai, sekarang + 4000)
    return { ekspresi: 'marah', teks: pilih(L.ngambek, acak), durasi: 2600, partikel: null }
  }
  if (s.kesal >= 6) {
    s.marahSampai = sekarang + 10000
    return { ekspresi: 'marah', teks: pilih(L.marah, acak), durasi: 4500, partikel: 'marah' }
  }
  if (s.kesal >= 4) return { ekspresi: 'kesal', teks: pilih(L.kesal2, acak), durasi: 2800, partikel: null }
  if (s.kesal === 3) return { ekspresi: 'kesal', teks: pilih(L.kesal1, acak), durasi: 2800, partikel: null }
  const z = PER_ZONA[zona]
  return { ekspresi: z.ekspresi, teks: pilih(z.baris, acak), durasi: 2400, partikel: z.partikel ?? null }
}
