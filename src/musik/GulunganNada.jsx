import { useEffect, useMemo, useRef } from 'react'
import {
  NAMA_DRUM, STEP_PER_BEAT, STEP_PER_BIRAMA, adalahDrum, adalahHitam, barisTrek, idBaru, namaNot, totalStep,
} from './data'
import { hapusNot, rencanaGeser, tambahNot, ubahNot } from './edit'

export const KB_W = 68
export const RULER_H = 24

function sesuaikanKanvas(kanvas, w, h) {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 16000 / Math.max(w, h)))
  const lebar = Math.round(w * dpr)
  const tinggi = Math.round(h * dpr)
  if (kanvas.width !== lebar) kanvas.width = lebar
  if (kanvas.height !== tinggi) kanvas.height = tinggi
  kanvas.style.width = `${w}px`
  kanvas.style.height = `${h}px`
  const c = kanvas.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  return c
}

function ambilWarna(el) {
  const s = getComputedStyle(el)
  const v = (nama, d) => s.getPropertyValue(nama).trim() || d
  return { bg: v('--bg', '#ffffff'), fg: v('--fg', '#111111'), line: v('--line', '#cccccc'), field: v('--field', '#f4f4f4'), muted: v('--muted', '#777777') }
}

// Piano roll berbasis kanvas: menaruh, memindah, mengubah panjang, memilih, dan menghapus not.
export default function GulunganNada({
  lagu, trek, alat, snap, panjangBawaan, onPanjang, pilihan, setPilihan, ubah, bunyikan, kepalaRef, gulirRef,
  stepW, rowH, onCari, onZoom,
}) {
  const gridRef = useRef(null)
  const tutsRef = useRef(null)
  const penggarisRef = useRef(null)
  const seretanRef = useRef(null)
  const gambarUlangRef = useRef(null)
  const baris = useMemo(() => barisTrek(trek), [trek])
  const peta = useMemo(() => new Map(baris.map((n, i) => [n, i])), [baris])
  const S = totalStep(lagu)
  const lebarGrid = S * stepW
  const tinggiGrid = baris.length * rowH
  const drum = adalahDrum(trek)

  // Menggambar ulang semua kanvas. Dipanggil setelah render dan saat menyeret (tanpa render ulang React).
  useEffect(() => {
    function gambar() {
      if (!gridRef.current || !gulirRef.current) return
      const w = ambilWarna(gulirRef.current)
      const sd = seretanRef.current
      const terpilih = new Set(pilihan)

      // --- grid ---
      const c = sesuaikanKanvas(gridRef.current, lebarGrid, tinggiGrid)
      c.fillStyle = w.bg
      c.fillRect(0, 0, lebarGrid, tinggiGrid)
      baris.forEach((n, i) => {
        const y = i * rowH
        if (drum ? i % 2 === 1 : adalahHitam(n)) {
          c.globalAlpha = 0.07
          c.fillStyle = w.fg
          c.fillRect(0, y, lebarGrid, rowH)
        }
        c.globalAlpha = !drum && n % 12 === 0 ? 0.9 : 0.35
        c.fillStyle = w.line
        c.fillRect(0, y + rowH - 1, lebarGrid, 1)
      })
      for (let s = 0; s <= S; s += 1) {
        let a = 0.07
        if (s % STEP_PER_BIRAMA === 0) a = 0.75
        else if (s % STEP_PER_BEAT === 0) a = 0.38
        else if (s % 2 === 0) a = 0.16
        c.globalAlpha = a
        c.fillStyle = w.line
        c.fillRect(s * stepW, 0, 1, tinggiGrid)
      }
      c.globalAlpha = 1

      // not trek lain sebagai bayangan
      for (const t of lagu.trek) {
        if (t.id === trek.id || adalahDrum(t) !== drum) continue
        c.fillStyle = t.warna
        c.globalAlpha = 0.22
        for (const x of t.not) {
          const r = peta.get(x.n)
          if (r !== undefined) c.fillRect(x.t * stepW + 1, r * rowH + 3, x.d * stepW - 2, rowH - 6)
        }
      }
      c.globalAlpha = 1

      // not trek aktif (dengan pratinjau seretan)
      let catatan = trek.not
      if (sd && (sd.jenis === 'pindah' || sd.jenis === 'resize')) catatan = trek.not.map((x) => (sd.patches[x.id] ? { ...x, ...sd.patches[x.id] } : x))
      if (sd?.jenis === 'buat') catatan = [...trek.not, { id: '_baru', t: sd.t, d: sd.d, n: sd.n, v: 0.85 }]
      for (const x of catatan) {
        const r = peta.get(x.n)
        if (r === undefined) continue
        const px = x.t * stepW + 1
        const py = r * rowH + 1
        const pw = Math.max(3, x.d * stepW - 2)
        const ph = rowH - 2
        const hapus = sd?.jenis === 'hapus' && sd.ids.has(x.id)
        c.globalAlpha = hapus ? 0.25 : 0.5 + 0.5 * x.v
        c.fillStyle = hapus ? '#ff4444' : trek.warna
        c.fillRect(px, py, pw, ph)
        c.globalAlpha = 0.28
        c.fillStyle = '#000'
        c.fillRect(px + pw - Math.min(5, pw / 2), py, Math.min(5, pw / 2), ph)
        c.globalAlpha = 1
        c.lineWidth = terpilih.has(x.id) || sd?.jenis === 'kotak' && sd.ids.has(x.id) ? 2 : 1
        c.strokeStyle = c.lineWidth === 2 ? w.fg : 'rgba(0,0,0,0.55)'
        c.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1)
      }
      if (sd?.jenis === 'kotak') {
        const x0 = Math.min(sd.x0, sd.x1)
        const y0 = Math.min(sd.y0, sd.y1)
        c.fillStyle = w.fg
        c.globalAlpha = 0.12
        c.fillRect(x0, y0, Math.abs(sd.x1 - sd.x0), Math.abs(sd.y1 - sd.y0))
        c.globalAlpha = 1
        c.strokeStyle = w.fg
        c.setLineDash([4, 3])
        c.strokeRect(x0 + 0.5, y0 + 0.5, Math.abs(sd.x1 - sd.x0), Math.abs(sd.y1 - sd.y0))
        c.setLineDash([])
      }

      // --- tuts piano ---
      const k = sesuaikanKanvas(tutsRef.current, KB_W, tinggiGrid)
      k.fillStyle = w.field
      k.fillRect(0, 0, KB_W, tinggiGrid)
      k.font = '10px ui-monospace, monospace'
      k.textBaseline = 'middle'
      baris.forEach((n, i) => {
        const y = i * rowH
        if (drum) {
          k.fillStyle = w.fg
          k.fillText(NAMA_DRUM[n] ?? n, 6, y + rowH / 2)
          k.fillStyle = w.line
          k.fillRect(0, y + rowH - 1, KB_W, 1)
        } else if (adalahHitam(n)) {
          k.fillStyle = '#22242a'
          k.fillRect(0, y, KB_W * 0.62, rowH - 1)
          k.fillStyle = '#e9e9ee'
          k.fillRect(KB_W * 0.62, y, KB_W * 0.38, rowH - 1)
        } else {
          k.fillStyle = '#f6f6fa'
          k.fillRect(0, y, KB_W, rowH - 1)
          k.fillStyle = '#c9c9d2'
          k.fillRect(0, y + rowH - 1, KB_W, 1)
          if (n % 12 === 0) {
            k.fillStyle = '#444'
            k.textAlign = 'right'
            k.fillText(namaNot(n), KB_W - 5, y + rowH / 2)
            k.textAlign = 'left'
          }
        }
      })

      // --- penggaris birama ---
      const p = sesuaikanKanvas(penggarisRef.current, lebarGrid, RULER_H)
      p.fillStyle = w.field
      p.fillRect(0, 0, lebarGrid, RULER_H)
      p.font = '11px ui-monospace, monospace'
      p.textBaseline = 'middle'
      for (let s = 0; s <= S; s += STEP_PER_BEAT) {
        const x = s * stepW
        const birama = s % STEP_PER_BIRAMA === 0
        p.fillStyle = w.line
        p.fillRect(x, birama ? 0 : RULER_H - 7, 1, birama ? RULER_H : 7)
        if (birama && s < S) {
          p.fillStyle = w.fg
          p.fillText(String(s / STEP_PER_BIRAMA + 1), x + 5, RULER_H / 2)
        }
      }
      p.fillStyle = w.line
      p.fillRect(0, RULER_H - 1, lebarGrid, 1)
    }
    gambarUlangRef.current = gambar
    gambar()
  })

  // Tema (terang/gelap) berganti: gambar ulang warna kanvas
  useEffect(() => {
    const mo = new MutationObserver(() => gambarUlangRef.current?.())
    mo.observe(document.documentElement, { attributes: true })
    return () => mo.disconnect()
  }, [])

  // Ctrl + roda = zoom horizontal
  useEffect(() => {
    const el = gulirRef.current
    if (!el) return
    const roda = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      onZoom(e.deltaY < 0 ? 2 : -2)
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [gulirRef, onZoom])

  // Gulir ke wilayah not saat trek berganti
  useEffect(() => {
    const el = gulirRef.current
    if (!el) return
    const nada = trek.not.length ? trek.not.map((x) => x.n).sort((a, b) => a - b)[Math.floor(trek.not.length / 2)] : drum ? baris[0] : 64
    const r = peta.get(nada) ?? 0
    el.scrollTop = Math.max(0, r * rowH - el.clientHeight / 2 + RULER_H)
    // hanya saat trek (atau jenisnya) berganti
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trek.id, drum])

  function posisi(e) {
    const r = gridRef.current.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    return { x, y, step: x / stepW, baris: Math.floor(y / rowH) }
  }

  function cariNot(p) {
    for (let i = trek.not.length - 1; i >= 0; i -= 1) {
      const x = trek.not[i]
      const nx = x.t * stepW
      if (peta.get(x.n) === p.baris && p.x >= nx && p.x <= nx + x.d * stepW) {
        const tepi = p.x > nx + x.d * stepW - Math.min(7, (x.d * stepW) * 0.4)
        return { not: x, tepi }
      }
    }
    return null
  }

  function saatTurun(e) {
    if (alat === 'geser' || (e.button !== 0 && e.button !== 2)) return
    const p = posisi(e)
    if (p.baris < 0 || p.baris >= baris.length) return
    const kena = cariNot(p)
    if (e.button === 2) {
      if (kena) ubah((l) => hapusNot(l, trek.id, new Set([kena.not.id])))
      return
    }
    gridRef.current.setPointerCapture?.(e.pointerId)
    const n = baris[p.baris]
    if (alat === 'hapus') {
      seretanRef.current = { jenis: 'hapus', ids: new Set(kena ? [kena.not.id] : []) }
    } else if (kena) {
      const id = kena.not.id
      if (e.shiftKey) {
        setPilihan(pilihan.includes(id) ? pilihan.filter((x) => x !== id) : [...pilihan, id])
        seretanRef.current = null
      } else {
        const ids = pilihan.includes(id) ? pilihan : [id]
        if (!pilihan.includes(id)) setPilihan([id])
        bunyikan(trek, kena.not.n)
        seretanRef.current = {
          jenis: kena.tepi ? 'resize' : 'pindah', ids: new Set(ids), step0: p.step, baris0: p.baris, patches: {},
          acuan: kena.not, nadaTerakhir: kena.not.n,
        }
      }
    } else if (alat === 'gambar') {
      const t = Math.floor(p.step / snap) * snap
      const d = Math.max(snap, Math.min(panjangBawaan, S - t))
      bunyikan(trek, n)
      seretanRef.current = { jenis: 'buat', t, d, n, t0: t }
    } else {
      if (!e.shiftKey) setPilihan([])
      seretanRef.current = { jenis: 'kotak', x0: p.x, y0: p.y, x1: p.x, y1: p.y, ids: new Set(e.shiftKey ? pilihan : []), awal: e.shiftKey ? pilihan : [] }
    }
    gambarUlangRef.current?.()
  }

  function saatGerak(e) {
    const sd = seretanRef.current
    const p = posisi(e)
    if (!sd) {
      if (alat === 'geser') return
      const kena = cariNot(p)
      gridRef.current.style.cursor = kena ? (kena.tepi ? 'ew-resize' : 'grab') : alat === 'gambar' ? 'crosshair' : alat === 'hapus' ? 'not-allowed' : 'default'
      return
    }
    if (sd.jenis === 'buat') {
      const akhir = Math.max(sd.t + snap, Math.ceil(p.step / snap) * snap)
      sd.d = Math.min(akhir - sd.t, S - sd.t)
    } else if (sd.jenis === 'pindah') {
      const dt = Math.round((p.step - sd.step0) / snap) * snap
      sd.patches = rencanaGeser(lagu, trek, sd.ids, dt, p.baris - sd.baris0)
      const baru = sd.patches[sd.acuan.id]?.n
      if (baru !== undefined && baru !== sd.nadaTerakhir) {
        sd.nadaTerakhir = baru
        bunyikan(trek, baru)
      }
    } else if (sd.jenis === 'resize') {
      const delta = Math.round((p.step - (sd.acuan.t + sd.acuan.d)) / snap) * snap
      sd.patches = {}
      for (const x of trek.not) {
        if (sd.ids.has(x.id)) sd.patches[x.id] = { d: Math.max(1, Math.min(x.d + delta, S - x.t)) }
      }
    } else if (sd.jenis === 'kotak') {
      sd.x1 = p.x
      sd.y1 = p.y
      const x0 = Math.min(sd.x0, sd.x1)
      const x1 = Math.max(sd.x0, sd.x1)
      const y0 = Math.min(sd.y0, sd.y1)
      const y1 = Math.max(sd.y0, sd.y1)
      const ids = new Set(sd.awal)
      for (const x of trek.not) {
        const r = peta.get(x.n)
        if (r === undefined) continue
        if (x.t * stepW < x1 && (x.t + x.d) * stepW > x0 && r * rowH < y1 && (r + 1) * rowH > y0) ids.add(x.id)
      }
      sd.ids = ids
    } else if (sd.jenis === 'hapus') {
      const kena = cariNot(p)
      if (kena) sd.ids.add(kena.not.id)
    }
    gambarUlangRef.current?.()
  }

  function saatNaik() {
    const sd = seretanRef.current
    seretanRef.current = null
    if (!sd) return
    if (sd.jenis === 'buat') {
      const id = idBaru('n')
      onPanjang(sd.d)
      ubah((l) => tambahNot(l, trek.id, { id, t: sd.t, d: sd.d, n: sd.n, v: 0.85 }))
      setPilihan([id])
    } else if ((sd.jenis === 'pindah' || sd.jenis === 'resize') && Object.keys(sd.patches).length > 0) {
      ubah((l) => ubahNot(l, trek.id, sd.patches))
    } else if (sd.jenis === 'kotak') {
      setPilihan([...sd.ids])
    } else if (sd.jenis === 'hapus' && sd.ids.size > 0) {
      ubah((l) => hapusNot(l, trek.id, sd.ids))
      setPilihan(pilihan.filter((x) => !sd.ids.has(x)))
    }
    gambarUlangRef.current?.()
  }

  return (
    <div className="musik-roll" ref={gulirRef} tabIndex={0} aria-label="Piano roll. Klik untuk menaruh not, seret untuk memindah, klik kanan untuk menghapus.">
      <div className="musik-roll-dalam" style={{ gridTemplateColumns: `${KB_W}px ${lebarGrid}px`, gridTemplateRows: `${RULER_H}px ${tinggiGrid}px` }}>
        <div className="musik-roll-sudut" />
        <canvas
          ref={penggarisRef}
          className="musik-roll-penggaris"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            onCari(Math.max(0, Math.min(S - 1, Math.floor((e.clientX - r.left) / stepW))))
          }}
        />
        <canvas
          ref={tutsRef}
          className="musik-roll-tuts"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const i = Math.floor((e.clientY - r.top) / rowH)
            if (i >= 0 && i < baris.length) bunyikan(trek, baris[i])
          }}
        />
        <canvas
          ref={gridRef}
          className={`musik-roll-grid${alat === 'geser' ? ' geser' : ''}`}
          onPointerDown={saatTurun}
          onPointerMove={saatGerak}
          onPointerUp={saatNaik}
          onPointerCancel={() => {
            seretanRef.current = null
            gambarUlangRef.current?.()
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div ref={kepalaRef} className="musik-roll-kepala" style={{ left: KB_W, top: RULER_H, height: tinggiGrid }} />
      </div>
    </div>
  )
}
