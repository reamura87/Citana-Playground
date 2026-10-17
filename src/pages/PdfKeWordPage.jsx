import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BATAS_GAMBAR,
  BATAS_PDF,
  buatDocx,
  buatDocxGambar,
  pdfKeBlok,
  pdfKeGambarHalaman,
  periksaPdf,
} from '../lib/pdfkeWord'

export default function PdfKeWordPage() {
  const [tahap, setTahap] = useState('pilih') // pilih | siap | proses | selesai
  const [mode, setMode] = useState('gambar') // gambar | teks
  const [file, setFile] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [pesan, setPesan] = useState('')
  const [progres, setProgres] = useState({ i: 0, n: 0 })
  const [pisahHalaman, setPisahHalaman] = useState(true)
  const [menarik, setMenarik] = useState(false)
  const sinyal = useRef(null)
  const daftarUrl = useRef([])

  // Buang alamat sementara saat halaman ditutup
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

  function terimaFile(dipilih) {
    if (!dipilih || tahap === 'proses') return
    const masalah = periksaPdf(dipilih)
    if (masalah) {
      setPesan(masalah)
      return
    }
    bersihkanUrl()
    setPesan('')
    setHasil(null)
    setFile(dipilih)
    setTahap('siap')
  }

  async function proses() {
    if (!file || tahap === 'proses') return
    sinyal.current = { dibatalkan: false }
    setTahap('proses')
    setPesan('')
    setProgres({ i: 0, n: 0 })
    const onProgres = (i, n) => setProgres({ i, n })

    try {
      if (mode === 'gambar') {
        const halaman = await pdfKeGambarHalaman(file, { sinyal: sinyal.current, onProgres })
        const blob = await buatDocxGambar(halaman)
        bersihkanUrl()
        setHasil({
          mode: 'gambar',
          url: buatUrl(blob),
          urlPratinjau: buatUrl(new Blob([halaman[0].data], { type: 'image/jpeg' })),
          jumlahHalaman: halaman.length,
          ukuranMB: blob.size / 1024 / 1024,
        })
      } else {
        const { blok, jumlahHalaman, jumlahKarakter } = await pdfKeBlok(file, {
          sinyal: sinyal.current,
          onProgres,
        })
        if (jumlahKarakter === 0) {
          throw new Error(
            'Tidak ada teks yang bisa dibaca. PDF ini kemungkinan hasil scan (berupa gambar). Coba mode "Tampilan sama persis".',
          )
        }
        const blob = await buatDocx(blok, { pisahHalaman })
        bersihkanUrl()
        setHasil({
          mode: 'teks',
          url: buatUrl(blob),
          jumlahHalaman,
          jumlahKarakter,
          jarang: jumlahKarakter / jumlahHalaman < 30,
          cuplikan: blok.flat().slice(0, 5).map((b) => b.teks).join('\n\n').slice(0, 700),
        })
      }
      setTahap('selesai')
    } catch (err) {
      setPesan(err.message === 'Dibatalkan.' ? 'Proses dibatalkan.' : `Gagal memproses: ${err.message}`)
      setTahap('siap')
    }
  }

  function batalkan() {
    if (sinyal.current) sinyal.current.dibatalkan = true
  }

  function ulangi() {
    bersihkanUrl()
    setFile(null)
    setHasil(null)
    setPesan('')
    setTahap('pilih')
  }

  const namaDasar = file ? file.name.replace(/\.[^.]+$/, '') : 'dokumen'
  const kataKerja = mode === 'gambar' ? 'Merender' : 'Membaca'

  return (
    <>
      <p><Link to="/alat">← Alat</Link></p>
      <h1>PDF ke Word (Beta)</h1>
      <p className="redup">
        Masih jelek, hebat khe kalau masih pakai ini
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
          <strong>Pilih PDF atau seret ke sini</strong>
          <span>Maksimal {BATAS_PDF.ukuranMaks / 1024 / 1024} MB</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              terimaFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      )}

      {pesan && <p role="alert">{pesan}</p>}

      {file && (
        <>
          <p>
            <strong>{file.name}</strong>
            <span className="redup"> · {(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </p>

          {tahap === 'siap' && (
            <>
              <div className="aksi" role="group" aria-label="Mode konversi">
                <button type="button" className="tombol" aria-pressed={mode === 'gambar'} onClick={() => setMode('gambar')}>
                  Tampilan sama persis
                </button>
                <button type="button" className="tombol" aria-pressed={mode === 'teks'} onClick={() => setMode('teks')}>
                  Teks yang bisa diedit
                </button>
              </div>

              {mode === 'gambar' ? (
                <p className="redup kecil">
                  Setiap halaman jadi gambar di Word, jadi gambar, tabel, font, dan warna tampil identik.
                  Teksnya tidak bisa diedit atau dicari. Maksimal {BATAS_GAMBAR.halamanMaks} halaman.
                </p>
              ) : (
                <>
                  <p className="redup kecil">
                    Hanya teks yang diambil dan disusun jadi paragraf dan judul. Gambar, tabel, dan kolom
                    ganda tidak ikut terbawa. Maksimal {BATAS_PDF.halamanMaks} halaman.
                  </p>
                  <label className="centang">
                    <input
                      type="checkbox"
                      checked={pisahHalaman}
                      onChange={(e) => setPisahHalaman(e.target.checked)}
                    />
                    Pertahankan pemisah halaman
                  </label>
                </>
              )}
            </>
          )}

          {tahap === 'proses' && (
            <p role="status" className="redup">
              {progres.n > 0
                ? `${kataKerja} halaman ${progres.i} dari ${progres.n}…`
                : 'Membuka PDF…'}
            </p>
          )}

          {tahap === 'selesai' && hasil?.mode === 'gambar' && (
            <>
              <p className="redup">
                {hasil.jumlahHalaman} halaman, ukuran file sekitar {hasil.ukuranMB.toFixed(1)} MB.
                Halaman pertama:
              </p>
              <img src={hasil.urlPratinjau} alt="Halaman pertama" className="karya" />
            </>
          )}

          {tahap === 'selesai' && hasil?.mode === 'teks' && (
            <>
              <p className="redup">
                {hasil.jumlahHalaman} halaman dibaca, sekitar {hasil.jumlahKarakter.toLocaleString('id-ID')} karakter.
              </p>
              {hasil.jarang && (
                <p role="alert">
                  Teks yang terbaca sangat sedikit. PDF ini kemungkinan sebagian atau seluruhnya hasil scan.
                  Coba mode &quot;Tampilan sama persis&quot;.
                </p>
              )}
              <p className="redup kecil">Cuplikan hasil:</p>
              <pre className="cuplikan">{hasil.cuplikan}</pre>
            </>
          )}

          <div className="aksi">
            {tahap === 'siap' && (
              <button type="button" className="tombol utama" onClick={proses}>Ubah ke Word</button>
            )}
            {tahap === 'proses' && (
              <button type="button" className="tombol" onClick={batalkan}>Batalkan</button>
            )}
            {tahap === 'selesai' && hasil && (
              <a className="tombol utama" href={hasil.url} download={`${namaDasar}.docx`}>
                Unduh .docx
              </a>
            )}
            <button type="button" className="tombol" onClick={ulangi} disabled={tahap === 'proses'}>
              File lain
            </button>
          </div>
        </>
      )}
    </>
  )
}