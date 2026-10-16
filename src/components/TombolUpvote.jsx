import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aturUpvote } from '../lib/personal'

export default function TombolUpvote({ jenis, id, skor, sudahAwal, userId, milikSendiri }) {
  const [aktif, setAktif] = useState(sudahAwal)
  const [jumlah, setJumlah] = useState(skor)
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState('')
  const navigate = useNavigate()

  async function klik() {
    if (!userId) {
      navigate('/masuk')
      return
    }
    if (sibuk) return
    const baru = !aktif
    setSibuk(true)
    setPesan('')
    setAktif(baru)
    setJumlah((n) => n + (baru ? 1 : -1))
    try {
      await aturUpvote(jenis, id, userId, baru)
    } catch {
      setAktif(!baru)
      setJumlah((n) => n + (baru ? -1 : 1))
      setPesan('Gagal memberi upvote.')
    }
    setSibuk(false)
  }

  return (
    <div className="upvote">
      <button
        type="button"
        className="tombol"
        aria-pressed={aktif}
        disabled={milikSendiri}
        title={milikSendiri ? 'Kamu tidak bisa upvote tulisanmu sendiri' : undefined}
        onClick={klik}
      >
        ▲ Upvote · {jumlah}
      </button>
      {pesan && <span className="redup kecil">{pesan}</span>}
    </div>
  )
}