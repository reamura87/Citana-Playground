import { useEffect, useRef } from 'react'
import { LEBAR, TINGGI, gambarAsisten, gambarPartikel, zonaDari } from './seniAsisten'

const MULUT_BICARA = ['buka', 'senyum', 'lebar', 'senyum']

function lahirkan(jenis) {
  const daftar = []
  if (jenis === 'hati') {
    for (let i = 0; i < 4; i += 1) {
      daftar.push({
        jenis: 'hati',
        x: 52 + Math.random() * 56,
        y: 30 + Math.random() * 16,
        vx: (Math.random() - 0.5) * 8,
        vy: -(12 + Math.random() * 10),
        umur: -i * 0.12,
        maks: 1.3 + Math.random() * 0.4,
      })
    }
  } else if (jenis === 'bintang') {
    for (let i = 0; i < 3; i += 1) {
      daftar.push({ jenis: 'bintang', x: 56 + Math.random() * 48, y: 34 + Math.random() * 30, vx: 0, vy: -4, umur: -i * 0.1, maks: 0.9 })
    }
  } else if (jenis === 'marah') {
    daftar.push({ jenis: 'marah', x: 104, y: 20, vx: 0, vy: 0, umur: 0, maks: 1.8 })
  }
  return daftar
}

// Karakter asisten: animasi napas, kedip, mulut bicara, dan reaksi sentuh (colek / elus).
export default function Karakter({ ekspresi = 'netral', bicara = false, efek = null, onSentuh, label = 'Karakter asisten' }) {
  const kanvasRef = useRef(null)
  const stat = useRef({ ekspresi, bicara, partikel: [], kedipBerikut: 1.5, kedipSampai: 0 })
  const geser = useRef(null)
  const sentuhRef = useRef(onSentuh)

  useEffect(() => {
    stat.current.ekspresi = ekspresi
    stat.current.bicara = bicara
    sentuhRef.current = onSentuh
  })

  useEffect(() => {
    if (efek?.jenis) stat.current.partikel.push(...lahirkan(efek.jenis))
  }, [efek])

  useEffect(() => {
    const ctx = kanvasRef.current.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingEnabled = false
    const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mulai = performance.now()
    let id = 0
    let terakhir = 0
    function loop(now) {
      id = requestAnimationFrame(loop)
      if (document.hidden || now - terakhir < 80) return
      const dt = Math.min(0.25, (now - terakhir) / 1000)
      terakhir = now
      const s = stat.current
      const t = kurangGerak ? 0.5 : (now - mulai) / 1000
      if (!kurangGerak && t > s.kedipBerikut) {
        s.kedipSampai = t + 0.14
        s.kedipBerikut = t + 2.5 + Math.random() * 3
      }
      const mulut = s.bicara && !kurangGerak ? MULUT_BICARA[Math.floor(t * 9) % 4] : null
      gambarAsisten(ctx, { ekspresi: s.ekspresi, t, kedip: t < s.kedipSampai, mulut })
      s.partikel = s.partikel.filter((q) => {
        q.umur += dt
        if (q.umur >= 0) {
          q.x += q.vx * dt
          q.y += q.vy * dt
        }
        return q.umur < q.maks
      })
      gambarPartikel(ctx, s.partikel.filter((q) => q.umur >= 0))
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  function titik(e) {
    const r = kanvasRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * LEBAR, y: ((e.clientY - r.top) / r.height) * TINGGI }
  }

  function turun(e) {
    const p = titik(e)
    geser.current = { x: p.x, y: p.y, jarak: 0, elus: false, zona: zonaDari(p.x, p.y), terakhirElus: 0 }
    kanvasRef.current.setPointerCapture?.(e.pointerId)
  }

  function gerak(e) {
    const g = geser.current
    if (!g) return
    const p = titik(e)
    g.jarak += Math.hypot(p.x - g.x, p.y - g.y)
    g.x = p.x
    g.y = p.y
    const zona = zonaDari(p.x, p.y)
    if (g.jarak > 50 && (zona === 'kepala' || zona === 'rambut') && performance.now() - g.terakhirElus > 900) {
      g.elus = true
      g.terakhirElus = performance.now()
      g.jarak = 0
      sentuhRef.current?.(zona, 'elus')
    }
  }

  function naik() {
    const g = geser.current
    geser.current = null
    if (g && !g.elus && g.jarak < 8 && g.zona) sentuhRef.current?.(g.zona, 'colek')
  }

  return (
    <canvas
      ref={kanvasRef}
      className="asisten-karakter"
      width={LEBAR}
      height={TINGGI}
      role="img"
      aria-label={`${label}. Klik atau geser di kepala untuk berinteraksi.`}
      onPointerDown={turun}
      onPointerMove={gerak}
      onPointerUp={naik}
      onPointerCancel={() => {
        geser.current = null
      }}
    />
  )
}

// Potongan wajah untuk tombol pembuka
export function Avatar() {
  const ref = useRef(null)
  useEffect(() => {
    const asal = document.createElement('canvas')
    asal.width = LEBAR
    asal.height = TINGGI
    gambarAsisten(asal.getContext('2d', { willReadFrequently: true }), { ekspresi: 'netral', t: 0.5 })
    const ctx = ref.current.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(asal, 38, 10, 84, 84, 0, 0, 84, 84)
  }, [])
  return <canvas ref={ref} width={84} height={84} aria-hidden="true" />
}
