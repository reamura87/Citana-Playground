import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { gantiAvatar } from '../lib/avatar'
import { ambilAvatar, formatWaktu } from '../lib/forum'
import { ambilNotifikasi, tandaiDibaca, tandaiSemuaDibaca } from '../lib/notifikasi'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useSesi'
import { useNotifikasi } from '../lib/useNotifikasi'

const TEKS_NOTIF = {
  balas: 'membalas komentarmu',
  balasan: 'membalas tweetmu',
  sebut: 'menyebutmu',
}

export default function MenuAkun() {
  const { sesi } = useAuth()
  if (sesi === undefined) return null
  if (!sesi) return <Link to="/masuk" className="tombol kecil">Masuk</Link>
  return <AkunMasuk key={sesi.user.id} userId={sesi.user.id} />
}

function AkunMasuk({ userId }) {
  const navigate = useNavigate()
  const { profil, memuatProfil, segarkanProfil } = useAuth()
  const { jumlah, segarkan } = useNotifikasi(userId)
  const [buka, setBuka] = useState(false)
  const [pesan, setPesan] = useState('')
  const [mengunggah, setMengunggah] = useState(false)
  const [notif, setNotif] = useState(null) // null = belum dimuat
  const wadah = useRef(null)
  const inputFoto = useRef(null)

  useEffect(() => {
    if (!buka) return
    function klikLuar(e) {
      if (wadah.current && !wadah.current.contains(e.target)) setBuka(false)
    }
    function tekanTombol(e) {
      if (e.key === 'Escape') setBuka(false)
    }
    document.addEventListener('pointerdown', klikLuar)
    document.addEventListener('keydown', tekanTombol)
    return () => {
      document.removeEventListener('pointerdown', klikLuar)
      document.removeEventListener('keydown', tekanTombol)
    }
  }, [buka])

  // Muat notifikasi setiap kartu dibuka
  useEffect(() => {
    if (!buka) return
    let batal = false
    ambilNotifikasi(8)
      .then(async (daftar) => {
        const avatar = await ambilAvatar(daftar.map((n) => n.pelaku_id))
        if (!batal) setNotif({ daftar, avatar })
      })
      .catch(() => {
        if (!batal) setNotif({ daftar: [], avatar: {} })
      })
      .finally(() => {
        if (!batal) segarkan()
      })
    return () => {
      batal = true
    }
  }, [buka, segarkan])

  async function pilihFoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMengunggah(true)
    setPesan('')
    try {
      await gantiAvatar(file, userId, profil?.avatar_url)
      await segarkanProfil()
    } catch (err) {
      setPesan(`Gagal mengganti foto: ${err.message}`)
    }
    setMengunggah(false)
  }

  async function bukaNotif(n) {
    setBuka(false)
    try {
      if (!n.dibaca) {
        await tandaiDibaca(n.id)
        segarkan()
      }
    } catch {
      // tetap lanjut ke halaman tujuan
    }
    navigate(`/forum/${n.post_id}${n.balasan_id ? `#balasan-${n.balasan_id}` : ''}`)
  }

  async function tandaiSemua() {
    try {
      await tandaiSemuaDibaca()
      setNotif((n) => n && { ...n, daftar: n.daftar.map((x) => ({ ...x, dibaca: true })) })
      segarkan()
    } catch {
      setPesan('Gagal menandai notifikasi.')
    }
  }

  async function keluar() {
    setBuka(false)
    await supabase.auth.signOut()
  }

  return (
    <div className="akun-menu" ref={wadah}>
      <button
        type="button"
        className="avatar-tombol"
        aria-label={jumlah > 0 ? `Menu akun, ${jumlah} notifikasi baru` : 'Menu akun'}
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
      >
        <Avatar profil={profil} ukuran={32} />
        {jumlah > 0 && <span className="titik-notif" aria-hidden="true" />}
      </button>

      {buka && (
        <div className="kartu-akun">
          <div className="akun-profil">
            <Avatar profil={profil} ukuran={64} />
            <p className="akun-username">
              {memuatProfil ? '…' : (profil?.username ?? 'akunmu')}
            </p>
            {profil && (
              <span className={`lencana ${profil.peran}`}>
                {profil.peran === 'admin' ? 'Admin' : 'Anggota'}
              </span>
            )}
            <button
              type="button"
              className="tautan-tombol"
              disabled={mengunggah}
              onClick={() => inputFoto.current?.click()}
            >
              {mengunggah ? 'Mengunggah…' : 'Ganti foto'}
            </button>
            <input ref={inputFoto} type="file" accept="image/*" hidden onChange={pilihFoto} />
            {pesan && <p className="redup kecil">{pesan}</p>}
          </div>

          <div className="notif">
            <div className="notif-kepala">
              <strong>Notifikasi{jumlah > 0 ? ` (${jumlah})` : ''}</strong>
              {jumlah > 0 && (
                <button type="button" className="tautan-tombol" onClick={tandaiSemua}>
                  Tandai dibaca
                </button>
              )}
            </div>
            {notif === null && <p className="redup kecil">Memuat…</p>}
            {notif && notif.daftar.length === 0 && (
              <p className="redup kecil">Belum ada notifikasi.</p>
            )}
            {notif && notif.daftar.length > 0 && (
              <ul className="notif-daftar">
                {notif.daftar.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`notif-item${n.dibaca ? '' : ' baru'}`}
                      onClick={() => bukaNotif(n)}
                    >
                      <Avatar
                        profil={{ username: n.pelaku_nama, avatar_url: notif.avatar[n.pelaku_id] }}
                        ukuran={28}
                      />
                      <span className="notif-teks">
                        <span><strong>{n.pelaku_nama}</strong> {TEKS_NOTIF[n.jenis]}</span>
                        <span className="redup kecil">“{n.cuplikan}”</span>
                        <span className="redup kecil">{formatWaktu(n.dibuat_pada)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="kartu-akun-menu">
            <Link to="/seni-rupa/saya" onClick={() => setBuka(false)}>Karya saya</Link>
            <Link to="/tulis/saya" onClick={() => setBuka(false)}>Tulisan saya</Link>
            <button type="button" className="tombol kecil" onClick={keluar}>Keluar</button>
          </div>
        </div>
      )}
    </div>
  )
}