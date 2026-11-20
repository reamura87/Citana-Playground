// Instrumen sintesis bergaya chiptune/pixel. Semua suara dibuat dengan kode (Web Audio), tanpa berkas audio.
// Antarmuka instrumen: main(ctx, tujuan, { n, mulai, dur, vel }). Instrumen berbasis sampel (piano, biola)
// nantinya cukup mengikuti antarmuka yang sama dan didaftarkan di INSTRUMEN.
import { frekuensi } from './data'

const cacheAset = new WeakMap()

function buatPulsa(ctx, tugas) {
  const n = 48
  const real = new Float32Array(n)
  const imag = new Float32Array(n)
  for (let k = 1; k < n; k += 1) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * tugas)
  return ctx.createPeriodicWave(real, imag)
}

// Aset bersama per konteks audio (derau dan bentuk gelombang), dibuat sekali
export function ambilAset(ctx) {
  let a = cacheAset.get(ctx)
  if (!a) {
    const derau = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)
    const d = derau.getChannelData(0)
    let seed = 12345
    for (let i = 0; i < d.length; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      d[i] = (seed / 2147483648) - 1
    }
    a = { derau, pulsa: { 0.125: buatPulsa(ctx, 0.125), 0.25: buatPulsa(ctx, 0.25), 0.5: buatPulsa(ctx, 0.5) } }
    cacheAset.set(ctx, a)
  }
  return a
}

// Amplop ADSR sederhana pada sebuah GainNode. Mengembalikan waktu berhentinya suara.
function amplop(g, t0, dur, { a, d, s, r }, puncak) {
  const awal = 0.0001
  const t1 = t0 + Math.min(a, dur)
  const akhir = t0 + dur
  const tSus = Math.min(akhir, t1 + d)
  const level = Math.max(awal, puncak * s)
  g.gain.setValueAtTime(awal, t0)
  g.gain.linearRampToValueAtTime(puncak, t1)
  if (tSus > t1) g.gain.exponentialRampToValueAtTime(level, tSus)
  if (akhir > tSus) g.gain.setValueAtTime(level, akhir)
  g.gain.setTargetAtTime(awal, akhir, r / 3)
  return akhir + r * 1.5
}

function suaraOsilator(ctx, tujuan, A, { n, mulai, dur, vel }, p) {
  const osc = ctx.createOscillator()
  if (p.pulsa) osc.setPeriodicWave(A.pulsa[p.pulsa])
  else osc.type = p.bentuk
  osc.frequency.setValueAtTime(frekuensi(n), mulai)
  const g = ctx.createGain()
  const berhenti = amplop(g, mulai, dur, p.amp, p.puncak * (0.35 + 0.65 * vel))
  osc.connect(g)
  g.connect(tujuan)
  if (p.vib) {
    const lfo = ctx.createOscillator()
    const lg = ctx.createGain()
    lfo.frequency.value = p.vib.laju
    lg.gain.setValueAtTime(0, mulai)
    lg.gain.linearRampToValueAtTime(p.vib.dalam, mulai + p.vib.tunda + 0.15)
    lfo.connect(lg)
    lg.connect(osc.detune)
    lfo.start(mulai)
    lfo.stop(berhenti)
  }
  osc.start(mulai)
  osc.stop(berhenti)
}

function lonceng(ctx, tujuan, A, { n, mulai, dur, vel }) {
  const f = frekuensi(n)
  for (const [rasio, bobot, peluruhan] of [[1, 1, 0.55], [2.76, 0.45, 0.25], [5.4, 0.2, 0.12]]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f * rasio, mulai)
    const g = ctx.createGain()
    const puncak = 0.3 * bobot * (0.35 + 0.65 * vel)
    g.gain.setValueAtTime(0.0001, mulai)
    g.gain.linearRampToValueAtTime(puncak, mulai + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, mulai + Math.max(0.12, Math.min(peluruhan + dur * 0.5, 1.4)))
    osc.connect(g)
    g.connect(tujuan)
    osc.start(mulai)
    osc.stop(mulai + 1.5)
  }
}

function derauNada(ctx, tujuan, A, { n, mulai, dur, vel }) {
  const s = ctx.createBufferSource()
  s.buffer = A.derau
  s.loop = true
  const bq = ctx.createBiquadFilter()
  bq.type = 'bandpass'
  bq.frequency.value = frekuensi(n)
  bq.Q.value = 14
  const g = ctx.createGain()
  const berhenti = amplop(g, mulai, dur, { a: 0.01, d: 0.1, s: 0.7, r: 0.08 }, 3.2 * (0.35 + 0.65 * vel))
  s.connect(bq)
  bq.connect(g)
  g.connect(tujuan)
  s.start(mulai)
  s.stop(berhenti)
}

