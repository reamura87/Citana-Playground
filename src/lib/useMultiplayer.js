import { useCallback, useEffect, useRef, useState } from 'react'
import { buatMultiplayer } from '../game/multiplayer'
import { ambilRiwayatChat, bisukan, hapusChat, kirimChat, langgananChat } from './gameAPI'

const AFK_MS = 120000

// Tab tidak terlihat atau pemain diam 2 menit: koneksi dijeda untuk menghemat pesan
export function useAktivitas() {
  const [tampak, setTampak] = useState(() => document.visibilityState === 'visible')
  const [afk, setAfk] = useState(false)

  useEffect(() => {
    let terakhir = Date.now()
    const aktif = () => {
      terakhir = Date.now()
      setAfk(false)
    }
    const ubah = () => setTampak(document.visibilityState === 'visible')
    const periksa = setInterval(() => {
      if (Date.now() - terakhir > AFK_MS) setAfk(true)
    }, 15000)
    window.addEventListener('keydown', aktif)
    window.addEventListener('pointerdown', aktif)
    document.addEventListener('visibilitychange', ubah)
    return () => {
      clearInterval(periksa)
      window.removeEventListener('keydown', aktif)
      window.removeEventListener('pointerdown', aktif)
      document.removeEventListener('visibilitychange', ubah)
    }
  }, [])

  return { tampak, afk }
}

export function useMultiplayer({ userId, aktif, maks, gameRef }) {
  const [status, setStatus] = useState({ jenis: 'putus' })
  const mpRef = useRef(null)

  useEffect(() => {
    if (!aktif || !userId) return
    const adegan = () => {
      const s = gameRef.current?.scene.getScene('dunia')
      return s && s.scene.isActive() ? s : null
    }
    const mp = buatMultiplayer({
      userId,
      maks,
      onPosisi: (id, d) => adegan()?.pemainLainPosisi(id, d),
      onKeluar: (id) => adegan()?.pemainLainKeluar(id),
      onNama: (id, nama) => adegan()?.pemainLainNama(id, nama),
      onStatus: setStatus,
    })
    mpRef.current = mp
    mp.sambung()
    return () => {
      mp.hentikan()
      mpRef.current = null
      setStatus({ jenis: 'putus' })
      adegan()?.hapusSemuaPemainLain()
    }
  }, [aktif, userId, maks, gameRef])

  const kirimPosisi = useCallback((data) => mpRef.current?.kirimPosisi(data), [])

  // Mengisi ulang pemain lain ke scene (setelah scene dimulai ulang)
  const sinkron = useCallback(() => {
    const s = gameRef.current?.scene.getScene('dunia')
    if (s && s.scene.isActive() && mpRef.current) s.sinkronPemainLain(mpRef.current.daftar())
  }, [gameRef])

  return { status, kirimPosisi, sinkron }
}

const gabung = (a, b) =>
  [...new Map([...a, ...b].map((m) => [m.id, m])).values()].sort((x, y) => x.id - y.id).slice(-50)

export function useChat({ aktif, gameRef }) {
  const [pesan, setPesan] = useState([])
  const [kesalahan, setKesalahan] = useState('')

  useEffect(() => {
    if (!aktif) return
    let batal = false
    ambilRiwayatChat()
      .then((riwayat) => {
        if (!batal) setPesan((l) => gabung(riwayat, l))
      })
      .catch(() => {
        if (!batal) setKesalahan('Gagal memuat riwayat chat.')
      })
    const lepas = langgananChat({
      onBaru: (m) => {
        if (batal) return
        setPesan((l) => gabung(l, [m]))
        const s = gameRef.current?.scene.getScene('dunia')
        if (s && s.scene.isActive()) s.tampilkanGelembung(m.penulis_id, m.isi)
      },
      onHapus: (id) => {
        if (!batal) setPesan((l) => l.filter((m) => m.id !== id))
      },
    })
    return () => {
      batal = true
      lepas()
    }
  }, [aktif, gameRef])

  // Mengembalikan pesan galat, atau null jika berhasil
  const kirim = useCallback(async (teks) => {
    try {
      await kirimChat(teks)
      return null
    } catch (err) {
      return err.message
    }
  }, [])

  const hapus = useCallback(async (id) => {
    try {
      await hapusChat(id)
    } catch (err) {
      setKesalahan(err.message)
    }
  }, [])

  const bisu = useCallback(async (pemain) => {
    try {
      await bisukan(pemain, 60)
      setKesalahan('')
    } catch (err) {
      setKesalahan(err.message)
    }
  }, [])

  return { pesan, kesalahan, kirim, hapus, bisu }
}