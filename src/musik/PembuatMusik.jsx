import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  BATAS, STEP_PER_BEAT, STEP_PER_BIRAMA, adalahDrum, durasiDetik, formatWaktu, laguContoh, laguKosong,
} from './data'
import {
  gantiInstrumen, gandakanNot, hapusNot, hapusTrek, rencanaGeser, setBirama, setBpm, setNama, tambahTrek, ubahNot, ubahTrek,
} from './edit'
import { bacaJSON, eksporJSON, eksporMidi, encodeWAV } from './ekspor'
import { MAKS_JSON_BYTE } from './konstanta'
import { INSTRUMEN } from './instrumen'
import { Pemutar, renderLagu } from './mesin'
import { keadaanAwal, pereduksi } from './riwayat'
import GulunganNada, { KB_W } from './GulunganNada'
import './musik.css'

const KUNCI = 'musik-proyek'
const SNAP = [
  { label: '1/4', v: 4 },
  { label: '1/8', v: 2 },
  { label: '1/16', v: 1 },
]
// Tuts komputer sebagai piano: baris tengah = putih, baris atas = hitam
const TUTS = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14 }

function muatAwal() {
  try {
    const t = localStorage.getItem(KUNCI)
    if (t) return bacaJSON(t)
  } catch {
    // data rusak atau penyimpanan dimatikan: pakai contoh
  }
  return laguContoh()
}

const namaBerkas = (nama) => nama.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().slice(0, 40) || 'lagu'

