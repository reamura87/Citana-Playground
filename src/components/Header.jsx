import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import MenuAkun from './MenuAkun'
import { useAuth } from '../lib/useSesi'

function IkonCari() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IkonTema({ gelap }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {gelap ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      ) : (
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
      )}
    </svg>
  )
}

export default function Header({ tema, onGantiTema }) {
  const [kata, setKata] = useState('')
  const navigate = useNavigate()
  const { profil } = useAuth()

  function cari(e) {
    e.preventDefault()
    const q = kata.trim()
    navigate(q ? `/cari?q=${encodeURIComponent(q)}` : '/cari')
    setKata('')
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          Citana<span className="brand-ekor"> Playground</span>
        </Link>

        <nav className="menu" aria-label="Menu utama">
          <NavLink to="/" end>Beranda</NavLink>
          <NavLink to="/satua">Satua</NavLink>
          <NavLink to="/seni-rupa">Seni rupa</NavLink>
          <NavLink to="/forum">Forum</NavLink>
          <NavLink to="/alat">Alat</NavLink>
          {profil?.peran === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="aksi-header">
          <form className="cari" role="search" onSubmit={cari}>
            <input
              type="search"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              placeholder="Cari"
              aria-label="Cari satua, karya, dan forum"
            />
            <button type="submit" className="ikon" aria-label="Cari">
              <IkonCari />
            </button>
          </form>

          <button
            type="button"
            className="ikon"
            onClick={onGantiTema}
            aria-label={tema === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            <IkonTema gelap={tema === 'dark'} />
          </button>

          <MenuAkun />
        </div>
      </div>
    </header>
  )
}