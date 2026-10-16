import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

export default function Header({ tema, onGantiTema }) {
  const [kata, setKata] = useState('')
  const navigate = useNavigate()

  function cari(e) {
    e.preventDefault()
    const q = kata.trim()
    navigate(q ? `/satua?q=${encodeURIComponent(q)}` : '/satua')
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Citana Playground</Link>

        <nav>
          <NavLink to="/" end>Beranda</NavLink>
          <NavLink to="/satua">Satua</NavLink>
          <NavLink to="/seni-rupa">Seni rupa</NavLink>
          <NavLink to="/forum">Forum</NavLink>
          <form className="cari" role="search" onSubmit={cari}>
            <input
              type="search"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              placeholder="Cari"
              aria-label="Cari"
            />
          </form>

          <button
            type="button"
            className="tema"
            onClick={onGantiTema}
            aria-label={tema === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {tema === 'dark' ? 'Terang' : 'Gelap'}
          </button>
        </nav>
      </div>
    </header>
  )
}