// Ekspor dan impor: WAV, MIDI, dan JSON.
import { MAKS_JSON_BYTE } from './konstanta'
import { STEP_PER_BEAT, validasiLagu } from './data'

// ---------- WAV ----------
export function encodeWAV(buffer) {
  const kanal = buffer.numberOfChannels
  const panjang = buffer.length
  const data = Array.from({ length: kanal }, (_, c) => buffer.getChannelData(c))
  let puncak = 0
  for (const d of data) for (let i = 0; i < panjang; i += 1) puncak = Math.max(puncak, Math.abs(d[i]))
  const skala = puncak > 0.98 ? 0.98 / puncak : 1
  const byteData = panjang * kanal * 2
  const out = new ArrayBuffer(44 + byteData)
  const v = new DataView(out)
  const tulis = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  tulis(0, 'RIFF')
  v.setUint32(4, 36 + byteData, true)
  tulis(8, 'WAVEfmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, kanal, true)
  v.setUint32(24, buffer.sampleRate, true)
  v.setUint32(28, buffer.sampleRate * kanal * 2, true)
  v.setUint16(32, kanal * 2, true)
  v.setUint16(34, 16, true)
  tulis(36, 'data')
  v.setUint32(40, byteData, true)
  let o = 44
  for (let i = 0; i < panjang; i += 1) {
    for (let c = 0; c < kanal; c += 1) {
      const x = Math.max(-1, Math.min(1, data[c][i] * skala))
      v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true)
      o += 2
    }
  }
  return new Uint8Array(out)
}

// ---------- MIDI (format 1, 96 PPQ; satu langkah = 24 tick) ----------
const PPQ = 96
const TICK_STEP = PPQ / STEP_PER_BEAT
const PROGRAM = { pulsa125: 80, pulsa25: 80, pulsa50: 80, segitiga: 38, gergaji: 81, sinus: 89, lonceng: 14, derau: 122 }

function vlq(n) {
  const b = [n & 0x7f]
  let x = n >> 7
  while (x > 0) {
    b.unshift((x & 0x7f) | 0x80)
    x >>= 7
  }
  return b
}
const teks = (s) => [...new TextEncoder().encode(s)]
function bungkusTrek(byte) {
  const n = byte.length
  return [0x4d, 0x54, 0x72, 0x6b, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255, ...byte]
}

export function eksporMidi(lagu) {
  const mikro = Math.round(60000000 / lagu.bpm)
  const trekMeta = [
    0x00, 0xff, 0x03, ...vlq(teks(lagu.nama).length), ...teks(lagu.nama),
    0x00, 0xff, 0x51, 0x03, (mikro >> 16) & 255, (mikro >> 8) & 255, mikro & 255,
    0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,
    0x00, 0xff, 0x2f, 0x00,
  ]
  const hasil = [bungkusTrek(trekMeta)]
  let kanalBerikut = 0
  for (const t of lagu.trek) {
    const drum = t.instrumen === 'drum'
    let kanal = 9
    if (!drum) {
      if (kanalBerikut === 9) kanalBerikut += 1
      kanal = kanalBerikut % 16
      kanalBerikut += 1
    }
    const ev = []
    for (const x of t.not) {
      const vel = Math.max(1, Math.min(127, Math.round(x.v * 127)))
      ev.push({ tick: x.t * TICK_STEP, urut: 1, byte: [0x90 | kanal, x.n & 127, vel] })
      ev.push({ tick: (x.t + x.d) * TICK_STEP, urut: 0, byte: [0x80 | kanal, x.n & 127, 0] })
    }
    ev.sort((a, b) => a.tick - b.tick || a.urut - b.urut)
    const byte = [0x00, 0xff, 0x03, ...vlq(teks(t.nama).length), ...teks(t.nama)]
    if (!drum) byte.push(0x00, 0xc0 | kanal, PROGRAM[t.instrumen] ?? 80)
    byte.push(0x00, 0xb0 | kanal, 7, Math.round(t.volume * 127))
    let akhir = 0
    for (const e of ev) {
      byte.push(...vlq(e.tick - akhir), ...e.byte)
      akhir = e.tick
    }
    byte.push(0x00, 0xff, 0x2f, 0x00)
    hasil.push(bungkusTrek(byte))
  }
  const kepala = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, hasil.length, 0, PPQ]
  return Uint8Array.from([...kepala, ...hasil.flat()])
}

// ---------- JSON ----------
export function eksporJSON(lagu) {
  const ringkas = {
    versi: 1, nama: lagu.nama, bpm: lagu.bpm, birama: lagu.birama,
    trek: lagu.trek.map((t) => ({
      nama: t.nama, instrumen: t.instrumen, volume: t.volume, bisu: t.bisu, solo: t.solo, warna: t.warna,
      not: t.not.map((x) => ({ t: x.t, d: x.d, n: x.n, v: Number(x.v.toFixed(2)) })),
    })),
  }
  return JSON.stringify(ringkas, null, 1)
}

export function bacaJSON(isi) {
  if (typeof isi !== 'string' || isi.length > MAKS_JSON_BYTE) throw new Error('Berkas terlalu besar atau bukan teks.')
  let m
  try {
    m = JSON.parse(isi)
  } catch {
    throw new Error('Berkas bukan JSON yang valid.')
  }
  return validasiLagu(m)
}