function unduh(isi, nama, mime) {
  const url = URL.createObjectURL(new Blob([isi], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const tutupMenu = (e) => e.currentTarget.closest('details')?.removeAttribute('open')

export default function PembuatMusik() {
  const [riwayat, kirim] = useReducer(pereduksi, null, () => keadaanAwal(muatAwal()))
  const { lagu } = riwayat
  const [trekAktifId, setTrekAktifId] = useState(null)
  const [pilihan, setPilihan] = useState([])
  const [alat, setAlat] = useState('gambar')
  const [snap, setSnap] = useState(2)
  const [main, setMain] = useState(false)
  const [loop, setLoop] = useState(true)
  const [ikuti, setIkuti] = useState(true)
  const [stepW, setStepW] = useState(22)
  const [pianoAktif, setPianoAktif] = useState(false)
  const [oktaf, setOktaf] = useState(4)
  const [panjang, setPanjang] = useState(2)
  const [pesan, setPesan] = useState('')

  const trek = lagu.trek.find((t) => t.id === trekAktifId) ?? lagu.trek[0]
  const rowH = adalahDrum(trek) ? 26 : 16

  const laguRef = useRef(lagu)
  const pemutarRef = useRef(null)
  const gulirRef = useRef(null)
  const kepalaRef = useRef(null)
  const posisiRef = useRef(null)
  const ikutiRef = useRef(ikuti)
  const tombolRef = useRef(null)
  const timerPesan = useRef(null)
  const berkasRef = useRef(null)

  const ubah = useCallback((fn) => kirim({ jenis: 'ubah', fn }), [])
  const ubahLangsung = useCallback((fn) => kirim({ jenis: 'ubahLangsung', fn }), [])

  const beriPesan = useCallback((teks) => {
    setPesan(teks)
    clearTimeout(timerPesan.current)
    timerPesan.current = setTimeout(() => setPesan(''), 5000)
  }, [])

  useEffect(() => {
    laguRef.current = lagu
    ikutiRef.current = ikuti
  })

  // Pemutar dibuat sekali; konteks audio baru dibuat saat pertama kali menekan tombol main
  useEffect(() => {
    const p = new Pemutar(() => laguRef.current, { onBerhenti: () => setMain(false) })
    pemutarRef.current = p
    return () => {
      p.hancurkan()
      pemutarRef.current = null
      clearTimeout(timerPesan.current)
    }
  }, [])

  // Volume, bisu, dan solo berlaku seketika saat lagu sedang dimainkan
  useEffect(() => {
    pemutarRef.current?.perbaruiMix()
  }, [lagu])

  // Simpan otomatis
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KUNCI, eksporJSON(lagu))
      } catch {
        // penyimpanan penuh atau dimatikan
      }
    }, 600)
    return () => clearTimeout(t)
  }, [lagu])

  // Kepala pemutar digerakkan langsung lewat DOM (tanpa render ulang React)
  const gerakkanKepala = useCallback(
    (step, ikutiGulir) => {
      const k = kepalaRef.current
      if (k) k.style.transform = `translateX(${step * stepW}px)`
      if (posisiRef.current) {
        const b = Math.floor(step / STEP_PER_BIRAMA) + 1
        const e = Math.floor((step % STEP_PER_BIRAMA) / STEP_PER_BEAT) + 1
        posisiRef.current.textContent = `Birama ${b} · Ketukan ${e}`
      }
      const g = gulirRef.current
      if (ikutiGulir && g) {
        const x = KB_W + step * stepW
        if (x > g.scrollLeft + g.clientWidth - 40 || x < g.scrollLeft + KB_W) g.scrollLeft = Math.max(0, x - KB_W - 40)
      }
    },
    [stepW],
  )

  useEffect(() => {
    const p = pemutarRef.current
    if (!p) return undefined
    if (!main) {
      gerakkanKepala(p.posisiJeda, false)
      return undefined
    }
    let id = 0
    const loopAnim = () => {
      gerakkanKepala(p.langkahSekarang(), ikutiRef.current)
      id = requestAnimationFrame(loopAnim)
    }
    loopAnim()
    return () => cancelAnimationFrame(id)
  }, [main, gerakkanKepala, lagu.birama])

  async function mainJeda() {
    const p = pemutarRef.current
    if (!p) return
    if (main) {
      p.jeda()
      return
    }
    p.setLoop(loop)
    setMain(true)
    try {
      await p.mulai(p.posisiJeda)
    } catch {
      setMain(false)
      beriPesan('Audio tidak bisa dimulai di peramban ini.')
    }
  }

  function berhenti() {
    const p = pemutarRef.current
    p?.berhenti()
    gerakkanKepala(0, true)
    if (gulirRef.current) gulirRef.current.scrollLeft = 0
  }

  function cari(step) {
    const p = pemutarRef.current
    if (!p) return
    if (main) p.mulai(step)
    else {
      p.posisiJeda = step
      gerakkanKepala(step, false)
    }
  }

  function ubahLoop() {
    pemutarRef.current?.setLoop(!loop)
    setLoop(!loop)
  }

  function bunyikan(t, n) {
    pemutarRef.current?.bunyikan(t, n)
  }

  function ganti(lagu) {
    pemutarRef.current?.berhenti()
    kirim({ jenis: 'ganti', lagu })
    setTrekAktifId(null)
    setPilihan([])
  }

  function hapusTerpilih() {
    if (pilihan.length === 0) return
    ubah((l) => hapusNot(l, trek.id, new Set(pilihan)))
    setPilihan([])
  }

  // Pintasan keyboard. Disimpan di ref agar pendengar jendela selalu memakai keadaan terbaru.
  useEffect(() => {
    tombolRef.current = (e) => {
      const tag = e.target?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target?.isContentEditable) return
      const ctrl = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (e.code === 'Space') {
        e.preventDefault()
        mainJeda()
      } else if (ctrl && k === 'z') {
        e.preventDefault()
        kirim({ jenis: e.shiftKey ? 'ulangi' : 'urungkan' })
      } else if (ctrl && k === 'y') {
        e.preventDefault()
        kirim({ jenis: 'ulangi' })
      } else if (ctrl && k === 'a') {
        e.preventDefault()
        setPilihan(trek.not.map((x) => x.id))
      } else if (ctrl && k === 'd') {
        e.preventDefault()
        if (pilihan.length) {
          const hasil = gandakanNot(lagu, trek.id, new Set(pilihan))
          ubah(() => hasil.lagu)
          setPilihan(hasil.idBaru)
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        hapusTerpilih()
      } else if (e.key.startsWith('Arrow') && pilihan.length) {
        e.preventDefault()
        const lompat = e.shiftKey
        const dt = e.key === 'ArrowLeft' ? -(lompat ? STEP_PER_BIRAMA : snap) : e.key === 'ArrowRight' ? (lompat ? STEP_PER_BIRAMA : snap) : 0
        const db = e.key === 'ArrowUp' ? -(lompat && !adalahDrum(trek) ? 12 : 1) : e.key === 'ArrowDown' ? (lompat && !adalahDrum(trek) ? 12 : 1) : 0
        const patches = rencanaGeser(lagu, trek, new Set(pilihan), dt, db)
        ubah((l) => ubahNot(l, trek.id, patches))
      } else if (!ctrl && pianoAktif) {
        if (e.code === 'KeyZ') setOktaf((o) => Math.max(1, o - 1))
        else if (e.code === 'KeyX') setOktaf((o) => Math.min(6, o + 1))
        else if (TUTS[e.code] !== undefined && !e.repeat) {
          e.preventDefault()
          bunyikan(trek, 12 * (oktaf + 1) + TUTS[e.code])
        }
      } else if (!ctrl) {
        if (k === 'p') setAlat('gambar')
        else if (k === 'v') setAlat('pilih')
        else if (k === 'e') setAlat('hapus')
        else if (k === 'g') setAlat('geser')
      }
    }
  })
  useEffect(() => {
    const dengar = (e) => tombolRef.current?.(e)
    window.addEventListener('keydown', dengar)
    return () => window.removeEventListener('keydown', dengar)
  }, [])

  async function eksporWav() {
    beriPesan('Merender WAV...')
    try {
      const buf = await renderLagu(lagu)
      unduh(encodeWAV(buf), `${namaBerkas(lagu.nama)}.wav`, 'audio/wav')
      beriPesan('WAV diunduh.')
    } catch (err) {
      beriPesan(`Gagal merender: ${err.message}`)
    }
  }

  async function impor(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAKS_JSON_BYTE) {
      beriPesan('Berkas terlalu besar.')
      return
    }
    try {
      const l = bacaJSON(await f.text())
      ganti(l)
      beriPesan(`Memuat "${l.nama}".`)
    } catch (err) {
      beriPesan(err.message)
    }
  }

  const total = lagu.trek.reduce((a, t) => a + t.not.length, 0)

  return (
    <section className="musik" data-main={main ? 'ya' : 'tidak'} aria-label="Pembuat musik">
      <div className="musik-bilah" role="toolbar" aria-label="Kontrol">
        <div className="musik-kelompok">
          <button type="button" className="musik-utama" onClick={mainJeda} aria-label={main ? 'Jeda (Spasi)' : 'Main (Spasi)'} title="Spasi">
            {main ? 'Jeda' : 'Main'}
          </button>
          <button type="button" onClick={berhenti} aria-label="Berhenti">
            Stop
          </button>
          <button type="button" onClick={ubahLoop} aria-pressed={loop} title="Ulang terus">
            Loop
          </button>
          <button type="button" onClick={() => setIkuti(!ikuti)} aria-pressed={ikuti} title="Layar mengikuti kepala pemutar">
            Ikuti
          </button>
        </div>
        <div className="musik-kelompok">
          <label>
            BPM
            <input
              type="number" min={BATAS.bpmMin} max={BATAS.bpmMaks} value={lagu.bpm}
              onChange={(e) => ubahLangsung((l) => setBpm(l, Number(e.target.value) || l.bpm))}
            />
          </label>
          <label>
            Birama
            <input
              type="number" min={1} max={BATAS.birama} value={lagu.birama}
              onChange={(e) => ubah((l) => setBirama(l, Number(e.target.value) || l.birama))}
            />
          </label>
          <label>
            Snap
            <select value={snap} onChange={(e) => setSnap(Number(e.target.value))}>
              {SNAP.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zoom
            <input type="range" min={10} max={48} value={stepW} onChange={(e) => setStepW(Number(e.target.value))} />
          </label>
        </div>
        <div className="musik-kelompok" role="group" aria-label="Alat">
          {[['gambar', 'Gambar (P)'], ['pilih', 'Pilih (V)'], ['hapus', 'Hapus (E)'], ['geser', 'Geser (G)']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={alat === id} onClick={() => setAlat(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="musik-kelompok">
          <button type="button" onClick={() => kirim({ jenis: 'urungkan' })} disabled={riwayat.lalu.length === 0} aria-label="Urungkan (Ctrl+Z)">
            Urungkan
          </button>
          <button type="button" onClick={() => kirim({ jenis: 'ulangi' })} disabled={riwayat.depan.length === 0} aria-label="Ulangi (Ctrl+Y)">
            Ulangi
          </button>
          <button type="button" aria-pressed={pianoAktif} onClick={() => setPianoAktif(!pianoAktif)} title="Mainkan tuts dengan keyboard komputer (A S D F ...; Z/X ganti oktaf)">
            Piano keyboard{pianoAktif ? ` (oktaf ${oktaf})` : ''}
          </button>
        </div>
        <div className="musik-kelompok">
          <details className="musik-menu">
            <summary>Proyek</summary>
            <div>
              <button type="button" onClick={(e) => { tutupMenu(e); if (window.confirm('Mulai lagu baru? Lagu yang sekarang akan hilang kecuali sudah kamu ekspor.')) ganti(laguKosong()) }}>Lagu baru</button>
              <button type="button" onClick={(e) => { tutupMenu(e); ganti(laguContoh()) }}>Muat contoh</button>
              <button type="button" onClick={(e) => { tutupMenu(e); berkasRef.current?.click() }}>Buka berkas JSON</button>
            </div>
          </details>
          <details className="musik-menu">
            <summary>Ekspor</summary>
            <div>
              <button type="button" onClick={(e) => { tutupMenu(e); eksporWav() }}>Audio (WAV)</button>
              <button type="button" onClick={(e) => { tutupMenu(e); unduh(eksporMidi(lagu), `${namaBerkas(lagu.nama)}.mid`, 'audio/midi'); beriPesan('MIDI diunduh. Bisa dibuka di FL Studio.') }}>MIDI (.mid)</button>
              <button type="button" onClick={(e) => { tutupMenu(e); unduh(eksporJSON(lagu), `${namaBerkas(lagu.nama)}.json`, 'application/json'); beriPesan('Proyek diunduh.') }}>Proyek (JSON)</button>
            </div>
          </details>
          <input ref={berkasRef} type="file" accept=".json,application/json" hidden onChange={impor} />
        </div>
      </div>

      <div className="musik-judul">
        <input
          type="text" value={lagu.nama} maxLength={60} aria-label="Judul lagu"
          onChange={(e) => ubahLangsung((l) => setNama(l, e.target.value))}
        />
      </div>

      <div className="musik-badan">
        <aside className="musik-trek" aria-label="Trek">
          <ul>
            {lagu.trek.map((t) => (
              <li key={t.id} className={t.id === trek.id ? 'aktif' : ''} style={{ '--warna': t.warna }}>
                <div className="musik-trek-atas">
                  <button type="button" className="musik-chip" onClick={() => { setTrekAktifId(t.id); setPilihan([]) }} aria-label={`Pilih trek ${t.nama}`} aria-pressed={t.id === trek.id} />
                  <input
                    type="text" value={t.nama} maxLength={30} aria-label="Nama trek"
                    onFocus={() => { setTrekAktifId(t.id); setPilihan([]) }}
                    onChange={(e) => ubahLangsung((l) => ubahTrek(l, t.id, { nama: e.target.value }))}
                  />
                  <button type="button" onClick={() => ubah((l) => hapusTrek(l, t.id))} disabled={lagu.trek.length <= 1} aria-label={`Hapus trek ${t.nama}`} title="Hapus trek">×</button>
                </div>
                <select value={t.instrumen} aria-label="Instrumen" onChange={(e) => { ubah((l) => gantiInstrumen(l, t.id, e.target.value)); setPilihan([]) }}>
                  {Object.values(INSTRUMEN).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nama}
                    </option>
                  ))}
                </select>
                <div className="musik-trek-bawah">
                  <input
                    type="range" min={0} max={1} step={0.01} value={t.volume} aria-label={`Volume ${t.nama}`}
                    onChange={(e) => ubahLangsung((l) => ubahTrek(l, t.id, { volume: Number(e.target.value) }))}
                  />
                  <button type="button" aria-pressed={t.bisu} onClick={() => ubah((l) => ubahTrek(l, t.id, { bisu: !t.bisu }))} title="Bisukan">M</button>
                  <button type="button" aria-pressed={t.solo} onClick={() => ubah((l) => ubahTrek(l, t.id, { solo: !t.solo }))} title="Solo">S</button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="musik-tambah" onClick={() => ubah((l) => tambahTrek(l, 'pulsa25'))} disabled={lagu.trek.length >= BATAS.trek}>
            + Trek
          </button>
        </aside>

        <div className="musik-area">
          <GulunganNada
            lagu={lagu} trek={trek} alat={alat} snap={snap} panjangBawaan={panjang} onPanjang={setPanjang} pilihan={pilihan}
            setPilihan={setPilihan} ubah={ubah} bunyikan={bunyikan} kepalaRef={kepalaRef} gulirRef={gulirRef}
            stepW={stepW} rowH={rowH} onCari={cari} onZoom={(d) => setStepW((z) => Math.max(10, Math.min(48, z + d)))}
          />
          <p className="musik-petunjuk">
            Klik kosong = taruh not · seret not = pindah · tepi kanan not = ubah panjang · klik kanan = hapus · Spasi = main · Ctrl+Z = urungkan · Ctrl+roda = zoom
          </p>
        </div>
      </div>

      <div className="musik-status" role="status">
        <span ref={posisiRef}>Birama 1 · Ketukan 1</span>
        <span>{total} not</span>
        <span>{lagu.birama} birama · {formatWaktu(durasiDetik(lagu))}</span>
        <span className="musik-pesan">{pesan}</span>
      </div>
    </section>
  )
}
