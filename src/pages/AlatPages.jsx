import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BATAS, hapusLatar, periksaFile, siapkanGambar } from '../lib/hapusLatar'
import KartuAlat from '../components/KartuAlat'
import { DAFTAR_ALAT } from '../lib/alat'



export function AlatList() {
  return (
    <>
      <h1>Alat</h1>
      <p className="redup">Semua alat berjalan di browsermu. File yang kamu pakai tidak dikirim ke server.</p>
      <div className="grid-alat">
        {DAFTAR_ALAT.map((a) => (
          <KartuAlat key={a.path} alat={a} />
        ))}
      </div>
    </>
  )
}

export function HapusLatarPage() {
  const [tahap, setTahap] = useState('pilih') // pilih | siap | proses | selesai
  const [asal, setAsal] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [pesan, setPesan] = useState('')
  const [progres, setProgres] = useState('')
  const [menarik, setMenarik] = useState(false)
  const daftarUrl = useRef([])

  // Buang semua alamat sementara saat halaman ditutup
  useEffect(() => {
    const daftar = daftarUrl.current
    return () => daftar.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  function buatUrl(blob) {
    const url = URL.createObjectURL(blob)
    daftarUrl.current.push(url)
    return url
  }

  function bersihkanUrl() {
    daftarUrl.current.forEach((u) => URL.revokeObjectURL(u))
    daftarUrl.current.length = 0
  }

  async function terimaFile(file) {
    if (!file || tahap === 'proses') return
    const masalah = periksaFile(file)
    if (masalah) {
      setPesan(masalah)
      return
    }
    setPesan('')
    bersihkanUrl()
    setHasil(null)
    try {
      const siap = await siapkanGambar(file)
      setAsal({ ...siap, url: buatUrl(siap.blob), nama: file.name.replace(/\.[^.]+$/, '') })
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
          setProgres('Memproses gambar…')
        }
      })
      setHasil({ blob, url: buatUrl(blob) })
      setTahap('selesai')
    } catch (err) {
      setPesan(`Gagal memproses: ${err.message}. Coba gambar yang lebih kecil atau muat ulang halaman.`)
      setTahap('siap')
    }
  }

  function ulangi() {
    bersihkanUrl()
    setAsal(null)
    setHasil(null)
    setPesan('')
    setTahap('pilih')
  }

  return (
    <>
      <p><Link to="/alat">← Alat</Link></p>
      <h1>Hapus latar belakang</h1>
      <p className="redup">
        Canva maruk sekali ngambil-ngambil remove.bg, jadi sekarang ada alat hapus latar di situs ini. Semua proses terjadi di browser, tanpa mengunggah gambar ke server.
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
          <strong>Pilih gambar atau seret ke sini</strong>
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
          <div className="alat-banding">
            <figure className="alat-kotak">
              <img src={asal.url} alt="Gambar asli" />
              <figcaption>
                Asli · {asal.lebar}×{asal.tinggi}px{asal.dikecilkan ? ' (diperkecil)' : ''}
              </figcaption>
            </figure>
            {hasil && (
              <figure className="alat-kotak">
                <div className="petak">
                  <img src={hasil.url} alt="Hasil tanpa latar" />
                </div>
                <figcaption>Hasil · PNG transparan</figcaption>
              </figure>
            )}
          </div>

          {tahap === 'proses' && <p role="status" className="redup">{progres}</p>}

          <div className="aksi">
            {tahap === 'siap' && (
              <button type="button" className="tombol utama" onClick={proses}>Hapus latar</button>
            )}
            {tahap === 'selesai' && (
              <a className="tombol utama" href={hasil.url} download={`${asal.nama}-tanpa-latar.png`}>
                Unduh PNG
              </a>
            )}
            <button type="button" className="tombol" onClick={ulangi} disabled={tahap === 'proses'}>
              Gambar lain
            </button>
          </div>

          {tahap === 'siap' && (
            <p className="redup kecil">
              Pertama kali dipakai, browser mengunduh model AI berukuran puluhan MB. Sebaiknya pakai Wi-Fi.
            </p>
          )}
        </>
      )}

      <section>
        <h2>Batasan</h2>
        <p className="redup">
          Format PNG, JPG, atau WebP, maksimal {BATAS.ukuranMaks / 1024 / 1024} MB. Gambar yang terlalu
          besar diperkecil otomatis (sisi terpanjang maksimal 2048 px, atau 1536 px di HP) supaya
          perangkatmu tidak kehabisan memori. Satu gambar diproses per waktu, dan hasilnya selalu
          berupa PNG transparan.
        </p>
      </section>
    </>
  )
}