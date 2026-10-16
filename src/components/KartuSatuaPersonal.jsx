import { Link } from 'react-router-dom'
import { formatTanggal } from '../lib/satua'

export default function KartuSatuaPersonal({ data }) {
  const tipe = data.jenisTulisan ?? data.jenis
  return (
    <Link to={`/satua/${data.slug}`} className="kartu">
      <div className="kartu-gambar">
        {data.thumbnail_url ? (
          <img src={data.thumbnail_url} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{data.judul.charAt(0)}</span>
        )}
      </div>
      <p className="kartu-jenis">
        {tipe === 'serial' ? 'Serial' : 'Cerpen'} · {data.kategori}
      </p>
      <h3 className="kartu-judul">{data.judul}</h3>
      <p className="kartu-meta">oleh {data.penulis_nama}</p>
      <time dateTime={data.diperbarui_pada}>{formatTanggal(data.diperbarui_pada)}</time>
    </Link>
  )
}