// Drum pixel: nomor MIDI 36 kick, 38 snare, 42 hat tutup, 45 tom, 46 hat buka, 49 crash
function drum(ctx, tujuan, A, { n, mulai, vel }) {
  const v = 0.35 + 0.65 * vel
  const desis = (tipe, frek, q, puncak, dur, offset = 0) => {
    const s = ctx.createBufferSource()
    s.buffer = A.derau
    const f = ctx.createBiquadFilter()
    f.type = tipe
    f.frequency.value = frek
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(puncak * v, mulai)
    g.gain.exponentialRampToValueAtTime(0.0001, mulai + dur)
    s.connect(f)
    f.connect(g)
    g.connect(tujuan)
    s.start(mulai, offset)
    s.stop(mulai + dur + 0.02)
  }
  const nada = (tipe, dari, ke, puncak, dur) => {
    const o = ctx.createOscillator()
    o.type = tipe
    o.frequency.setValueAtTime(dari, mulai)
    o.frequency.exponentialRampToValueAtTime(ke, mulai + dur * 0.8)
    const g = ctx.createGain()
    g.gain.setValueAtTime(puncak * v, mulai)
    g.gain.exponentialRampToValueAtTime(0.0001, mulai + dur)
    o.connect(g)
    g.connect(tujuan)
    o.start(mulai)
    o.stop(mulai + dur + 0.02)
  }
  switch (n) {
    case 36:
      nada('sine', 160, 42, 1.0, 0.16)
      desis('lowpass', 900, 0.7, 0.3, 0.025)
      break
    case 38:
      desis('bandpass', 1900, 0.8, 0.7, 0.14)
      nada('triangle', 200, 140, 0.4, 0.07)
      break
    case 42:
      desis('highpass', 7500, 0.7, 0.35, 0.045)
      break
    case 46:
      desis('highpass', 7000, 0.7, 0.32, 0.22)
      break
    case 45:
      nada('sine', 170, 85, 0.85, 0.22)
      break
    case 49:
      desis('highpass', 4200, 0.6, 0.45, 0.9, 0.1)
      break
    default:
      break
  }
}

const pulsa = (id, nama, tugas, vib) => ({
  id, nama, jenis: 'melodi',
  main: (ctx, tujuan, { n, mulai, dur, vel }) =>
    suaraOsilator(ctx, tujuan, ambilAset(ctx), { n, mulai, dur, vel }, {
      pulsa: tugas, puncak: 0.2, amp: { a: 0.004, d: 0.12, s: 0.6, r: 0.06 }, vib,
    }),
})
const bentuk = (id, nama, tipe, puncak, amp, vib) => ({
  id, nama, jenis: 'melodi',
  main: (ctx, tujuan, { n, mulai, dur, vel }) =>
    suaraOsilator(ctx, tujuan, ambilAset(ctx), { n, mulai, dur, vel }, { bentuk: tipe, puncak, amp, vib }),
})

export const INSTRUMEN = {
  pulsa125: pulsa('pulsa125', 'Pulsa 12,5%', 0.125),
  pulsa25: pulsa('pulsa25', 'Pulsa 25%', 0.25, { dalam: 8, laju: 5.5, tunda: 0.12 }),
  pulsa50: pulsa('pulsa50', 'Kotak 50%', 0.5),
  segitiga: bentuk('segitiga', 'Segitiga (bas)', 'triangle', 0.55, { a: 0.003, d: 0.05, s: 0.9, r: 0.04 }),
  gergaji: bentuk('gergaji', 'Gergaji (lead)', 'sawtooth', 0.17, { a: 0.01, d: 0.15, s: 0.5, r: 0.08 }, { dalam: 10, laju: 5, tunda: 0.15 }),
  sinus: bentuk('sinus', 'Sinus lembut', 'sine', 0.45, { a: 0.02, d: 0.2, s: 0.7, r: 0.15 }),
  lonceng: { id: 'lonceng', nama: 'Lonceng pixel', jenis: 'melodi', main: (ctx, tujuan, o) => lonceng(ctx, tujuan, ambilAset(ctx), o) },
  derau: { id: 'derau', nama: 'Derau bernada', jenis: 'melodi', main: (ctx, tujuan, o) => derauNada(ctx, tujuan, ambilAset(ctx), o) },
  drum: { id: 'drum', nama: 'Drum pixel', jenis: 'drum', main: (ctx, tujuan, o) => drum(ctx, tujuan, ambilAset(ctx), o) },
}
