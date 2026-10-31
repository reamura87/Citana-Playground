// Musik latar "Don Dapdape" (lagu daerah Bali) dan efek suara bergaya 8-bit.
// Semua suara dibuat dengan kode (Web Audio API), tanpa berkas audio.

const KUNCI_NYALA = 'citana-suara-nyala'
const KUNCI_VOLUME = 'citana-suara-volume'
const BPM = 120
const DETIK = 60 / BPM // detik per ketukan
const DASAR = 60 // nada "1" = C4
const TANGGA = [0, 0, 2, 4, 5, 7, 9, 11] // 1..7 = do re mi fa sol la si (C mayor)

// Bas per akord: [nada ketukan 1, nada ketukan 3] sebagai angka MIDI
const BAS = { C: [48, 43], Dm: [50, 45], 'Dm/F': [41, 50], Em: [52, 47], G: [43, 50], Am: [45, 52] }

// [akord, 'nada:ketukan ...'] per birama. Angka = tangga nada, ^ = oktaf tinggi, 0 = jeda.
const PEMBUKA = [
  ['C', '0:1 1:1 2:1 3:1'],
  ['C', '5:1.5 1^:.5 6:1 1^:1'],
  ['Dm/F', '2^:1.5 1^:.5 6:1 5:.5 3:.5'],
  ['C', '5:4'],
]
const ISI = [
  // baris 2
  ['C', '0:1 0:1 1^:1 6:.5 1^:.5'],
  ['Dm', '2^:1.5 1^:.5 6:1 5:1'],
  ['Em', '3:1.5 3:.5 2:1 1:1'],
  ['G', '5:1.5 5:.5 3:1 2:1'],
  // baris 3
  ['C', '1:4'],
  ['G', '0:1 1:.5 1:.5 2:1 3:1'],
  ['C', '5:1.5 1^:.25 1^:.25 6:1 1^:1'],
  ['Dm/F', '2^:1.5 1^:.5 6:1 5:.5 3:.5'],
  // baris 4
  ['C', '5:4'],
  ['G', '0:1 1:.5 1:.5 2:1 3:1'],
  ['C', '5:1.5 1^:.25 1^:.25 6:1 1^:1'],
  ['Dm/F', '2^:1.5 1^:.5 6:1 5:.5 3:.5'],
  // baris 5
  ['C', '5:4'],
  ['C', '0:1 0:1 1^:1 6:.5 1^:.5'],
  ['Dm', '2^:1.5 1^:.5 6:1 5:1'],
  ['Am', '3:1.5 3:.5 2:1 1:1'],
  // baris 6
  ['G', '5:1 5:1 2:.5 3:.5 2:1'],
  ['C', '1:4'],
  ['C', '0:1.5 1:.5 1:1 3:1'],
  ['G', '2:1.5 2:.5 2:1 5:1'],
  // baris 7
  ['C', '3:1 3:.5 1:.5 3:1 1:1'],
  ['Dm', '2:4'],
  ['G', '0:1 1:.5 1:.5 2:1 3:1'],
  ['C', '5:1 5:.5 6:.5 5:1 2:1'],
  // baris 8
  ['G', '3:1.5 5:.5 3:1 2:1'],
  ['C', '1:4'],
]
const LAGU = [...PEMBUKA, ...PEMBUKA, ...ISI] // baris pertama diulang

// Urai partitur menjadi daftar nada bertanda waktu
const PERISTIWA = []
let ketuk = 0
for (const [akord, nada] of LAGU) {
  const awal = ketuk
  for (const t of nada.split(' ')) {
    const [kode, lama] = t.split(':')
    const tinggi = kode.endsWith('^')
    const angka = Number(kode.replace('^', ''))
    const dur = Number(lama)
    if (angka > 0) {
      PERISTIWA.push({ mulai: ketuk, dur, jenis: 'melodi', midi: DASAR + TANGGA[angka] + (tinggi ? 12 : 0) })
    }
    ketuk += dur
  }
  const [a, b] = BAS[akord]
  PERISTIWA.push({ mulai: awal, dur: 1.9, jenis: 'bas', midi: a })
  PERISTIWA.push({ mulai: awal + 2, dur: 1.9, jenis: 'bas', midi: b })
}
PERISTIWA.sort((x, y) => x.mulai - y.mulai)
const PANJANG = ketuk + 2 // jeda dua ketukan sebelum lagu diulang

function baca(kunci, bawaan) {
  try {
    return localStorage.getItem(kunci) ?? bawaan
  } catch {
    return bawaan
  }
}
function simpan(kunci, nilai) {
  try {
    localStorage.setItem(kunci, nilai)
  } catch {
    // penyimpanan tidak tersedia, abaikan
  }
}

