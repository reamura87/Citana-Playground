// Mesin pemutar: mixer, penjadwal not berbasis jam audio, dan render offline.
import { STEP_PER_BEAT, totalStep } from './data'
import { INSTRUMEN } from './instrumen'

export const detikPerStep = (bpm) => 60 / bpm / STEP_PER_BEAT

// Apakah trek terdengar (memperhitungkan bisu dan solo)
export function terdengar(lagu, trek) {
  const adaSolo = lagu.trek.some((t) => t.solo)
  return adaSolo ? trek.solo : !trek.bisu
}
export const gainTrek = (lagu, trek) => (terdengar(lagu, trek) ? trek.volume * 0.7 : 0)

// Graf: tiap trek -> master -> pembatas -> keluaran
export function buatGraf(ctx, tujuan = ctx.destination) {
  const master = ctx.createGain()
  master.gain.value = 0.8
  const pembatas = ctx.createDynamicsCompressor?.()
  if (pembatas) {
    pembatas.threshold.value = -10
    pembatas.ratio.value = 12
    pembatas.attack.value = 0.003
    pembatas.release.value = 0.15
    master.connect(pembatas)
    pembatas.connect(tujuan)
  } else {
    master.connect(tujuan)
  }
  return { ctx, master, trek: new Map() }
}

export function gainUntuk(graf, trekId) {
  let g = graf.trek.get(trekId)
  if (!g) {
    g = graf.ctx.createGain()
    g.connect(graf.master)
    graf.trek.set(trekId, g)
  }
  return g
}

// langsung = true: atur nilai seketika (untuk render offline); false: peralihan halus (saat bermain)
export function terapkanMix(graf, lagu, langsung = false) {
  for (const t of lagu.trek) {
    const g = gainUntuk(graf, t.id)
    const nilai = gainTrek(lagu, t)
    if (langsung) g.gain.value = nilai
    else g.gain.setTargetAtTime(nilai, graf.ctx.currentTime, 0.01)
  }
}

export function mainkanNot(graf, trek, not, waktu, detik) {
  const ins = INSTRUMEN[trek.instrumen]
  if (!ins) return
  ins.main(graf.ctx, gainUntuk(graf, trek.id), { n: not.n, mulai: waktu, dur: Math.max(0.03, detik), vel: not.v })
}

// Indeks not per langkah (di-cache per objek lagu; lagu bersifat tidak berubah-ubah)
const cacheIndeks = new WeakMap()
export function indeksNot(lagu) {
  let x = cacheIndeks.get(lagu)
  if (!x) {
    const S = totalStep(lagu)
    x = Array.from({ length: S }, () => [])
    for (const trek of lagu.trek) for (const not of trek.not) if (not.t >= 0 && not.t < S) x[not.t].push({ trek, not })
    cacheIndeks.set(lagu, x)
  }
  return x
}

// Merender seluruh lagu ke AudioBuffer (dipakai untuk ekspor WAV)
export async function renderLagu(lagu, { sampleRate = 44100, ekor = 1.5, Offline = globalThis.OfflineAudioContext } = {}) {
  const sd = detikPerStep(lagu.bpm)
  const S = totalStep(lagu)
  const ctx = new Offline(2, Math.ceil((S * sd + ekor) * sampleRate), sampleRate)
  const graf = buatGraf(ctx)
  terapkanMix(graf, lagu, true)
  const idx = indeksNot(lagu)
  for (let s = 0; s < S; s += 1) for (const { trek, not } of idx[s]) mainkanNot(graf, trek, not, s * sd, not.d * sd)
  return ctx.startRendering()
}

const LOOKAHEAD = 0.12
const INTERVAL = 25

export class Pemutar {
  constructor(ambilLagu, { onBerhenti } = {}) {
    this.ambilLagu = ambilLagu
    this.onBerhenti = onBerhenti
    this.ctx = null
    this.pratinjau = null
    this.graf = null
    this.timer = null
    this.main = false
    this.loop = true
    this.ref = { waktu: 0, step: 0 }
    this.kSched = 0
    this.bpmDipakai = 0
    this.posisiJeda = 0
  }

