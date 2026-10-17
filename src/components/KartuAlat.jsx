import { Link } from 'react-router-dom'

export default function KartuAlat({ alat }) {
  return (
    <Link to={alat.path} className="kartu-alat">
      <strong>{alat.nama}</strong>
      <span className="redup">{alat.info}</span>
    </Link>
  )
}