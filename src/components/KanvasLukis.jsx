import { useEffect, useRef, useState } from 'react'

const LEBAR = 1200
const TINGGI = 800
const BATAS_URUNGKAN = 12

export default function KanvasLukis({ kanvasRef, onGoresan }) {
  const riwayat = useRef([])
  const menggambar = useRef(false)
  const titikTerakhir = useRef(null)
  const [alat, setAlat] = useState('pena')
  const [warna, setWarna] = useState('#1c1c1a')
  const [ukuran, setUkuran] = useState(6)

  useEffect(() => {
    const ctx = kanvasRef.current.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, LEBAR, TINGGI)
  }, [kanvasRef])

  function titik(e) {
    const kotak = kanvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - kotak.left) * LEBAR) / kotak.width,
      y: ((e.clientY - kotak.top) * TINGGI) / kotak.height,
    }
  }

  function simpanRiwayat() {
    const ctx = kanvasRef.current.getContext('2d')
    riwayat.current.push(ctx.getImageData(0, 0, LEBAR, TINGGI))
    if (riwayat.current.length > BATAS_URUNGKAN) riwayat.current.shift()
  }

  function perbaruiStatus() {
    const { data } = kanvasRef.current
      .getContext('2d')
      .getImageData(0, 0, LEBAR, TINGGI)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        onGoresan(true)
        return
      }
    }
    onGoresan(false)
  }

  function garis(dari, ke) {
    const kanvas = kanvasRef.current
    const ctx = kanvas.getContext('2d')
    const skala = LEBAR / kanvas.getBoundingClientRect().width
    ctx.strokeStyle = alat === 'penghapus' ? '#ffffff' : warna
    ctx.lineWidth = ukuran * skala
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(dari.x, dari.y)
    ctx.lineTo(ke.x, ke.y)
    ctx.stroke()
  }

  function mulai(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    simpanRiwayat()
    menggambar.current = true
    const t = titik(e)
    titikTerakhir.current = t
    garis(t, { x: t.x + 0.01, y: t.y })
  }

  function gerak(e) {
    if (!menggambar.current) return
    const t = titik(e)
    garis(titikTerakhir.current, t)
    titikTerakhir.current = t
  }

  function selesai() {
    if (!menggambar.current) return
    menggambar.current = false
    perbaruiStatus()
  }

  function urungkan() {
    const sebelumnya = riwayat.current.pop()
    if (!sebelumnya) return
    kanvasRef.current.getContext('2d').putImageData(sebelumnya, 0, 0)
    perbaruiStatus()
  }

  function bersihkan() {
    simpanRiwayat()
    const ctx = kanvasRef.current.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, LEBAR, TINGGI)
    perbaruiStatus()
  }

  return (
    <div>
      <div className="toolbar" role="toolbar" aria-label="Alat lukis">
        <button type="button" aria-pressed={alat === 'pena'} onClick={() => setAlat('pena')}>
          Pena
        </button>
        <button type="button" aria-pressed={alat === 'penghapus'} onClick={() => setAlat('penghapus')}>
          Penghapus
        </button>
        <label className="alat">
          Warna
          <input
            type="color"
            value={warna}
            onChange={(e) => {
              setWarna(e.target.value)
              setAlat('pena')
            }}
          />
        </label>
        <label className="alat">
          Ukuran
          <input
            type="range"
            min="1"
            max="60"
            value={ukuran}
            onChange={(e) => setUkuran(Number(e.target.value))}
          />
          {ukuran}
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