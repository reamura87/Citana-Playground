import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useSesi'

export default function Footer() {
  const { sesi, profil } = useAuth()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>
          Kontak: <a href="mailto:satriabagas13520@gmail.com">satriabagas13520@gmail.com</a>
          {' · '}
          <a href="https://github.com/reamura87" target="_blank" rel="noreferrer">GitHub</a>
        </p>
        <p>
          © {new Date().getFullYear()} Citana Playground
          {sesi === null && (
            <>
              {' · '}
              <Link to="/masuk">Masuk</Link>
            </>
          )}
          {sesi && (
            <>
              {' · '}Masuk sebagai {profil?.username ?? '…'}
              {profil?.peran === 'admin' ? ' (admin)' : ''}
            </>
          )}
        </p>
      </div>
    </footer>
  )
}