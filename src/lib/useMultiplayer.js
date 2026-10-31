import { useCallback, useEffect, useRef, useState } from 'react'
import { buatMultiplayer } from '../game/multiplayer'
import {
  ambilHadiah,
  ambilRiwayatChat,
  bisukan,
  hapusChat,
  kirimChat,
  langgananChat,
  prosesHadiah,
} from './gameAPI'

const AFK_MS = 120000

// Tab tidak terlihat atau pemain diam 2 menit: koneksi dijeda untuk menghemat pesan.
// Saat pengembangan (npm run dev) tidak dijeda supaya dua jendela uji tetap saling melihat.
export function useAktivitas() {
  const [tampak, setTampak] = useState(() => document.visibilityState === 'visible')
  const [afk, setAfk] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
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

  if (import.meta.env.DEV) return { tampak: true, afk: false }
  return { tampak, afk }
}

export function useMultiplayer({ userId, aktif, maks, gameRef }) {
  const [status, setStatus] = useState({ jenis: 'putus' })
  const mpRef = useRef(null)
  const posisiRef = useRef(null)

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
      onNama: (id, nama, kelas, kustom) => adegan()?.pemainLainNama(id, nama, kelas, kustom),
      onStatus: setStatus,
    })
    mpRef.current = mp
    // Posisi terakhir yang diketahui scene, supaya pemain yang diam tetap bisa diumumkan
    if (posisiRef.current) mp.kirimPosisi(posisiRef.current)
    mp.sambung()
    return () => {
      mp.hentikan()
      mpRef.current = null
      setStatus({ jenis: 'putus' })
      adegan()?.hapusSemuaPemainLain()
    }
  }, [aktif, userId, maks, gameRef])

  const kirimPosisi = useCallback((data) => {
    posisiRef.current = data
    mpRef.current?.kirimPosisi(data)
  }, [])

  // Mengisi ulang pemain lain ke scene (setelah scene dimulai ulang)
  const sinkron = useCallback(() => {
    const s = gameRef.current?.scene.getScene('dunia')
    if (s && s.scene.isActive() && mpRef.current) s.sinkronPemainLain(mpRef.current.daftar())
  }, [gameRef])

  return { status, kirimPosisi, sinkron }
}

const gabung = (a, b) =>
  [...new Map([...a, ...b].map((m) => [m.id, m])).values()].sort((x, y) => x.id - y.id).slice(-80)

export function useChat({ aktif, gameRef, onStatus }) {
  const [pesan, setPesan] = useState([])
  const [hadiah, setHadiah] = useState({})
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
    ambilHadiah()
      .then((baris) => {
        if (!batal) setHadiah((h) => ({ ...h, ...Object.fromEntries(baris.map((r) => [r.id, r])) }))
      })
      .catch(() => {
        // abaikan, status hadiah diperbarui lewat Realtime
      })
    const lepas = langgananChat({
      onBaru: (m) => {
        if (batal) return
        setPesan((l) => gabung(l, [m]))
        if (!m.penerima_id && m.jenis === 'teks') {
          const s = gameRef.current?.scene.getScene('dunia')
          if (s && s.scene.isActive()) s.tampilkanGelembung(m.penulis_id, m.isi)
        }
      },
      onHapus: (id) => {
        if (!batal) setPesan((l) => l.filter((m) => m.id !== id))
      },
      onHadiah: (baris) => {
        if (!batal && baris) setHadiah((h) => ({ ...h, [baris.id]: baris }))
      },
    })
    return () => {
      batal = true
      lepas()
    }
  }, [aktif, gameRef])

  // Mengembalikan pesan galat, atau null jika berhasil.
  // Mendukung: "@nama pesan" (bisik), "/ambil 12", dan "/tolak 12".
  const kirim = useCallback(
    async (teks) => {
      try {
        const perintah = teks.match(/^\/(ambil|tolak)\s+#?(\d+)\s*$/i)
        if (perintah) {
          const h = await prosesHadiah(Number(perintah[2]), perintah[1].toLowerCase())
          if (h.status) onStatus?.(h.status)
          return h.ok ? null : h.pesan
        }
        const bisik = teks.match(/^@(\S+)\s+([\s\S]+)$/)
        if (bisik) {
          await kirimChat(bisik[2], bisik[1])
          return null
        }
        if (/^@\S*\s*$/.test(teks)) return 'Tulis pesan setelah @nama, misalnya: @nama halo'
        await kirimChat(teks)
        return null
      } catch (err) {
        return err.message
      }
    },
    [onStatus],
  )

  const aksiHadiah = useCallback(
    async (id, aksi) => {
      try {
        const h = await prosesHadiah(id, aksi)
        if (h.status) onStatus?.(h.status)
        return h.ok ? null : h.pesan
      } catch (err) {
        return err.message
      }
    },
    [onStatus],
  )

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

  return { pesan, hadiah, kesalahan, kirim, aksiHadiah, hapus, bisu }
}