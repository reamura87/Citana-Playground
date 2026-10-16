import { Link } from 'react-router-dom'

export default function TabSatua({ aktif }) {
  return (
    <nav className="aksi" aria-label="Jenis satua">
      <Link to="/satua" className="tombol" aria-current={aktif === 'resmi' ? 'page' : undefined}>
        Resmi
      </Link>
      <Link to="/satua/personal" className="tombol" aria-current={aktif === 'personal' ? 'page' : undefined}>
        Personal
      </Link>
    </nav>
  )
}