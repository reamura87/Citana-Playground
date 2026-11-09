import { useEffect, useRef, useState } from 'react'

const DIAM = { kiri: false, kanan: false, atas: false, bawah: false }

function Dpad({ onArah }) {
  const ref = useRef(null)
  const aktif = useRef(false)

  function hitung(e) {
    const kotak = ref.current.getBoundingClientRect()
    const dx = e.clientX - (kotak.left + kotak.width / 2)
    const dy = e.clientY - (kotak.top + kotak.height / 2)
    const jarak = Math.hypot(dx, dy)
    if (jarak < kotak.width * 0.1) {
      onArah(DIAM)
      return
    }
    onArah({
      kiri: dx < 0 && Math.abs(dx) / jarak > 0.38,
      kanan: dx > 0 && Math.abs(dx) / jarak > 0.38,
      atas: dy < 0 && Math.abs(dy) / jarak > 0.38,
      bawah: dy > 0 && Math.abs(dy) / jarak > 0.38,
    })
  }

  function lepas() {
    aktif.current = false
    onArah(DIAM)
  }

  return (
    <div
      ref={ref}
      className="gb-dpad"
      role="group"
      aria-label="Tombol arah"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        aktif.current = true
        hitung(e)
      }}
      onPointerMove={(e) => {
        if (aktif.current) hitung(e)
      }}
      onPointerUp={lepas}
      onPointerCancel={lepas}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="gb-panah gb-atas">▲</span>
      <span className="gb-panah gb-kiri">◀</span>
      <span className="gb-panah gb-kanan">▶</span>
      <span className="gb-panah gb-bawah">▼</span>
    </div>
  )
}

function TombolGB({ label, nama, kelas, onTekan, ulang = false }) {
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  function henti() {
    clearInterval(timer.current)
    timer.current = null
  }

  return (
    <button
      type="button"
      className={`gb-aksi ${kelas}`}
      aria-label={nama}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        onTekan()
        if (ulang) {
          clearInterval(timer.current)
          timer.current = setInterval(onTekan, 130) // tahan untuk menyerang berulang
        }
      }}
      onPointerUp={henti}
      onPointerCancel={henti}
      onContextMenu={(e) => e.preventDefault()}
    >
      <strong>{label}</strong>
      <small>{nama}</small>
    </button>
  )
}

function TombolSkill({ s, onSkill }) {
  const [sisa, setSisa] = useState(0)

  useEffect(() => {
    if (!s.ada) return
    const t = setInterval(() => setSisa(Math.max(0, s.akhir - Date.now())), 200)
    return () => clearInterval(t)
  }, [s.ada, s.akhir])

  const persen = s.ada && sisa > 0 ? Math.min(100, (sisa / s.total) * 100) : 0
  return (
    <button
      type="button"
      className={`gb-skill${s.ada ? '' : ' kosong'}`}
      disabled={!s.ada}
      aria-label={s.ada ? s.nama : `Slot skill ${s.slot} kosong`}
      onPointerDown={(e) => {
        if (!s.ada) return
        e.preventDefault()
        onSkill(s.slot)
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="gb-skill-kunci">{s.slot}</span>
      {s.ada && <img src={s.ikon} alt="" />}
      {persen > 0 && <span className="gb-skill-cd" style={{ height: `${persen}%` }} />}
      {persen > 0 && <strong className="gb-skill-detik">{Math.ceil(sisa / 1000)}</strong>}
    </button>
  )
}

export default function KontrolGB({ onArah, onSerang, onAksi, onMenu, onObrol, belumBaca = 0, skill = [], onSkill }) {
  const slot = [1, 2, 3, 4].map((n) => skill[n - 1] ?? { slot: n, ada: false })
  return (
    <div className="game-kontrol gb-kontrol" aria-label="Kontrol layar sentuh">
      <button type="button" className="gb-pil gb-obrol" onClick={onObrol}>
        CHAT{belumBaca > 0 ? ` (${belumBaca})` : ''}
      </button>
      <button type="button" className="gb-pil gb-mulai" onClick={onMenu}>
        MENU
      </button>
      <Dpad onArah={onArah} />
      <div className="gb-tombol">
        <TombolGB label="B" nama="Aksi" kelas="gb-b" onTekan={onAksi} />
        <TombolGB label="A" nama="Serang" kelas="gb-a" onTekan={onSerang} ulang />
      </div>
      <div className="gb-skillbar" role="group" aria-label="Skill">
        {slot.map((s) => (
          <TombolSkill key={s.slot} s={s} onSkill={onSkill} />
        ))}
      </div>
    </div>
  )
}