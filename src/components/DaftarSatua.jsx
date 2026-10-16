import { Link } from 'react-router-dom'
import { formatTanggal } from '../lib/satua'

export default function DaftarSatua({ daftar, kosong = 'Belum ada cerita.' }) {
  if (daftar.length === 0) return <p className="redup">{kosong}</p>

  return (
    <ul className="daftar">
      {daftar.map((s) => (
        <li key={s.slug}>
          <Link to={`/satua/${s.slug}`}>{s.judul}</Link>
          <time dateTime={s.tanggal}>{formatTanggal(s.tanggal)}</time>
        </li>
      ))}
    </ul>
  )
}