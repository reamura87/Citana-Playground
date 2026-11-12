// Suara asisten. Dua mode selain senyap:
//  - "animalese": bunyi imut bergaya Animal Crossing, disintesis dengan Web Audio (tanpa berkas audio, tanpa biaya)
//  - "asli": suara bahasa Indonesia bawaan perangkat lewat speechSynthesis (membaca teks yang sama persis)
// Bila perangkat tidak punya suara Indonesia, mode "asli" otomatis memakai Animalese.

const KUNCI_MODE = 'asisten-suara'

// Karakter suara: idol ceria bernada sopran. Ubah angka-angka ini untuk menyetel suara.
const NADA_DASAR = 520 // Hz, sekitar C5. Makin besar makin tinggi
const NADA_MAKS = 880 // batas atas agar tidak melengking (A5)
const GESER_FORMANT = 1.12 // 1 = dewasa, lebih besar = saluran suara "lebih kecil", terdengar lebih muda dan cerah
const KECEPATAN_DASAR = 1.1 // bicara sedikit lebih cepat dan bersemangat
export const MODE_SUARA = ['mati', 'animalese', 'asli']
export const NAMA_MODE = { mati: 'Suara mati', animalese: 'Suara Animalese', asli: 'Suara asli' }

// ---------- Fungsi murni (mudah diuji) ----------

