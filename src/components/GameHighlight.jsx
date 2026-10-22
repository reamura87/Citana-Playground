import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const NAMA_GAME = 'Citana World'

export default function GameHighlight() {
  const kanvasRef = useRef(null)

  useEffect(() => {
    let batal = false
    import('../game/gambar').then((g) => {
      if (batal || !kanvasRef.current) return
      g.gambarPratinjau(kanvasRef.current)
    })
    return () => {
      batal = true
    }
  }, [])

  return (
    <section className="game-sorotan" aria-labelledby="judul-game">
      <div>
        <p className="game-sorotan-label">Game</p>
        <h2 id="judul-game">{NAMA_GAME}</h2>
        <p>
          Alkisah ada orang jahat yang ingin menguasai dunia, kamu yang pengangguran diberi kesempatan
          untuk menjadi pahlawan, mulailah petualangan anda disini dan jangan kecewakan orang tua mu.
        </p>
        <ul>
          <li>Pertarungan klik-untuk-menebas dengan musuh yang berkeliaran</li>
          <li>Bos naga dengan HP bersama dan hadiah sesuai kontribusi</li>
          <li>Rumah pribadi, kebun, toko, dan level yang tersimpan di akunmu</li>
        </ul>
        <div className="aksi">
          <Link to="/game" className="tombol utama">Main sekarang</Link>
        </div>
        <p className="redup kecil">Perlu login. Progresmu tersimpan di akun.</p>
      </div>
      <canvas
        ref={kanvasRef}
        className="game-sorotan-gambar"
        width={480}
        height={270}
        role="img"
        aria-label="Pratinjau game: ksatria menghadapi naga di depan kastil"
      />
    </section>
  )
}