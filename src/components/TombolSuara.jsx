import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { beriSuara } from '../lib/forum'

export default function TombolSuara({ jenis, id, skor, suaraAwal, userId }) {
  const [suara, setSuara] = useState(suaraAwal)
  const [nilaiSkor, setNilaiSkor] = useState(skor)
  const [sibuk, setSibuk] = useState(false)
  const navigate = useNavigate()

  async function pilih(nilai) {
    if (!userId) {
      navigate('/masuk')
      return
    }
    if (sibuk) return
    const baru = suara === nilai ? 0 : nilai
    const sebelum = { suara, nilaiSkor }
    setSibuk(true)
    setSuara(baru)
    setNilaiSkor(nilaiSkor + baru - suara)
    try {
      await beriSuara(jenis, id, userId, baru)
    } catch {
      setSuara(sebelum.suara)
      setNilaiSkor(sebelum.nilaiSkor)
    }
    setSibuk(false)
  }

  return (
    <div className="suara">
      <button type="button" aria-label="Upvote" aria-pressed={suara === 1} onClick={() => pilih(1)}>▲</button>
      <span className="skor">{nilaiSkor}</span>
      <button type="button" aria-label="Downvote" aria-pressed={suara === -1} onClick={() => pilih(-1)}>▼</button>
    </div>
  )
}