const S = {
  ctx: null,
  master: null,
  musik: null,
  sfxBus: null,
  pulsa: null,
  derau: null,
  nyala: baca(KUNCI_NYALA, '1') === '1',
  volume: Math.min(1, Math.max(0, Number(baca(KUNCI_VOLUME, '0.7')) || 0.7)),
  berjalan: false,
  timer: null,
  indeks: 0,
  awalLoop: 0,
  pendengar: new Set(),
  cuplikan: null,
  terakhir: {},
  terpasang: false,
  pantauTab: false,
}
S.cuplikan = { nyala: S.nyala, volume: S.volume }

function umumkan() {
  S.cuplikan = { nyala: S.nyala, volume: S.volume }
  S.pendengar.forEach((f) => f())
}

// Gelombang pulsa dengan siklus tugas tertentu (25% seperti kanal pulsa NES)
function bentukPulsa(ctx, tugas) {
  const n = 32
  const real = new Float32Array(n)
  const imag = new Float32Array(n)
  for (let k = 1; k < n; k += 1) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * tugas)
  return ctx.createPeriodicWave(real, imag)
}

function pastikanCtx() {
  if (S.ctx) return S.ctx
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = S.nyala ? S.volume : 0
  master.connect(ctx.destination)
  const musik = ctx.createGain()
  musik.gain.value = 0.6
  musik.connect(master)
  const sfxBus = ctx.createGain()
  sfxBus.gain.value = 1
  sfxBus.connect(master)
  const derau = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate)
  const data = derau.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  S.ctx = ctx
  S.master = master
  S.musik = musik
  S.sfxBus = sfxBus
  S.pulsa = bentukPulsa(ctx, 0.25)
  S.derau = derau
  return ctx
}

function mainkanNada(e, t) {
  const ctx = S.ctx
  const detik = e.dur * DETIK
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  if (e.jenis === 'melodi') osc.setPeriodicWave(S.pulsa)
  else osc.type = 'triangle'
  osc.frequency.value = 440 * 2 ** ((e.midi - 69) / 12)
  const puncak = e.jenis === 'melodi' ? 0.26 : 0.34
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(puncak, t + 0.01)
  g.gain.exponentialRampToValueAtTime(puncak * 0.55, t + Math.min(detik * 0.5, 0.35))
  g.gain.setValueAtTime(puncak * 0.55, t + detik * 0.9)
  g.gain.linearRampToValueAtTime(0.0001, t + detik * 0.98)
  osc.connect(g)
  g.connect(S.musik)
  osc.start(t)
  osc.stop(t + detik)
}

// Menjadwalkan nada sedikit ke depan agar tempo tetap rapi
function jadwalkan() {
  const ctx = S.ctx
  if (!ctx || ctx.state !== 'running') return
  const batas = ctx.currentTime + 0.35
  for (;;) {
    const e = PERISTIWA[S.indeks]
    const t = S.awalLoop + e.mulai * DETIK
    if (t > batas) break
    if (S.nyala && t >= ctx.currentTime - 0.05) mainkanNada(e, Math.max(t, ctx.currentTime))
    S.indeks += 1
    if (S.indeks >= PERISTIWA.length) {
      S.indeks = 0
      S.awalLoop += PANJANG * DETIK
    }
  }
}

function lepasBuka() {
  window.removeEventListener('pointerdown', bukaKunci)
  window.removeEventListener('keydown', bukaKunci)
  S.terpasang = false
}
// Browser mewajibkan interaksi pengguna sebelum suara boleh berbunyi
function bukaKunci() {
  S.ctx?.resume?.().catch(() => {})
  if (S.ctx?.state === 'running') lepasBuka()
}
function pasangBuka() {
  if (S.terpasang) return
  S.terpasang = true
  window.addEventListener('pointerdown', bukaKunci)
  window.addEventListener('keydown', bukaKunci)
}

function saatTabBerubah() {
  const ctx = S.ctx
  if (!ctx || !S.berjalan) return
  if (document.visibilityState === 'hidden') ctx.suspend?.()
  else ctx.resume?.().catch(() => {})
}

function mulaiMusik() {
  const ctx = pastikanCtx()
  if (!ctx || S.berjalan) return
  S.berjalan = true
  S.indeks = 0
  S.awalLoop = ctx.currentTime + 0.15
  S.musik.gain.cancelScheduledValues(ctx.currentTime)
  S.musik.gain.setValueAtTime(0.6, ctx.currentTime)
  S.timer = setInterval(jadwalkan, 60)
  if (!S.pantauTab) {
    S.pantauTab = true
    document.addEventListener('visibilitychange', saatTabBerubah)
  }
  pasangBuka()
  ctx.resume?.().catch(() => {})
}

