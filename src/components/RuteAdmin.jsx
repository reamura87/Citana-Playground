import { Navigate } from 'react-router-dom'
import { ambilProfilSaya } from '../lib/forum'
import { useAmbil } from '../lib/useAmbil'
import { useSesi } from '../lib/useSesi'

export default function RuteAdmin({ children }) {
  const sesi = useSesi()
  if (sesi === undefined) return <p className="redup">Memuat…</p>
  if (!sesi) return <Navigate to="/masuk" replace />
  return <CekPeran userId={sesi.user.id}>{children}</CekPeran>
}

function CekPeran({ userId, children }) {
  const { data: profil, memuat } = useAmbil(() => ambilProfilSaya(userId), [userId])
  if (memuat) return <p className="redup">Memuat…</p>
  if (profil?.peran !== 'admin') return <p>Halaman ini hanya untuk admin.</p>
  return children
}