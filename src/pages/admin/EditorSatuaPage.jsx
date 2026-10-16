import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PenyuntingTeks from '../../components/PenyuntingTeks'
import { useAmbil } from '../../lib/useAmbil'
import {
  ambilKategori,
  ambilSatuaById,
  simpanSatua,
  unggahGambar,
} from '../../lib/satua'

export default function EditorSatuaPage() {
  const { id } = useParams()
  const { data, memuat, error } = useAmbil(
    () => (id ? ambilSatuaById(id) : Promise.resolve(null)),
    [id],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat: {error.message}</p>
  if (id && !data) return <p>Satua tidak ditemukan.</p>

  return <FormSatua key={id ?? 'baru'} awal={data} />
}

function FormSatua({ awal }) {
  const navigate = useNavigate()
  const { data: kategoriAda } = useAmbil(ambilKategori, [])
  const [judul, setJudul] = useState(awal?.judul ?? '')
  const [kategori, setKategori] = useState(awal?.kategori ?? 'Umum')
  const [isi, setIsi] = useState(awal?.isi ?? '')
  const [thumbnail, setThumbnail] = useState(awal?.thumbnail_url ?? '')
  const [terbit, setTerbit] = useState(awal?.terbit ?? false)
  const [status, setStatus] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  async function pilihThumbnail(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('Mengunggah thumbnail…')
    try {
      setThumbnail(await unggahGambar(file))
      setStatus('')
    } catch (err) {
      setStatus(`Gagal mengunggah thumbnail: ${err.message}`)
    }
  }

  async function simpan(e) {
    e.preventDefault()
    if (!judul.trim()) {
      setStatus('Judul wajib diisi.')
      return
    }
    setMenyimpan(true)
    setStatus('')
    try {
      await simpanSatua({
        id: awal?.id,
        judul: judul.trim(),
        kategori: kategori.trim() || 'Umum',
        isi,
        thumbnail_url: thumbnail || null,
        terbit,
      })
      navigate('/admin/satua')
    } catch (err) {
      setStatus(`Gagal menyimpan: ${err.message}`)
      setMenyimpan(false)
    }
  }

  return (
    <>
      <h1>{awal ? 'Edit satua' : 'Satua baru'}</h1>
      <form className="form" onSubmit={simpan}>
        <label>
          Judul
          <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} />
        </label>

        <label>
          Kategori
          <input
            type="text"
            list="daftar-kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          />
          <datalist id="daftar-kategori">
            {(kategoriAda ?? []).map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>

        <div>
          <p className="redup">Thumbnail (dipotong otomatis ke rasio 3:4)</p>
          {thumbnail && <img src={thumbnail} alt="" className="pratinjau" />}
          <input type="file" accept="image/*" onChange={pilihThumbnail} />
        </div>

        <div>
          <p className="redup">Isi cerita</p>
          <PenyuntingTeks nilaiAwal={awal?.isi ?? ''} onUbah={setIsi} />
        </div>

        <label className="centang">
          <input type="checkbox" checked={terbit} onChange={(e) => setTerbit(e.target.checked)} />
          Terbitkan (tampil untuk pengunjung)
        </label>

        <div className="aksi">
          <button type="submit" className="tombol utama" disabled={menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className="tombol" onClick={() => navigate('/admin/satua')}>
            Batal
          </button>
          {status && <span className="redup">{status}</span>}
        </div>
      </form>
    </>
  )
}