  pastikanCtx() {
    if (!this.ctx) {
      const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext
      this.ctx = new Ctor({ latencyHint: 'interactive' })
      this.pratinjau = buatGraf(this.ctx)
    }
    return this.ctx
  }

  // Posisi dalam langkah virtual (terus bertambah, tidak melilit saat loop)
  vSekarang() {
    const lagu = this.ambilLagu()
    const sd = detikPerStep(lagu.bpm)
    const lat = this.ctx.outputLatency || this.ctx.baseLatency || 0
    return this.ref.step + (this.ctx.currentTime - lat - this.ref.waktu) / sd
  }

  // Posisi kepala pemutar dalam langkah lagu (0 sampai total langkah)
  langkahSekarang() {
    if (!this.main) return this.posisiJeda
    const S = totalStep(this.ambilLagu())
    const v = Math.max(this.vSekarang(), this.ref.step)
    return this.loop ? ((v % S) + S) % S : Math.min(v, S)
  }

  async mulai(dariStep = 0) {
    const ctx = this.pastikanCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    this.hentikanJalur()
    const lagu = this.ambilLagu()
    const S = totalStep(lagu)
    const dari = dariStep >= S || dariStep < 0 ? 0 : Math.floor(dariStep)
    this.graf = buatGraf(ctx)
    terapkanMix(this.graf, lagu, true)
    this.ref = { waktu: ctx.currentTime + 0.06, step: dari }
    this.kSched = dari
    this.bpmDipakai = lagu.bpm
    this.main = true
    this.timer = setInterval(() => this.tick(), INTERVAL)
    this.tick()
  }

  tick() {
    if (!this.main) return
    const lagu = this.ambilLagu()
    const ctx = this.ctx
    const now = ctx.currentTime
    if (lagu.bpm !== this.bpmDipakai) {
      this.ref = { waktu: now, step: this.ref.step + (now - this.ref.waktu) / detikPerStep(this.bpmDipakai) }
      this.bpmDipakai = lagu.bpm
    }
    const sd = detikPerStep(lagu.bpm)
    const S = totalStep(lagu)
    const idx = indeksNot(lagu)
    const vAkhir = this.ref.step + (now + LOOKAHEAD - this.ref.waktu) / sd
    while (this.kSched < vAkhir) {
      const k = this.kSched
      if (!this.loop && k >= S) break
      const s = this.loop ? k % S : k
      const w = this.ref.waktu + (k - this.ref.step) * sd
      if (w >= now - 0.02) {
        for (const { trek, not } of idx[s]) mainkanNot(this.graf, trek, not, Math.max(w, now), not.d * sd)
      }
      this.kSched += 1
    }
    if (!this.loop && this.ref.step + (now - this.ref.waktu) / sd >= S + 2 * STEP_PER_BEAT) this.berhenti()
  }

  hentikanJalur() {
    clearInterval(this.timer)
    this.timer = null
    const graf = this.graf
    this.graf = null
    if (graf) {
      graf.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015)
      setTimeout(() => graf.master.disconnect(), 200)
    }
  }

  jeda() {
    if (!this.main) return
    this.posisiJeda = Math.floor(this.langkahSekarang())
    this.main = false
    this.hentikanJalur()
    this.onBerhenti?.()
  }

  berhenti() {
    const adaJalan = this.main
    this.main = false
    this.posisiJeda = 0
    this.hentikanJalur()
    if (adaJalan) this.onBerhenti?.()
  }

  setLoop(nilai) {
    this.loop = Boolean(nilai)
  }

  perbaruiMix() {
    if (this.graf) terapkanMix(this.graf, this.ambilLagu())
  }

  // Memperdengarkan satu not seketika (saat menaruh not atau menekan tuts)
  bunyikan(trek, n, vel = 0.85, dur = 0.3) {
    const ctx = this.pastikanCtx()
    if (ctx.state === 'suspended') ctx.resume()
    gainUntuk(this.pratinjau, trek.id).gain.value = trek.volume * 0.7
    mainkanNot(this.pratinjau, trek, { n, v: vel }, ctx.currentTime + 0.005, dur)
  }

  hancurkan() {
    this.berhenti()
    this.ctx?.close?.()
    this.ctx = null
  }
}
