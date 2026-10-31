import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { restartAkunGame } from '../lib/gameAPI'

export default function DialogRestartGame({ username, onTutup }) {
  const [ketik, setKetik] = useState('')
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState('')
  const [selesai, setSelesai] = useState(false)
  const kolom = useRef(null)
  const navigate = useNavigate()
  const cocok = ketik === username

  useEffect(() => {
    kolom.current?.focus()
  }, [])

  useEffect(() => {
    function tekan(e) {
      if (e.key === 'Escape' && !proses) onTutup()
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [onTutup, proses])

  async function restart(e) {
    e.preventDefault()
    if (!cocok || proses) return
    setProses(true)
    setGalat('')
    try {
      await restartAkunGame(ketik)
      setSelesai(true)
    } catch (err) {
      setGalat(err.message)
    }
    setProses(false)
  }

  return createPortal(
    <div
      className="dialog-latar"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !proses) onTutup()
      }}
    >
      <div className="dialog-kotak" role="dialog" aria-modal="true" aria-labelledby="judul-restart">
        {selesai ? (
          <>
            <h2 id="judul-restart">Akun game direset</h2>
            <p>Progres game akunmu sudah dihapus. Buka halaman Game untuk membuat karakter baru dan memilih role lagi.</p>
            <div className="aksi">
              <button
                type="button"
                className="tombol"
                onClick={() => {
                  onTutup()
                  navigate('/game')
                }}
              >
                Buat karakter baru
              </button>
              <button type="button" className="tombol" onClick={onTutup}>Tutup</button>
            </div>
          </>
        ) : (
          <form onSubmit={restart}>
            <h2 id="judul-restart">Restart Akun Game</h2>
            <p>
              Ini akan <strong>menghapus seluruh progres game</strong> akunmu secara permanen: karakter dan role, level,
              gold, inventaris, rumah dan kebun, serta misi harian. Forum, satua, dan seni rupamu tidak terpengaruh.
              Setelah restart, kamu membuat karakter dan memilih role dari awal. Tindakan ini tidak bisa dibatalkan.
            </p>
            <label htmlFor="ketik-username">
              Untuk melanjutkan, ketik <strong>{username}</strong> di bawah ini:
            </label>
            <input
              id="ketik-username"
              ref={kolom}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={ketik}
              onChange={(e) => setKetik(e.target.value)}
            />
            {galat && <p role="alert">{galat}</p>}
            <div className="aksi">
              <button type="submit" className="tombol tombol-bahaya" disabled={!cocok || proses}>
                {proses ? 'Memproses…' : 'Saya mengerti, restart akun game saya'}
              </button>
              <button type="button" className="tombol" onClick={onTutup} disabled={proses}>
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}