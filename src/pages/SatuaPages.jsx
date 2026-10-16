import { Link, useParams, useSearchParams } from 'react-router-dom'
import BarisKategori from '../components/BarisKategori'
import IsiCerita from '../components/IsiCerita'
import { useAmbil } from '../lib/useAmbil'
import {
  ambilSatua,
  ambilSatuaBySlug,
  formatTanggal,
  kelompokkan,
  teksPolos,
} from '../lib/satua'

export function SatuaList() {
  const [params] = useSearchParams()
  const { data, memuat, error } = useAmbil(ambilSatua, [])
  const kata = (params.get('q') ?? '').trim()
  const q = kata.toLowerCase()

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat cerita. Coba muat ulang halaman.</p>

  const hasil = q
    ? data.filter((s) =>
        `${s.judul} ${s.kategori} ${teksPolos(s.isi)}`.toLowerCase().includes(q),
      )
    : data
  const baris = kelompokkan(hasil)

  return (
    <>
      <h1>Satua</h1>
      {q && <p className="redup">{hasil.length} hasil untuk “{kata}”</p>}
      {baris.length === 0 && (
        <p className="redup">{q ? 'Tidak ada cerita yang cocok.' : 'Belum ada cerita.'}</p>
      )}
      {baris.map(([kategori, daftar]) => (
        <BarisKategori key={kategori} judul={kategori} daftar={daftar} />
      ))}
    </>
  )
}

export function SatuaDetail() {
  const { slug } = useParams()
  const { data: cerita, memuat, error } = useAmbil(() => ambilSatuaBySlug(slug), [slug])

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat cerita. Coba muat ulang halaman.</p>

  if (!cerita) {
    return (
      <>
        <p>Cerita tidak ditemukan.</p>
        <Link to="/satua">Kembali ke Satua</Link>
      </>
    )
  }

  return (
    <article>
      <Link to="/satua">Kembali ke Satua</Link>
      <h1>{cerita.judul}</h1>
      <p className="redup">
        {cerita.kategori} · {formatTanggal(cerita.diperbarui_pada)}
      </p>
      <IsiCerita html={cerita.isi} />
    </article>
  )
}