function hentikanMusik() {
  S.berjalan = false
  clearInterval(S.timer)
  S.timer = null
  if (S.musik) {
    S.musik.gain.cancelScheduledValues(S.ctx.currentTime)
    S.musik.gain.setTargetAtTime(0, S.ctx.currentTime, 0.05) // senyapkan nada yang sudah terjadwal
  }
}

function setNyala(nilai) {
  S.nyala = Boolean(nilai)
  simpan(KUNCI_NYALA, S.nyala ? '1' : '0')
  if (S.nyala) {
    pastikanCtx()
    S.ctx?.resume?.().catch(() => {})
  }
  if (S.master) S.master.gain.setTargetAtTime(S.nyala ? S.volume : 0, S.ctx.currentTime, 0.02)
  umumkan()
}

function setVolume(nilai) {
  S.volume = Math.min(1, Math.max(0, Number(nilai) || 0))
  simpan(KUNCI_VOLUME, String(S.volume))
  if (S.master && S.nyala) S.master.gain.setTargetAtTime(S.volume, S.ctx.currentTime, 0.02)
  umumkan()
}

// ---------- Efek suara ----------
function bunyi({ tipe = 'square', dari, ke = dari, mulai = 0, dur = 0.1, vol = 0.25 }) {
  const ctx = S.ctx
  const t = ctx.currentTime + mulai
  const osc = ctx.createOscillator()
  osc.type = tipe
  osc.frequency.setValueAtTime(dari, t)
  if (ke !== dari) osc.frequency.exponentialRampToValueAtTime(ke, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(S.sfxBus)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function desis({ dur = 0.08, vol = 0.2, tapis = 2500, mulai = 0 }) {
  const ctx = S.ctx
  const t = ctx.currentTime + mulai
  const sumber = ctx.createBufferSource()
  sumber.buffer = S.derau
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = tapis
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  sumber.connect(f)
  f.connect(g)
  g.connect(S.sfxBus)
  sumber.start(t)
  sumber.stop(t + dur + 0.02)
}

const urut = (nada, opsi) => nada.forEach((f, i) => bunyi({ dari: f, mulai: i * (opsi.jarak ?? 0.07), ...opsi }))

const EFEK = {
  tebas: () => {
    desis({ dur: 0.07, vol: 0.18, tapis: 3500 })
    bunyi({ dari: 900, ke: 300, dur: 0.07, vol: 0.14 })
  },
  sihir: () => {
    bunyi({ tipe: 'triangle', dari: 400, ke: 1300, dur: 0.15, vol: 0.28 })
    bunyi({ dari: 800, ke: 1800, mulai: 0.04, dur: 0.1, vol: 0.1 })
  },
  pukul: () => {
    desis({ dur: 0.05, vol: 0.22 })
    bunyi({ dari: 220, ke: 120, dur: 0.06, vol: 0.22 })
  },
  kena: () => {
    bunyi({ dari: 330, ke: 70, dur: 0.18, vol: 0.28 })
    desis({ dur: 0.1, vol: 0.16, tapis: 1500 })
  },
  bunuh: () => urut([523, 659, 784], { jarak: 0.06, dur: 0.08, vol: 0.2 }),
  koin: () => {
    bunyi({ dari: 988, dur: 0.07, vol: 0.2 })
    bunyi({ dari: 1319, mulai: 0.07, dur: 0.22, vol: 0.2 })
  },
  beli: () => bunyi({ dari: 700, dur: 0.04, vol: 0.16 }),
  levelup: () => urut([523, 659, 784, 1047], { jarak: 0.09, dur: 0.14, vol: 0.22 }),
  ambil: () => bunyi({ dari: 660, ke: 880, dur: 0.1, vol: 0.18 }),
  gugur: () => urut([392, 330, 262, 196], { jarak: 0.16, tipe: 'triangle', dur: 0.18, vol: 0.3 }),
  klik: () => bunyi({ dari: 760, dur: 0.03, vol: 0.14 }),
}

function sfx(nama) {
  if (!S.nyala) return
  const ctx = pastikanCtx()
  if (!ctx || ctx.state !== 'running') return
  const sekarang = performance.now()
  if (sekarang - (S.terakhir[nama] ?? 0) < 45) return
  S.terakhir[nama] = sekarang
  EFEK[nama]?.()
}

export const suara = {
  mulaiMusik,
  hentikanMusik,
  setNyala,
  setVolume,
  sfx,
  berlangganan: (fungsi) => {
    S.pendengar.add(fungsi)
    return () => {
      S.pendengar.delete(fungsi)
    }
  },
  cuplikan: () => S.cuplikan,
}