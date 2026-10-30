import { Link } from 'react-router-dom'
import { ambilSatuaSelesai } from '../lib/personal'
import { useAmbil } from '../lib/useAmbil'

export default function SatuaSelesai() {
  const { data, memuat, error } = useAmbil(() => ambilSatuaSelesai(5), [])

  return (
    <aside className="aside-selesai" aria-labelledby="judul-selesai">
      <h2 id="judul-selesai">Satua yang sudah selesai</h2>
      {memuat && <p className="redup kecil">Memuat…</p>}
      {error && <p className="redup kecil">Gagal memuat daftar.</p>}
      {data && data.length === 0 && (
        <p className="redup kecil">
          Belum ada satua yang ditandai selesai. <Link to="/tulis">Tulis satuamu</Link> lalu centang
          “Satua ini selesai”.
        </p>
      )}
      {data && data.length > 0 && (
        <ul>
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/satua/${s.slug}`} className="aside-selesai-baris">
                <span className="aside-selesai-gambar" aria-hidden="true">
                  {s.thumbnail_url ? (
                    <img src={s.thumbnail_url} alt="" loading="lazy" />
                  ) : (
                    <span>{s.judul.charAt(0)}</span>
                  )}
                </span>
                <span className="aside-selesai-teks">
                  <strong>{s.judul}</strong>
                  <small className="redup">
                    {s.jenis === 'serial' ? 'Serial' : 'Cerpen'} · {s.penulis_nama}
                  </small>
                  <small className="redup">▲ {s.skor}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/satua/personal" className="aside-selesai-semua">Lihat semua satua personal →</Link>
    </aside>
  )
}