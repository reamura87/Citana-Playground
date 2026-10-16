import { Link } from 'react-router-dom'

export default function KartuSeniRupa({ data }) {
  return (
    <Link to={`/seni-rupa/${data.id}`} className="kartu kartu-seni">
      <div className="kartu-gambar">
        <img src={data.gambar_url} alt={data.nama} loading="lazy" />
      </div>
      <p className="kartu-jenis">Seni rupa · {data.kategori}</p>
      <h3 className="kartu-judul">{data.nama}</h3>
      <p className="kartu-meta">oleh {data.pembuat_nama}</p>
    </Link>
  )
}