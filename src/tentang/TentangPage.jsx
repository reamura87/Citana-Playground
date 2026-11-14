import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PROFIL } from './data'
import './tentang.css'

function dukungWebGL2() {
  try {
    const k = document.createElement('canvas')
    const gl = k.getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

const SudutHias = () => (
  <>
    <span className="tentang-sudut s1" />
    <span className="tentang-sudut s2" />
    <span className="tentang-sudut s3" />
    <span className="tentang-sudut s4" />
  </>
)

export default function TentangPage() {
  const halamanRef = useRef(null)
  const kanvasRef = useRef(null)
  const adeganRef = useRef(null)
  const [mode, setMode] = useState(() => (dukungWebGL2() ? 'webgl' : 'statis'))

  // Adegan WebGL dimuat belakangan agar halaman lain tidak menanggung ukuran Three.js
  useEffect(() => {
    if (mode !== 'webgl') return
    let batal = false
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rendah = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4
    import('./adegan')
      .then(({ buatAdegan }) => {
        if (batal) return
        try {
          adeganRef.current = buatAdegan(kanvasRef.current, {
            urlFoto: PROFIL.foto,
            kurangGerak,
            rendah,
            halaman: halamanRef.current,
            onGagal: () => setMode('statis'),
          })
        } catch {
          setMode('statis')
        }
      })
      .catch(() => setMode('statis'))
    return () => {
      batal = true
      adeganRef.current?.hancurkan()
      adeganRef.current = null
    }
  }, [mode])

  // Tinggi isi berubah (font selesai dimuat, layar diputar): sesuaikan jumlah sulur latar
  useEffect(() => {
    const el = halamanRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let timer
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => adeganRef.current?.ukur(), 150)
    })
    ro.observe(el)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
    }
  }, [])

  // Panel muncul perlahan saat digulir
  useEffect(() => {
    const el = halamanRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const daftar = el.querySelectorAll('[data-muncul]')
    el.classList.add('siap-muncul')
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (e.isIntersecting) {
            e.target.classList.add('terlihat')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    daftar.forEach((d) => io.observe(d))
    return () => io.disconnect()
  }, [])

  return (
    <main
      className="tentang"
      ref={halamanRef}
      style={mode === 'statis' ? { '--foto-bawah': 'calc(44dvh + min(190px, 39vw))' } : undefined}
    >
      <div className="tentang-latar">
        {mode === 'webgl' ? (
          <canvas ref={kanvasRef} className="tentang-kanvas" role="img" aria-label={PROFIL.fotoAlt} />
        ) : (
          <div className="tentang-statis">
            <div className="tentang-foto-statis">
              <img src={PROFIL.foto} alt={PROFIL.fotoAlt} />
            </div>
          </div>
        )}
        <SudutHias />
      </div>

      <div className="tentang-isi">
        <header className="tentang-hero">
          <p className="tentang-salam">
            <span>{PROFIL.salam}</span>
          </p>
          <div className="tentang-nama">
            <div className="tentang-papan">
              <h1>{PROFIL.nama}</h1>
              <p>{PROFIL.peran}</p>
              <p className="kecil">{PROFIL.tempat}</p>
            </div>
          </div>
          <a className="tentang-gulir" href="#tentang-saya">
            Gulir
          </a>
        </header>

        <section id="tentang-saya" className="tentang-panel" data-muncul>
          <h2>Tentang saya</h2>
          {PROFIL.tentang.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </section>

        <section className="tentang-panel" data-muncul>
          <h2>Keahlian</h2>
          <ul className="tentang-chip-daftar">
            {PROFIL.keahlian.map((k) => (
              <li key={k} className="tentang-chip">
                {k}
              </li>
            ))}
          </ul>
        </section>

        <section className="tentang-panel" data-muncul>
          <h2>Karya</h2>
          <div className="tentang-kartu-daftar">
            {PROFIL.karya.map((k) => (
              <Link key={k.judul} to={k.tautan} className="tentang-kartu">
                <h3>{k.judul}</h3>
                <p>{k.teks}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="tentang-panel" data-muncul>
          <h2>Kontak</h2>
          <p>Mau berkolaborasi atau sekadar menyapa? Silakan hubungi aku.</p>
          <ul className="tentang-kontak">
            {PROFIL.kontak.map((k) => (
              <li key={k.label}>
                <a href={k.href} target={k.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {k.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="tentang-catatan">Pepatraan terinspirasi lukisan wayang Kamasan, Klungkung. Digambar dengan WebGL.</p>
      </div>
    </main>
  )
}
