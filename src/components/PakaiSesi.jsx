import { useSesi } from '../lib/useSesi'

export default function PakaiSesi({ children }) {
  const sesi = useSesi()
  if (sesi === undefined) return <p className="redup">Memuat…</p>
  return children(sesi?.user.id ?? null)
}