import { Navigate } from 'react-router-dom'
import { useSesi } from '../lib/useSesi'

export default function RuteMasuk({ children }) {
  const sesi = useSesi()
  if (sesi === undefined) return <p className="redup">Memuat…</p>
  if (!sesi) return <Navigate to="/masuk" replace />
  return children
}