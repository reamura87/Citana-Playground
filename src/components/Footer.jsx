import { Link } from 'react-router-dom'
export default function Footer() {
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
            {' · '}
            <Link to="/masuk">Masuk</Link>
        </p>
      </div>
    </footer>
  )
}