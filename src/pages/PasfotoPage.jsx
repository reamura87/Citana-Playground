import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BATAS, hapusLatar, periksaFile, siapkanGambar } from '../lib/hapusLatar'
import {
  UKURAN,
  WARNA,
  analisisSubjek,
  buatLembarCetak,
  cmKePx,
  gambarPassfoto,
  kanvasKeBlob,
  tataLembar,
} from '../lib/passfoto'

const batasCm = (n) => Math.min(10, Math.max(1, Number(n) || 1))

function unduhBlob(blob, nama) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function PassfotoPage() {
  const [tahap, setTahap] = useState('pilih') // pilih | siap | proses | selesai
  const [asal, setAsal] = useState(null)
  const [potongan, setPotongan] = useState(null)
  const [kodeUkuran, setKodeUkuran] = useState('3x4')
  const [kustom, setKustom] = useState({ lebar: '3', tinggi: '4' })
  const [warna, setWarna] = useState('#d71920')
  const [zoom, setZoom] = useState(100)
  const [geserX, setGeserX] = useState(0)
  const [geserY, setGeserY] = useState(0)
  const [panduan, setPanduan] = useState(false)
  const [pesan, setPesan] = useState('')
  const [progres, setProgres] = useState('')
  const [menarik, setMenarik] = useState(false)
  const kanvasRef = useRef(null)
  const simpanan = useRef({ bitmap: null, url: null })

  // Bersihkan memori saat halaman ditutup
  useEffect(() => {
    const s = simpanan.current
    return () => {
      s.bitmap?.close()
      if (s.url) URL.revokeObjectURL(s.url)
    }
  }, [])

  const ukuranCm =
    kodeUkuran === 'kustom'
      ? { lebar: batasCm(kustom.lebar), tinggi: batasCm(kustom.tinggi) }
      : UKURAN.find((u) => u.kode === kodeUkuran)
  const lebarPx = cmKePx(ukuranCm.lebar)
  const tinggiPx = cmKePx(ukuranCm.tinggi)
  const tata = tataLembar(lebarPx, tinggiPx)

  // Gambar ulang pratinjau setiap pengaturan berubah
  useEffect(() => {
    if (tahap !== 'selesai' || !potongan || !kanvasRef.current) return
    gambarPassfoto(kanvasRef.current, {
      sumber: potongan.bitmap,
      analisis: potongan.analisis,
      lebar: lebarPx,
      tinggi: tinggiPx,
      warna,
      zoom: zoom / 100,
      geserX: geserX / 100,
      geserY: geserY / 100,
    })
  }, [tahap, potongan, lebarPx, tinggiPx, warna, zoom, geserX, geserY])

  async function terimaFile(file) {
    if (!file || tahap === 'proses') return
    const masalah = periksaFile(file)
    if (masalah) {
      setPesan(masalah)
      return
    }
    setPesan('')
    try {
      const siap = await siapkanGambar(file)
      const s = simpanan.current
      if (s.url) URL.revokeObjectURL(s.url)
      s.url = URL.createObjectURL(siap.blob)
      s.bitmap?.close()
      s.bitmap = null
      setPotongan(null)
      setAsal({ ...siap, url: s.url, nama: file.name.replace(/\.[^.]+$/, '') })
      setTahap('siap')
    } catch {
      setPesan('Gambar tidak bisa dibaca. Coba file lain.')
    }
  }

  async function proses() {
    if (!asal || tahap === 'proses') return
    setTahap('proses')
    setPesan('')
    setProgres('Menyiapkan…')
    try {
      const blob = await hapusLatar(asal.blob, (kunci, sekarang, total) => {
        if (kunci.startsWith('fetch')) {
          const persen = total ? Math.round((sekarang / total) * 100) : null
          setProgres(persen === null ? 'Mengunduh model…' : `Mengunduh model… ${persen}%`)
        } else {
          setProgres('Menghapus latar dan menata foto…')
        }
      })
      const bitmap = await createImageBitmap(blob)
      const analisis = analisisSubjek(bitmap)
      if (!analisis || analisis.tinggiSubjek < bitmap.height * 0.15) {
        bitmap.close()
        throw new Error('Tidak ada orang yang terdeteksi jelas di foto ini. Coba foto dengan wajah dan bahu yang terlihat.')
      }
      const s = simpanan.current
      s.bitmap?.close()
      s.bitmap = bitmap
      setPotongan({ bitmap, analisis })
      setZoom(100)
      setGeserX(0)
      setGeserY(0)
      setTahap('selesai')
    } catch (err) {
      setPesan(`Gagal memproses: ${err.message}`)
      setTahap('siap')
    }
  }

  function aturUlangPosisi() {
    setZoom(100)
    setGeserX(0)
    setGeserY(0)
  }

  function ulangi() {
    const s = simpanan.current
    s.bitmap?.close()
    s.bitmap = null
    if (s.url) URL.revokeObjectURL(s.url)
    s.url = null
    setPotongan(null)
    setAsal(null)
    setPesan('')
    setTahap('pilih')
  }

  async function unduhFoto() {
    const blob = await kanvasKeBlob(kanvasRef.current)
    unduhBlob(blob, `${asal.nama}-pasfoto-${ukuranCm.lebar}x${ukuranCm.tinggi}cm.jpg`)
  }

  async function unduhLembar() {
    const hasil = buatLembarCetak(kanvasRef.current)
    if (!hasil) return
    const blob = await kanvasKeBlob(hasil.kanvas)
    unduhBlob(blob, `${asal.nama}-lembar-cetak-4R.jpg`)
  }

  return (
    <>
      <p><Link to="/alat">← Alat</Link></p>
      <h1>Pas foto otomatis</h1>
      <p className="redup">
        Ketika khe ingin membuat pasfoto buat surat di Simak, tapi khe gabisa buat pasfoto,
        aduh kasian khe. Makanya khe pakai alat ini aja awokaowkawok
      </p>

      {tahap === 'pilih' && (
        <label
          className={`alat-pilih${menarik ? ' tarik' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setMenarik(true)
          }}
          onDragLeave={() => setMenarik(false)}
          onDrop={(e) => {
            e.preventDefault()
            setMenarik(false)
            terimaFile(e.dataTransfer.files?.[0])
          }}
        >
          <strong>Pilih foto atau seret ke sini</strong>
          <span>PNG, JPG, atau WebP · maksimal {BATAS.ukuranMaks / 1024 / 1024} MB</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              terimaFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      )}

      {pesan && <p role="alert">{pesan}</p>}

      {asal && (
        <>
          <div className="pilihan">
            <p className="redup">Ukuran</p>
            <div className="aksi" role="group" aria-label="Ukuran pas foto">
              {UKURAN.map((u) => (
                <button
                  key={u.kode}
                  type="button"
                  className="tombol"
                  aria-pressed={kodeUkuran === u.kode}
                  onClick={() => setKodeUkuran(u.kode)}
                >
                  {u.nama}
                </button>
              ))}
            </div>
            {kodeUkuran === 'kustom' && (
              <div className="aksi">
                <label>
                  Lebar (cm)
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={kustom.lebar}
                    onChange={(e) => setKustom((k) => ({ ...k, lebar: e.target.value }))}
                  />
                </label>
                <label>
                  Tinggi (cm)
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={kustom.tinggi}
                    onChange={(e) => setKustom((k) => ({ ...k, tinggi: e.target.value }))}
                  />
                </label>
              </div>
            )}
            <p className="redup kecil">{lebarPx} × {tinggiPx} piksel (300 dpi)</p>
          </div>

          <div className="pilihan">
            <p className="redup">Warna latar</p>
            <div className="aksi" role="group" aria-label="Warna latar">
              {WARNA.map((w) => (
                <button
                  key={w.hex}
                  type="button"
                  className="tombol"
                  aria-pressed={warna.toLowerCase() === w.hex}
                  onClick={() => setWarna(w.hex)}
                >
                  <span className="sampel" style={{ background: w.hex }} />
                  {w.nama}
                </button>
              ))}
              <label>
                Kustom
                <input type="color" value={warna} onChange={(e) => setWarna(e.target.value)} />
              </label>
            </div>
          </div>

          {tahap === 'siap' && (
            <>
              <img src={asal.url} alt="Foto asli" className="karya" style={{ maxWidth: 280 }} />
              <p className="redup kecil">
                Gunakan foto menghadap lurus, wajah dan bahu terlihat, cahaya merata. Pertama kali dipakai,
                browser mengunduh model AI berukuran puluhan MB, jadi sebaiknya pakai Wi-Fi.
              </p>
            </>
          )}

          {tahap === 'proses' && <p role="status" className="redup">{progres}</p>}

          {tahap === 'selesai' && (
            <>
              <div className="pas-pratinjau" style={{ aspectRatio: `${lebarPx} / ${tinggiPx}` }}>
                <canvas ref={kanvasRef} className="pas-kanvas" />
                {panduan && (
                  <>
                    <span className="pas-garis pas-tengah" />
                    <span className="pas-garis pas-atas" />
                    <span className="pas-garis pas-dagu" />
                  </>
                )}
              </div>

              {!potongan.analisis.tinggiKepala && (
                <p className="redup kecil">
                  Leher tidak terdeteksi (misalnya karena hijab atau kerah tinggi), jadi posisi ditata dengan
                  cara cadangan. Sesuaikan dengan slider kalau perlu.
                </p>
              )}

              <label className="geser">
                <span>Zoom</span>
                <input type="range" min="70" max="150" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                <span>{zoom}%</span>
              </label>
              <label className="geser">
                <span>Kiri – kanan</span>
                <input type="range" min="-20" max="20" value={geserX} onChange={(e) => setGeserX(Number(e.target.value))} />
                <span>{geserX}</span>
              </label>
              <label className="geser">
                <span>Atas – bawah</span>
                <input type="range" min="-20" max="20" value={geserY} onChange={(e) => setGeserY(Number(e.target.value))} />
                <span>{geserY}</span>
              </label>
              <div className="aksi">
                <label className="centang">
                  <input type="checkbox" checked={panduan} onChange={(e) => setPanduan(e.target.checked)} />
                  Tampilkan garis panduan
                </label>
                <button type="button" className="tautan-tombol" onClick={aturUlangPosisi}>
                  Atur ulang posisi
                </button>
              </div>
            </>
          )}

          <div className="aksi">
            {tahap === 'siap' && (
              <button type="button" className="tombol utama" onClick={proses}>Buat pas foto</button>
            )}
            {tahap === 'selesai' && (
              <>
                <button type="button" className="tombol utama" onClick={unduhFoto}>Unduh JPG</button>
                <button type="button" className="tombol" onClick={unduhLembar} disabled={tata.jumlah === 0}>
                  Unduh lembar cetak 4R ({tata.jumlah} foto)
                </button>
              </>
            )}
            <button type="button" className="tombol" onClick={ulangi} disabled={tahap === 'proses'}>
              Foto lain
            </button>
          </div>
          {tahap === 'selesai' && tata.jumlah === 0 && (
            <p className="redup kecil">Ukuran ini terlalu besar untuk lembar 4R.</p>
          )}
        </>
      )}

      <section>
        <h2>Yang perlu diketahui</h2>
        <p className="redup">
          Penempatan otomatis berdasarkan bentuk siluet, bukan pengenalan wajah, jadi periksa hasilnya dan
          setel dengan slider. Kualitas tepi rambut bergantung pada foto: latar polos terang dan cahaya merata
          memberi hasil terbaik. Warna dan ukuran yang diminta tiap instansi bisa berbeda, dan sebagian
          instansi tidak menerima foto hasil suntingan, jadi cek ketentuannya dulu.
        </p>
      </section>
    </>
  )
}