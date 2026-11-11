import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { tanyaAsisten } from '../lib/asisten'
import Karakter, { Avatar } from './Karakter'
import { HALAMAN } from './halaman'
import { NAMA_ASISTEN } from './persona'
import { bikinPerasaan, reaksiSentuh } from './reaksi'
import { uraiBalasan } from './urai'
import './asisten.css'

const SAPA = `Halo! Aku ${NAMA_ASISTEN}, asisten Citana Playground. Mau kujelaskan isi situs ini, atau ngobrol santai aja? Oh iya, kamu boleh colek atau elus kepalaku... tapi jangan keterlaluan, ya.`
const USULAN = ['Apa saja yang ada di situs ini?', 'Gimana cara main game-nya?', 'Ceritain lelucon dong!']

export default function AsistenWidget() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [buka, setBuka] = useState(false)
  const [masuk, setMasuk] = useState(false)
  const [pesan, setPesan] = useState([{ id: 0, peran: 'asisten', teks: SAPA, ekspresi: 'senang', buka: [], lokal: true }])
  const [input, setInput] = useState('')
  const [mengetik, setMengetik] = useState(false)
  const [dasar, setDasar] = useState('netral')
  const [reaksi, setReaksi] = useState(null)
  const [gelembung, setGelembung] = useState(null)
  const [efek, setEfek] = useState(null)
  const [sisa, setSisa] = useState(null)
  const idRef = useRef(1)
  const perasaan = useRef(bikinPerasaan())
  const timerReaksi = useRef(null)
  const timerDasar = useRef(null)
  const batal = useRef(null)
  const logRef = useRef(null)
  const inputRef = useRef(null)

  // Status login
  useEffect(() => {
    let aktif = true
    supabase.auth.getSession().then(({ data }) => {
      if (aktif) setMasuk(Boolean(data.session))
    })
    const { data } = supabase.auth.onAuthStateChange((_e, sesi) => setMasuk(Boolean(sesi)))
    return () => {
      aktif = false
      data.subscription.unsubscribe()
    }
  }, [])

  // Gulir otomatis ke pesan terbaru
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [pesan, buka])

  // Fokus ke kolom ketik (tidak di layar sentuh, agar papan ketik tidak langsung menutupi)
  useEffect(() => {
    if (!buka || !masuk || window.matchMedia('(pointer: coarse)').matches) return
    inputRef.current?.focus()
  }, [buka, masuk])

  // Esc menutup panel
  useEffect(() => {
    if (!buka) return
    function tekan(e) {
      if (e.key === 'Escape') setBuka(false)
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [buka])

  useEffect(
    () => () => {
      clearTimeout(timerReaksi.current)
      clearTimeout(timerDasar.current)
      batal.current?.abort()
    },
    [],
  )

  function saatSentuh(zona, jenis) {
    const r = reaksiSentuh(perasaan.current, zona, jenis)
    if (!r) return
    setReaksi(r.ekspresi)
    setGelembung(r.teks)
    if (r.partikel) setEfek({ id: Date.now() + Math.random(), jenis: r.partikel })
    clearTimeout(timerReaksi.current)
    timerReaksi.current = setTimeout(() => {
      setReaksi(null)
      setGelembung(null)
    }, r.durasi)
  }

  async function kirim(teks) {
    const isi = teks.trim().slice(0, 500)
    if (!isi || mengetik || !masuk) return
    const idU = idRef.current++
    const idA = idRef.current++
    const riwayat = [...pesan.filter((m) => !m.lokal), { id: idU, peran: 'user', teks: isi }]
    setPesan((p) => [
      ...p,
      { id: idU, peran: 'user', teks: isi },
      { id: idA, peran: 'asisten', teks: '', ekspresi: null, buka: [], mentah: '' },
    ])
    setInput('')
    setMengetik(true)
    clearTimeout(timerDasar.current)
    const kendali = new AbortController()
    batal.current = kendali
    try {
      const hasil = await tanyaAsisten(
        riwayat.map((m) => ({ role: m.peran === 'user' ? 'user' : 'assistant', content: m.mentah ?? m.teks })),
        (mentah) => {
          const h = uraiBalasan(mentah)
          setPesan((p) => p.map((m) => (m.id === idA ? { ...m, teks: h.teks, ekspresi: h.ekspresi, buka: h.buka, mentah } : m)))
          if (h.ekspresi) setDasar(h.ekspresi)
        },
        kendali.signal,
      )
      if (hasil.sisa !== null) setSisa(hasil.sisa)
      if (!hasil.teks.trim()) throw new Error('Jawabannya kosong. Coba tanya lagi ya.')
    } catch (err) {
      if (err.name === 'AbortError') return
      setPesan((p) =>
        p.map((m) =>
          m.id === idA ? { ...m, teks: err.message || 'Maaf, aku sedang bermasalah.', ekspresi: 'sedih', buka: [], mentah: '' } : m,
        ),
      )
      setDasar('sedih')
    } finally {
      setMengetik(false)
      timerDasar.current = setTimeout(() => setDasar('netral'), 7000)
    }
  }

  function bukaHalaman(path) {
    navigate(path)
    if (window.matchMedia('(max-width: 720px)').matches) setBuka(false)
  }

  // Tidak tampil di halaman game agar tidak menutupi layar dan kontrol
  if (pathname.startsWith('/game')) return null

  const terakhir = pesan[pesan.length - 1]
  const adaTeks = terakhir?.peran === 'asisten' && !terakhir.lokal && terakhir.teks.length > 0
  const efektif = reaksi ?? (mengetik && !adaTeks ? 'berpikir' : dasar)
  const bicara = mengetik && adaTeks
  const namaHalaman = (path) => HALAMAN.find((h) => h.path === path)?.nama ?? path

  if (!buka) {
    return (
      <button type="button" className="asisten-peluncur" onClick={() => setBuka(true)} aria-label={`Buka obrolan dengan ${NAMA_ASISTEN}`}>
        <Avatar />
      </button>
    )
  }

  return (
    <section className="asisten-panel" role="dialog" aria-label={`Obrolan dengan ${NAMA_ASISTEN}`}>
      <header className="asisten-kepala">
        <div>
          <strong>{NAMA_ASISTEN}</strong>
          <span>asisten Citana Playground</span>
        </div>
        <button type="button" onClick={() => setBuka(false)} aria-label="Tutup obrolan">
          ×
        </button>
      </header>
      <div className="asisten-isi">
        <div className="asisten-panggung">
          {gelembung && (
            <div className="asisten-gelembung" role="status">
              {gelembung}
            </div>
          )}
          <Karakter ekspresi={efektif} bicara={bicara} efek={efek} onSentuh={saatSentuh} label={NAMA_ASISTEN} />
        </div>
        <div className="asisten-obrolan">
          <div className="asisten-log" ref={logRef} aria-live="polite">
            {pesan.map((m) =>
              m.peran === 'user' ? (
                <p key={m.id} className="asisten-pesan user">
                  {m.teks}
                </p>
              ) : (
                <div key={m.id} className="asisten-balasan">
                  <p className="asisten-pesan">{m.teks || '...'}</p>
                  {m.buka.length > 0 && (
                    <div className="asisten-tautan">
                      {m.buka.map((path) => (
                        <button key={path} type="button" onClick={() => bukaHalaman(path)}>
                          Buka {namaHalaman(path)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {!masuk && (
              <div className="asisten-catatan">
                <p>Masuk dulu supaya kita bisa ngobrol. Kalau cuma mau main-main, kamu tetap boleh colek aku di atas.</p>
                <button type="button" onClick={() => bukaHalaman('/masuk')}>
                  Masuk atau daftar
                </button>
              </div>
            )}
          </div>
          {masuk && pesan.length === 1 && !mengetik && (
            <div className="asisten-usulan">
              {USULAN.map((u) => (
                <button key={u} type="button" onClick={() => kirim(u)}>
                  {u}
                </button>
              ))}
            </div>
          )}
          <form
            className="asisten-form"
            onSubmit={(e) => {
              e.preventDefault()
              kirim(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder={masuk ? `Tanya atau ngobrol dengan ${NAMA_ASISTEN}...` : 'Masuk dulu untuk ngobrol'}
              disabled={!masuk}
              aria-label="Pesan untuk asisten"
              autoComplete="off"
            />
            <button type="submit" disabled={!masuk || mengetik || !input.trim()}>
              Kirim
            </button>
          </form>
          <small className="asisten-info">
            {sisa !== null ? `Sisa obrolan hari ini: ${sisa}. ` : ''}AI bisa keliru. Jangan bagikan data pribadi.
          </small>
        </div>
      </div>
    </section>
  )
}
