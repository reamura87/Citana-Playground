import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PakaiSesi from '../components/PakaiSesi'
import PenyuntingTeks from '../components/PenyuntingTeks'
import {
  ambilEpisodeById,
  ambilSemuaEpisode,
  ambilTulisanSaya,
  hapusEpisode,
  hapusPersonal,
  simpanEpisode,
  simpanPersonal,
} from '../lib/personal'
import { ambilKategori, ambilSatuaById, formatTanggal } from '../lib/satua'
import { unggahKarya } from '../lib/seniRupa'
import { useAmbil } from '../lib/useAmbil'

// ---------- Daftar tulisan saya ----------
export function TulisanSaya() {
  return (
    <PakaiSesi>{(userId) => (userId ? <DaftarTulisan userId={userId} /> : null)}</PakaiSesi>
  )
}

function DaftarTulisan({ userId }) {
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const { data, memuat, error } = useAmbil(() => ambilTulisanSaya(userId), [userId, versi])

  async function hapus(s) {
    if (!window.confirm(`Hapus “${s.judul}”${s.jenis === 'serial' ? ' beserta semua episodenya' : ''}?`)) return
    try {
      await hapusPersonal(s)
      setPesan('')
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  return (
    <>
      <h1>Tulisan saya</h1>
      <div className="aksi">
        <Link to="/tulis" className="tombol utama">Tulis baru</Link>
        <Link to="/satua/personal">Kembali ke Satua</Link>
      </div>
      {pesan && <p className="redup">{pesan}</p>}
      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat: {error.message}</p>}
      {data && data.length === 0 && <p className="redup">Kamu belum menulis apa pun.</p>}
      {data && (
        <ul className="daftar">
          {data.map((s) => (
            <li key={s.id}>
              <span>
                {s.terbit ? <Link to={`/satua/${s.slug}`}>{s.judul}</Link> : s.judul}
                <small className="redup">
                  {' · '}{s.jenis === 'serial' ? 'Serial' : 'Cerpen'}
                  {' \u00b7 '}{s.terbit ? 'Terbit' : 'Draf'}{s.selesai ? ' \u00b7 Selesai' : ''}
                  {' · '}{formatTanggal(s.diperbarui_pada)}
                </small>
              </span>
              <span className="aksi">
                <Link to={`/tulis/${s.id}`}>Edit</Link>
                <button type="button" className="tombol" onClick={() => hapus(s)}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ---------- Menulis dan mengedit tulisan ----------
export function EditorTulisan() {
  const { id } = useParams()
  return (
    <PakaiSesi>
      {(userId) => <MuatTulisan key={id ?? 'baru'} id={id} userId={userId} />}
    </PakaiSesi>
  )
}

function MuatTulisan({ id, userId }) {
  const { data, memuat, error } = useAmbil(
    () => (id ? ambilSatuaById(id) : Promise.resolve(null)),
    [id],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat: {error.message}</p>
  if (id && !data) return <p>Tulisan tidak ditemukan.</p>
  if (id && data.penulis_id !== userId) return <p>Ini bukan tulisanmu.</p>

  return <FormTulisan awal={data} />
}

function FormTulisan({ awal }) {
  const navigate = useNavigate()
  const { data: kategoriAda } = useAmbil(ambilKategori, [])
  const [jenis, setJenis] = useState(awal?.jenis ?? 'cerpen')
  const [judul, setJudul] = useState(awal?.judul ?? '')
  const [kategori, setKategori] = useState(awal?.kategori ?? 'Umum')
  const [isi, setIsi] = useState(awal?.isi ?? '')
  const [thumbnail, setThumbnail] = useState(awal?.thumbnail_url ?? '')
  const [terbit, setTerbit] = useState(awal?.terbit ?? false)
  const [selesai, setSelesai] = useState(awal?.selesai ?? false)
  const [status, setStatus] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  async function pilihThumbnail(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('Mengunggah thumbnail…')
    try {
      setThumbnail(await unggahKarya(file))
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
      const idTulisan = await simpanPersonal({
        id: awal?.id,
        jenis,
        judul: judul.trim(),
        kategori: kategori.trim() || 'Umum',
        isi,
        thumbnail_url: thumbnail || null,
        terbit,
        selesai,
      })
      navigate(!awal && jenis === 'serial' ? `/tulis/${idTulisan}` : '/tulis/saya')
    } catch (err) {
      setStatus(`Gagal menyimpan: ${err.message}`)
      setMenyimpan(false)
    }
  }

  return (
    <>
      <h1>{awal ? 'Edit tulisan' : 'Tulis satua'}</h1>
      <form className="form" onSubmit={simpan}>
        {!awal ? (
          <div className="aksi" role="group" aria-label="Jenis tulisan">
            <button type="button" className="tombol" aria-pressed={jenis === 'cerpen'} onClick={() => setJenis('cerpen')}>
              Cerpen (satu halaman)
            </button>
            <button type="button" className="tombol" aria-pressed={jenis === 'serial'} onClick={() => setJenis('serial')}>
              Serial (berepisode)
            </button>
          </div>
        ) : (
          <p className="redup">Jenis: {awal.jenis === 'serial' ? 'Serial' : 'Cerpen'}</p>
        )}

        <label>
          Judul
          <input type="text" maxLength={150} value={judul} onChange={(e) => setJudul(e.target.value)} />
        </label>

        <label>
          Kategori
          <input
            type="text"
            maxLength={40}
            list="kategori-tulisan"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          />
          <datalist id="kategori-tulisan">
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
          <p className="redup">{jenis === 'serial' ? 'Sinopsis' : 'Isi cerita'}</p>
          <PenyuntingTeks nilaiAwal={awal?.isi ?? ''} onUbah={setIsi} unggah={unggahKarya} />
        </div>

        <label className="centang">
          <input
            type="checkbox"
            checked={terbit}
            onChange={(e) => {
              setTerbit(e.target.checked)
              if (!e.target.checked) setSelesai(false)
            }}
          />
          Terbitkan (tampil untuk semua orang)
        </label>

        <label className="centang">
          <input
            type="checkbox"
            checked={selesai}
            onChange={(e) => {
              setSelesai(e.target.checked)
              if (e.target.checked) setTerbit(true)
            }}
          />
          Satua ini selesai
        </label>
        <p className="redup kecil">
          Satua yang selesai otomatis diterbitkan dan tampil di Beranda.
          {jenis === 'serial' ? ' Untuk serial, centang setelah semua episode terbit.' : ''}
        </p>

        <div className="aksi">
          <button type="submit" className="tombol utama" disabled={menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className="tombol" onClick={() => navigate('/tulis/saya')}>
            Batal
          </button>
          {status && <span className="redup">{status}</span>}
        </div>
      </form>

      {awal?.jenis === 'serial' && <KelolaEpisode satuaId={awal.id} />}
    </>
  )
}

function KelolaEpisode({ satuaId }) {
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const { data, memuat, error } = useAmbil(() => ambilSemuaEpisode(satuaId), [satuaId, versi])

  async function hapus(e) {
    if (!window.confirm(`Hapus episode ${e.nomor}: “${e.judul}”?`)) return
    try {
      await hapusEpisode(e.id)
      setPesan('')
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  return (
    <section>
      <h2>Episode</h2>
      <p className="redup">Episode hanya tampil untuk pembaca kalau serialnya juga berstatus Terbit.</p>
      <div className="aksi">
        <Link to={`/tulis/${satuaId}/episode/baru`} className="tombol utama">Tambah episode</Link>
      </div>
      {pesan && <p className="redup">{pesan}</p>}
      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat episode.</p>}
      {data && data.length === 0 && <p className="redup">Belum ada episode.</p>}
      {data && (
        <ul className="daftar">
          {data.map((e) => (
            <li key={e.id}>
              <span>
                Episode {e.nomor}: {e.judul}
                <small className="redup"> · {e.terbit ? 'Terbit' : 'Draf'} · ▲ {e.skor} · {e.jumlah_komentar} komentar</small>
              </span>
              <span className="aksi">
                <Link to={`/tulis/${satuaId}/episode/${e.id}`}>Edit</Link>
                <button type="button" className="tombol" onClick={() => hapus(e)}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------- Menulis dan mengedit episode ----------
export function EditorEpisode() {
  const { id, episodeId } = useParams()
  return (
    <PakaiSesi>
      {(userId) => (
        <MuatEpisode
          key={`${id}-${episodeId ?? 'baru'}`}
          id={id}
          episodeId={episodeId}
          userId={userId}
        />
      )}
    </PakaiSesi>
  )
}

function MuatEpisode({ id, episodeId, userId }) {
  const { data, memuat, error } = useAmbil(
    async () => {
      const [induk, episode] = await Promise.all([
        ambilSatuaById(id),
        episodeId ? ambilEpisodeById(episodeId) : Promise.resolve(null),
      ])
      return { induk, episode }
    },
    [id, episodeId],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat: {error.message}</p>
  if (!data.induk || data.induk.penulis_id !== userId || data.induk.jenis !== 'serial') {
    return <p>Serial tidak ditemukan.</p>
  }
  if (episodeId && (!data.episode || data.episode.satua_id !== id)) {
    return <p>Episode tidak ditemukan.</p>
  }

  return <FormEpisode induk={data.induk} awal={data.episode} />
}

function FormEpisode({ induk, awal }) {
  const navigate = useNavigate()
  const [judul, setJudul] = useState(awal?.judul ?? '')
  const [isi, setIsi] = useState(awal?.isi ?? '')
  const [terbit, setTerbit] = useState(awal?.terbit ?? false)
  const [status, setStatus] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  async function simpan(e) {
    e.preventDefault()
    if (!judul.trim()) {
      setStatus('Judul episode wajib diisi.')
      return
    }
    setMenyimpan(true)
    setStatus('')
    try {
      await simpanEpisode({
        id: awal?.id,
        satua_id: induk.id,
        judul: judul.trim(),
        isi,
        terbit,
      })
      navigate(`/tulis/${induk.id}`)
    } catch (err) {
      setStatus(`Gagal menyimpan: ${err.message}`)
      setMenyimpan(false)
    }
  }

  return (
    <>
      <p><Link to={`/tulis/${induk.id}`}>← {induk.judul}</Link></p>
      <h1>{awal ? `Edit episode ${awal.nomor}` : 'Episode baru'}</h1>
      {!induk.terbit && (
        <p className="redup">Serial ini masih draf, jadi episodenya belum tampil untuk pembaca.</p>
      )}
      <form className="form" onSubmit={simpan}>
        <label>
          Judul episode
          <input type="text" maxLength={150} value={judul} onChange={(e) => setJudul(e.target.value)} />
        </label>

        <div>
          <p className="redup">Isi episode</p>
          <PenyuntingTeks nilaiAwal={awal?.isi ?? ''} onUbah={setIsi} unggah={unggahKarya} />
        </div>

        <label className="centang">
          <input type="checkbox" checked={terbit} onChange={(e) => setTerbit(e.target.checked)} />
          Terbitkan episode ini
        </label>

        <div className="aksi">
          <button type="submit" className="tombol utama" disabled={menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className="tombol" onClick={() => navigate(`/tulis/${induk.id}`)}>
            Batal
          </button>
          {status && <span className="redup">{status}</span>}
        </div>
      </form>
    </>
  )
}