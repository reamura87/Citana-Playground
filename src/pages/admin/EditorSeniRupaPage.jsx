import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import KanvasLukis from '../../components/KanvasLukis'
import { useAmbil } from '../../lib/useAmbil'
import { unggahGambar, unggahKanvas } from '../../lib/satua'
import {
  ambilKategoriSeniRupa,
  ambilSeniRupaById,
  ambilUsernameSaya,
  hapusFileGambar,
  tambahSeniRupa,
  ubahSeniRupa,
} from '../../lib/seniRupa'

export default function EditorSeniRupaPage() {
  const { id } = useParams()
  const { data, memuat, error } = useAmbil(
    () => (id ? ambilSeniRupaById(id) : Promise.resolve(null)),
    [id],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat: {error.message}</p>
  if (id && !data) return <p>Karya tidak ditemukan.</p>

  return <FormSeniRupa key={id ?? 'baru'} awal={data} />
}

function FormSeniRupa({ awal }) {
  const navigate = useNavigate()
  const kanvasRef = useRef(null)
  const { data: kategoriAda } = useAmbil(ambilKategoriSeniRupa, [])
  const { data: username, memuat: memuatUsername } = useAmbil(ambilUsernameSaya, [])

  const [mode, setMode] = useState('lukis')
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [kategori, setKategori] = useState(awal?.kategori ?? 'Umum')
  const [file, setFile] = useState(null)
  const [pratinjau, setPratinjau] = useState('')
  const [adaGoresan, setAdaGoresan] = useState(false)
  const [status, setStatus] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  const usernameBelumAda = !awal && !memuatUsername && !username

  function pilihFile(e) {
    const dipilih = e.target.files?.[0]
    if (!dipilih) return
    if (pratinjau) URL.revokeObjectURL(pratinjau)
    setFile(dipilih)
    setPratinjau(URL.createObjectURL(dipilih))
  }

  async function simpan(e) {
    e.preventDefault()
    if (!nama.trim()) {
      setStatus('Nama wajib diisi.')
      return
    }
    const data = { nama: nama.trim(), kategori: kategori.trim() || 'Umum' }

    // Mode edit: hanya nama dan kategori
    if (awal) {
      setMenyimpan(true)
      try {
        await ubahSeniRupa(awal.id, data)
        navigate('/admin/seni-rupa')
      } catch (err) {
        setStatus(`Gagal menyimpan: ${err.message}`)
        setMenyimpan(false)
      }
      return
    }

    if (mode === 'lukis' && !adaGoresan) {
      setStatus('Kanvas masih kosong.')
      return
    }
    if (mode === 'unggah' && !file) {
      setStatus('Pilih gambar dulu.')
      return
    }

    setMenyimpan(true)
    setStatus('Mengunggah…')
    let url = null
    try {
      url =
        mode === 'lukis'
          ? await unggahKanvas(kanvasRef.current)
          : await unggahGambar(file, { folder: 'seni-rupa', lebarMaks: 2000 })
      await tambahSeniRupa({ ...data, gambar_url: url, asal: mode })
      navigate('/admin/seni-rupa')
    } catch (err) {
      if (url) await hapusFileGambar(url)
      setStatus(`Gagal menyimpan: ${err.message}`)
      setMenyimpan(false)
    }
  }

  return (
    <>
      <h1>{awal ? 'Edit karya' : 'Karya baru'}</h1>

      {usernameBelumAda && (
        <p>
          Username akunmu belum diatur, jadi karya belum bisa disimpan. Isi tabel
          <code> profil </code>di Supabase (lihat langkah 1 SQL).
        </p>
      )}

      <form className="form" onSubmit={simpan}>
        {!awal && (
          <div className="aksi" role="group" aria-label="Cara membuat karya">
            <button type="button" className="tombol" aria-pressed={mode === 'lukis'} onClick={() => setMode('lukis')}>
              Buat gambar baru
            </button>
            <button type="button" className="tombol" aria-pressed={mode === 'unggah'} onClick={() => setMode('unggah')}>
              Unggah gambar
            </button>
          </div>
        )}

        {awal && <img src={awal.gambar_url} alt={awal.nama} className="karya" />}

        {!awal && (
          <>
            <div hidden={mode !== 'lukis'}>
              <KanvasLukis kanvasRef={kanvasRef} onGoresan={setAdaGoresan} />
            </div>
            <div hidden={mode !== 'unggah'}>
              {pratinjau && <img src={pratinjau} alt="Pratinjau" className="karya" />}
              <input type="file" accept="image/*" onChange={pilihFile} />
            </div>
          </>
        )}

        <label>
          Nama karya
          <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>

        <label>
          Kategori
          <input
            type="text"
            list="kategori-seni-rupa"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          />
          <datalist id="kategori-seni-rupa">
            {(kategoriAda ?? []).map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>

        <p className="redup">
          Pembuat: <strong>{awal ? awal.pembuat_nama : (username ?? '…')}</strong> (diisi otomatis)
        </p>

        <div className="aksi">
          <button type="submit" className="tombol utama" disabled={menyimpan || usernameBelumAda}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className="tombol" onClick={() => navigate('/admin/seni-rupa')}>
            Batal
          </button>
          {status && <span className="redup">{status}</span>}
        </div>
      </form>
    </>
  )
}