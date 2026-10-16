import { useEffect, useRef, useState } from 'react'

const LEBAR = 1200
const TINGGI = 800
const BATAS_URUNGKAN = 10
const TOLERANSI_ISI = 48

const ALAT = [
  ['pena', 'Pena'],
  ['penghapus', 'Penghapus'],
  ['isi', 'Isi'],
  ['garis', 'Garis'],
  ['persegi', 'Persegi'],
  ['elips', 'Elips'],
  ['segitiga', 'Segitiga'],
]
const ADA_ISI = ['persegi', 'elips', 'segitiga']

const ambilCtx = (kanvas) => kanvas.getContext('2d', { willReadFrequently: true })
const hexKeRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

function buatJalur(c, jalur) {
  c.beginPath()
  c.moveTo(jalur[0].x, jalur[0].y)
  for (const t of jalur.slice(1)) c.lineTo(t.x, t.y)
  if (jalur.length === 1) c.lineTo(jalur[0].x + 0.01, jalur[0].y)
}

// Isi area yang warnanya mirip dengan titik yang diklik
function isiArea(ctx, x, y, hex, opasitas) {
  const gambar = ctx.getImageData(0, 0, LEBAR, TINGGI)
  const d = gambar.data
  const awal = y * LEBAR + x
  const r0 = d[awal * 4]
  const g0 = d[awal * 4 + 1]
  const b0 = d[awal * 4 + 2]
  const [rf, gf, bf] = hexKeRgb(hex)
  const dikunjungi = new Uint8Array(LEBAR * TINGGI)
  const tumpukan = [awal]
  dikunjungi[awal] = 1

  const cocok = (p) => {
    const i = p * 4
    return (
      Math.abs(d[i] - r0) <= TOLERANSI_ISI &&
      Math.abs(d[i + 1] - g0) <= TOLERANSI_ISI &&
      Math.abs(d[i + 2] - b0) <= TOLERANSI_ISI
    )
  }
  const coba = (p) => {
    if (!dikunjungi[p] && cocok(p)) {
      dikunjungi[p] = 1
      tumpukan.push(p)
    }
  }

  while (tumpukan.length > 0) {
    const p = tumpukan.pop()
    const i = p * 4
    d[i] = Math.round(d[i] * (1 - opasitas) + rf * opasitas)
    d[i + 1] = Math.round(d[i + 1] * (1 - opasitas) + gf * opasitas)
    d[i + 2] = Math.round(d[i + 2] * (1 - opasitas) + bf * opasitas)
    d[i + 3] = 255

    const px = p % LEBAR
    if (px > 0) coba(p - 1)
    if (px < LEBAR - 1) coba(p + 1)
    if (p >= LEBAR) coba(p - LEBAR)
    if (p < LEBAR * (TINGGI - 1)) coba(p + LEBAR)
  }
  ctx.putImageData(gambar, 0, 0)
}

// Gambar pena atau bentuk di lapisan sementara dengan warna penuh
function gambarKeLapis(lc, o) {
  lc.clearRect(0, 0, LEBAR, TINGGI)
  lc.lineCap = 'round'
  lc.lineJoin = 'round'
  lc.lineWidth = o.tebal
  lc.strokeStyle = o.warnaGaris
  lc.fillStyle = o.warnaIsi

  if (o.alat === 'pena') {
    buatJalur(lc, o.jalur)
    lc.stroke()
    return
  }

  const { awal, akhir } = o
  const x = Math.min(awal.x, akhir.x)
  const y = Math.min(awal.y, akhir.y)
  const w = Math.abs(akhir.x - awal.x)
  const h = Math.abs(akhir.y - awal.y)

  lc.beginPath()
  if (o.alat === 'garis') {
    lc.moveTo(awal.x, awal.y)
    lc.lineTo(akhir.x, akhir.y)
  } else if (o.alat === 'persegi') {
    lc.rect(x, y, w, h)
  } else if (o.alat === 'elips') {
    lc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  } else if (o.alat === 'segitiga') {
    lc.moveTo(x + w / 2, y)
    lc.lineTo(x + w, y + h)
    lc.lineTo(x, y + h)
    lc.closePath()
  }

  const pakaiIsi = ADA_ISI.includes(o.alat) && o.gaya !== 'garis'
  const pakaiGaris = !ADA_ISI.includes(o.alat) || o.gaya !== 'isi'
  if (pakaiIsi) lc.fill()
  if (pakaiGaris) lc.stroke()
}