// Membersihkan teks balasan agar enak dibaca/diucapkan
export function bersihkanUntukSuara(teks) {
  return String(teks ?? '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_`#>~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Memecah teks menjadi potongan kalimat pendek (speechSynthesis di sebagian browser memotong ucapan yang panjang)
export function pecahKalimat(teks, maks = 180) {
  const hasil = []
  for (const kalimat of teks.split(/(?<=[.!?…])\s+/)) {
    let sisa = kalimat.trim()
    while (sisa.length > maks) {
      let titik = sisa.lastIndexOf(' ', maks)
      if (titik < 40) titik = maks
      hasil.push(sisa.slice(0, titik).trim())
      sisa = sisa.slice(titik).trim()
    }
    if (sisa) hasil.push(sisa)
  }
  return hasil
}

// Memilih suara bahasa Indonesia yang paling mungkin terdengar wanita. Mengembalikan null bila tidak ada.
export function pilihSuaraIndonesia(daftar) {
  const kandidat = (daftar ?? []).filter((v) => /^id([-_]|$)/i.test(v.lang ?? ''))
  if (kandidat.length === 0) return null
  const nilai = (v) => {
    const n = `${v.name ?? ''}`
    let s = 0
    if (/gadis|damayanti|female|wanita|perempuan/i.test(n)) s += 3
    if (/natural|online|neural/i.test(n)) s += 2
    if (/google/i.test(n)) s += 1
    if (/ardi|andika|\bmale\b|pria|laki/i.test(n)) s -= 5
    return s
  }
  return [...kandidat].sort((a, b) => nilai(b) - nilai(a))[0]
}

// Formant (F1, F2) pendekatan untuk tiap vokal
const VOKAL = { a: [800, 1250], i: [320, 2400], u: [380, 950], e: [550, 1900], o: [520, 1000] }
// Bobot tiap formant saat diputar: formant ketiga (~3,3 kHz) memberi kilau seperti suara penyanyi sopran
const BOBOT_FORMANT = [1, 0.8, 0.45]
const FORMANT_KILAU = 3300

// Penyetara volume antarvokal (vokal u dan o secara alami lebih keras)
const GAIN_VOKAL = { a: 1, i: 1.05, u: 0.72, e: 1, o: 0.85 }
const DESIS = new Set(['f', 'h', 's', 'x', 'z'])
const LETUP = new Set(['c', 'k', 'p', 'q', 't'])

// Mengubah teks menjadi rangkaian bunyi pendek. Tiap huruf menjadi satu bunyi dengan nada sedikit berbeda,
// akhir kalimat tanya dinaikkan dan akhir kalimat biasa diturunkan, seperti bicara Animal Crossing.
export function rencanaAnimalese(teks, o = {}) {
  const { dasar = NADA_DASAR, kecepatan = KECEPATAN_DASAR, acak = Math.random, maks = 260, volume = 1, geserFormant = GESER_FORMANT } = o
  const blip = []
  let t = 0
  let awal = 0 // indeks blip pertama pada kalimat yang sedang berjalan
  let awalFrasa = 0 // indeks blip pertama pada frasa (potongan antar koma) yang sedang berjalan
  const geser = (b, st) => {
    b.f0 = Math.min(NADA_MAKS, b.f0 * 2 ** (st / 12))
  }
  // Ujung frasa naik sedikit sehingga terdengar riang
  const angkatFrasa = () => {
    const bagian = blip.slice(awalFrasa)
    for (let i = Math.max(0, bagian.length - 2); i < bagian.length; i += 1) geser(bagian[i], 1.5)
    awalFrasa = blip.length
  }
  const tutupKalimat = (tanda) => {
    const bagian = blip.slice(awal)
    if (bagian.length === 0) return
    if (tanda === '?') {
      const n = Math.min(8, bagian.length)
      for (let i = 0; i < n; i += 1) geser(bagian[bagian.length - n + i], (5 * (i + 1)) / n)
    } else if (tanda === '!') {
      for (const b of bagian) {
        geser(b, 3)
        b.vol *= 1.15
      }
    } else {
      const n = Math.min(5, bagian.length)
      for (let i = 0; i < n; i += 1) geser(bagian[bagian.length - n + i], (-1 * (i + 1)) / n)
    }
    awal = blip.length
    awalFrasa = blip.length
  }

  for (const ch of teks.slice(0, maks).toLowerCase()) {
    if (/[a-z]/.test(ch)) {
      const semiton = ((ch.charCodeAt(0) * 5) % 9) - 4 + (acak() - 0.5)
      const f0 = dasar * 2 ** (semiton / 12)
      if (VOKAL[ch]) {
        blip.push({ t, dur: 0.085, f0, jenis: 'vokal', formant: [...VOKAL[ch].map((f) => f * geserFormant), FORMANT_KILAU], vol: volume * GAIN_VOKAL[ch] })
        t += 0.08 / kecepatan
      } else if (DESIS.has(ch)) {
        blip.push({ t, dur: 0.045, f0, jenis: 'desis', formant: [4800], vol: 0.45 * volume })
        t += 0.045 / kecepatan
      } else if (LETUP.has(ch)) {
        blip.push({ t, dur: 0.025, f0, jenis: 'letup', formant: [2600], vol: 0.5 * volume })
        t += 0.032 / kecepatan
      } else {
        blip.push({ t, dur: 0.045, f0, jenis: 'suara', formant: [420 * geserFormant, 1500 * geserFormant], vol: 0.6 * volume })
        t += 0.046 / kecepatan
      }
    } else if (ch === ' ') {
      t += 0.04 / kecepatan
    } else if (/[,;:]/.test(ch)) {
      t += 0.14 / kecepatan
      angkatFrasa()
    } else if (/[.!?…]/.test(ch)) {
      t += 0.28 / kecepatan
      tutupKalimat(ch)
    }
  }
  tutupKalimat('.')
  return { blip, durasi: t + 0.1 }
}

// Pengaturan suara menurut ekspresi: [pengali nada, pengali kecepatan, pengali volume]
const WATAK = {
  netral: [1, 1, 1],
  senang: [1.1, 1.08, 1],
  malu: [1.06, 0.92, 0.7],
  kaget: [1.25, 1.2, 1.1],
  kesal: [0.95, 1.1, 1.05],
  marah: [0.88, 1.2, 1.2],
  sedih: [0.9, 0.85, 0.75],
  jahil: [1.05, 1, 1],
  bingung: [1.05, 0.95, 0.9],
  berpikir: [1, 0.9, 0.85],
}

// ---------- Pemutaran (hanya di browser) ----------

export function buatDerau(ctx) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  return buf
}

export function mainkanRencana(ctx, tujuan, rencana, mulai, derau) {
  for (const b of rencana.blip) {
    const t0 = mulai + b.t
    const g = ctx.createGain()
    const puncak = 1.7 * b.vol
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(puncak, t0 + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + b.dur)
    g.connect(tujuan)
    if (b.jenis === 'vokal' || b.jenis === 'suara') {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      if (b.jenis === 'vokal') {
        // meluncur naik dari sedikit di bawah nada: khas bicara imut
        osc.frequency.setValueAtTime(b.f0 * 0.9, t0)
        osc.frequency.linearRampToValueAtTime(b.f0, t0 + 0.02)
      } else {
        osc.frequency.setValueAtTime(b.f0, t0)
      }
      osc.frequency.linearRampToValueAtTime(b.f0 * 0.985, t0 + b.dur)
      b.formant.forEach((f, i) => {
        const bq = ctx.createBiquadFilter()
        bq.type = 'bandpass'
        bq.frequency.value = f
        bq.Q.value = 5
        const bobot = ctx.createGain()
        bobot.gain.value = BOBOT_FORMANT[i] ?? 0.4
        osc.connect(bq)
        bq.connect(bobot)
        bobot.connect(g)
      })
      osc.start(t0)
      osc.stop(t0 + b.dur + 0.02)
    } else {
      const s = ctx.createBufferSource()
      s.buffer = derau
      const bq = ctx.createBiquadFilter()
      bq.type = 'bandpass'
      bq.frequency.value = b.formant[0]
      bq.Q.value = 1.2
      s.connect(bq)
      bq.connect(g)
      s.start(t0)
      s.stop(t0 + b.dur + 0.02)
    }
  }
}

function bacaMode() {
  try {
    const m = localStorage.getItem(KUNCI_MODE)
    return MODE_SUARA.includes(m) ? m : 'mati'
  } catch {
    return 'mati'
  }
}

// Pengucap: satu objek yang mengatur mode, pembukaan kunci audio browser, pemutaran, dan penghentian.
export function buatPengucap() {
  let mode = bacaMode()
  let ctx = null
  let master = null
  let derau = null
  let jalur = null
  let timer = null
  let selesaiAktif = null
  let sesi = 0
  let terbuka = false
  const adaTTS =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  function pastikanCtx() {
    if (ctx) return ctx
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    // pembatas agar suara yang keras (marah, kaget) tidak pecah
    const pembatas = ctx.createDynamicsCompressor?.()
    if (pembatas) {
      pembatas.threshold.value = -12
      pembatas.ratio.value = 12
      master.connect(pembatas)
      pembatas.connect(ctx.destination)
    } else {
      master.connect(ctx.destination)
    }
    derau = buatDerau(ctx)
    return ctx
  }

  // Browser (terutama Safari iOS) hanya mengizinkan audio setelah interaksi pengguna: panggil dari klik/ketik.
  function buka() {
    if (terbuka) return
    terbuka = true
    try {
      const c = pastikanCtx()
      c?.resume?.()
      if (c) {
        const s = c.createBufferSource()
        s.buffer = c.createBuffer(1, 1, c.sampleRate)
        s.connect(c.destination)
        s.start(0)
      }
    } catch {
      // abaikan: audio akan dicoba lagi saat dipakai
    }
    if (adaTTS) {
      try {
        window.speechSynthesis.getVoices()
      } catch {
        // abaikan
      }
    }
  }

  function berhenti() {
    sesi += 1
    clearTimeout(timer)
    timer = null
    if (adaTTS) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // abaikan
      }
    }
    if (jalur && ctx) {
      try {
        jalur.gain.cancelScheduledValues(ctx.currentTime)
        jalur.gain.setTargetAtTime(0, ctx.currentTime, 0.01)
      } catch {
        // abaikan
      }
      jalur = null
    }
    const s = selesaiAktif
    selesaiAktif = null
    s?.()
  }

  function animalese(teks, ekspresi, id, onMulai, selesai) {
    const c = pastikanCtx()
    if (!c) return selesai()
    c.resume?.()
    const [nada, cepat, keras] = WATAK[ekspresi] ?? WATAK.netral
    const rencana = rencanaAnimalese(teks, { dasar: NADA_DASAR * nada, kecepatan: KECEPATAN_DASAR * cepat, volume: keras })
    jalur = c.createGain()
    jalur.connect(master)
    mainkanRencana(c, jalur, rencana, c.currentTime + 0.05, derau)
    onMulai?.()
    timer = setTimeout(() => {
      if (id === sesi) selesai()
    }, (rencana.durasi + 0.15) * 1000)
  }

  function suaraAsli(teks, suara, ekspresi, id, onMulai, selesai) {
    const [nada, cepat] = WATAK[ekspresi] ?? WATAK.netral
    const bagian = pecahKalimat(teks)
    bagian.forEach((kalimat, i) => {
      const u = new window.SpeechSynthesisUtterance(kalimat)
      u.voice = suara
      u.lang = suara.lang
      u.pitch = Math.min(2, 1.5 * nada)
      u.rate = Math.min(1.6, 1.12 * cepat)
      if (i === 0) u.onstart = () => id === sesi && onMulai?.()
      u.onerror = () => id === sesi && selesai()
      if (i === bagian.length - 1) u.onend = () => id === sesi && selesai()
      window.speechSynthesis.speak(u)
    })
  }

  // Mengucapkan teks sesuai mode. onMulai/onSelesai dipakai untuk menggerakkan mulut karakter.
  function ucapkan(teks, { ekspresi = 'netral', onMulai, onSelesai } = {}) {
    berhenti()
    if (mode === 'mati') return
    const bersih = bersihkanUntukSuara(teks)
    if (!bersih) return
    const id = sesi
    selesaiAktif = onSelesai ?? null
    const selesai = () => {
      if (id !== sesi) return
      const s = selesaiAktif
      selesaiAktif = null
      s?.()
    }
    if (mode === 'asli' && adaTTS) {
      const suara = pilihSuaraIndonesia(window.speechSynthesis.getVoices())
      if (suara) return suaraAsli(bersih, suara, ekspresi, id, onMulai, selesai)
    }
    animalese(bersih, ekspresi, id, onMulai, selesai)
  }

  return {
    mode: () => mode,
    setMode(m) {
      if (!MODE_SUARA.includes(m)) return
      mode = m
      try {
        localStorage.setItem(KUNCI_MODE, m)
      } catch {
        // abaikan
      }
      if (m === 'mati') berhenti()
    },
    // true/false bila diketahui, null bila daftar suara belum selesai dimuat
    suaraAsliTersedia() {
      if (!adaTTS) return false
      const daftar = window.speechSynthesis.getVoices()
      if (daftar.length === 0) return null
      return pilihSuaraIndonesia(daftar) !== null
    },
    buka,
    ucapkan,
    berhenti,
  }
}