export default function KanvasLukis({ kanvasRef, onGoresan }) {
  const riwayat = useRef([])
  const snapshot = useRef(null)
  const lapis = useRef(null)
  const sedang = useRef(false)
  const jalur = useRef([])
  const awal = useRef(null)

  const [alat, setAlat] = useState('pena')
  const [warnaGaris, setWarnaGaris] = useState('#1c1c1a')
  const [warnaIsi, setWarnaIsi] = useState('#e8c547')
  const [ukuran, setUkuran] = useState(6)
  const [opasitas, setOpasitas] = useState(100)
  const [gaya, setGaya] = useState('garis')

  useEffect(() => {
    const ctx = ambilCtx(kanvasRef.current)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, LEBAR, TINGGI)
  }, [kanvasRef])

  function ambilLapis() {
    if (!lapis.current) {
      const c = document.createElement('canvas')
      c.width = LEBAR
      c.height = TINGGI
      lapis.current = c
    }
    return lapis.current
  }

  function titik(e) {
    const kotak = kanvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - kotak.left) * LEBAR) / kotak.width,
      y: ((e.clientY - kotak.top) * TINGGI) / kotak.height,
    }
  }

  function simpanRiwayat() {
    const salinan = ambilCtx(kanvasRef.current).getImageData(0, 0, LEBAR, TINGGI)
    riwayat.current.push(salinan)
    if (riwayat.current.length > BATAS_URUNGKAN) riwayat.current.shift()
    return salinan
  }

  function perbaruiStatus() {
    const { data } = ambilCtx(kanvasRef.current).getImageData(0, 0, LEBAR, TINGGI)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        onGoresan(true)
        return
      }
    }
    onGoresan(false)
  }

  function tampilkan(akhir) {
    const kanvas = kanvasRef.current
    const ctx = ambilCtx(kanvas)
    const tebal = ukuran * (LEBAR / kanvas.getBoundingClientRect().width)

    ctx.putImageData(snapshot.current, 0, 0)

    if (alat === 'penghapus') {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = tebal
      ctx.strokeStyle = '#ffffff'
      buatJalur(ctx, jalur.current)
      ctx.stroke()
      ctx.restore()
      return
    }

    const l = ambilLapis()
    gambarKeLapis(l.getContext('2d'), {
      alat,
      jalur: jalur.current,
      awal: awal.current,
      akhir,
      gaya,
      warnaGaris,
      warnaIsi,
      tebal,
    })
    ctx.save()
    ctx.globalAlpha = opasitas / 100
    ctx.drawImage(l, 0, 0)
    ctx.restore()
  }

  function mulai(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const ctx = ambilCtx(kanvasRef.current)
    const t = titik(e)
    const salinan = simpanRiwayat()

    if (alat === 'isi') {
      const x = Math.min(LEBAR - 1, Math.max(0, Math.floor(t.x)))
      const y = Math.min(TINGGI - 1, Math.max(0, Math.floor(t.y)))
      isiArea(ctx, x, y, warnaIsi, opasitas / 100)
      perbaruiStatus()
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    sedang.current = true
    snapshot.current = salinan
    awal.current = t
    jalur.current = [t]
    tampilkan(t)
  }

  function gerak(e) {
    if (!sedang.current) return
    const t = titik(e)
    if (alat === 'pena' || alat === 'penghapus') jalur.current.push(t)
    tampilkan(t)
  }

  function selesai() {
    if (!sedang.current) return
    sedang.current = false
    perbaruiStatus()
  }

  function urungkan() {
    const sebelumnya = riwayat.current.pop()
    if (!sebelumnya) return
    ambilCtx(kanvasRef.current).putImageData(sebelumnya, 0, 0)
    perbaruiStatus()
  }

  function bersihkan() {
    simpanRiwayat()
    const ctx = ambilCtx(kanvasRef.current)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, LEBAR, TINGGI)
    perbaruiStatus()
  }

  return (
    <div>
      <div className="toolbar" role="toolbar" aria-label="Alat lukis">
        {ALAT.map(([kode, nama]) => (
          <button key={kode} type="button" aria-pressed={alat === kode} onClick={() => setAlat(kode)}>
            {nama}
          </button>
        ))}

        <label className="alat">
          Garis
          <input type="color" value={warnaGaris} onChange={(e) => setWarnaGaris(e.target.value)} />
        </label>
        <label className="alat">
          Isi
          <input type="color" value={warnaIsi} onChange={(e) => setWarnaIsi(e.target.value)} />
        </label>

        <label className="alat">
          Bentuk
          <select
            value={gaya}
            onChange={(e) => setGaya(e.target.value)}
            disabled={!ADA_ISI.includes(alat)}
          >
            <option value="garis">Garis tepi</option>
            <option value="isi">Isi saja</option>
            <option value="keduanya">Garis dan isi</option>
          </select>
        </label>

        <label className="alat">
          Ukuran
          <input type="range" min="1" max="60" value={ukuran} onChange={(e) => setUkuran(Number(e.target.value))} />
          {ukuran}
        </label>
        <label className="alat">
          Opacity
          <input type="range" min="5" max="100" value={opasitas} onChange={(e) => setOpasitas(Number(e.target.value))} />
          {opasitas}%
        </label>

        <button type="button" onClick={urungkan}>Urungkan</button>
        <button type="button" onClick={bersihkan}>Bersihkan</button>
      </div>
      <canvas
        ref={kanvasRef}
        width={LEBAR}
        height={TINGGI}
        className="kanvas"
        onPointerDown={mulai}
        onPointerMove={gerak}
        onPointerUp={selesai}
        onPointerCancel={selesai}
      />
    </div>
  )
}