import { useCallback, useEffect, useState } from 'react'
import { hitungBelumDibaca } from './notifikasi'

export function useNotifikasi(userId) {
  const [jumlah, setJumlah] = useState(0)

  // Dipakai dari luar, misalnya setelah notifikasi dibaca
  const segarkan = useCallback(() => {
    if (!userId) return Promise.resolve()
    return hitungBelumDibaca()
      .then(setJumlah)
      .catch(() => {
        // abaikan, dicoba lagi pada putaran berikutnya
      })
  }, [userId])

  // Pemeriksaan otomatis: tiap 60 detik dan saat tab kembali aktif
  useEffect(() => {
    if (!userId) return
    let batal = false

    function periksa() {
      hitungBelumDibaca()
        .then((n) => {
          if (!batal) setJumlah(n)
        })
        .catch(() => {
          // abaikan, dicoba lagi pada putaran berikutnya
        })
    }

    periksa()
    const bilaAktif = () => {
      if (document.visibilityState === 'visible') periksa()
    }
    const timer = setInterval(bilaAktif, 60000)
    document.addEventListener('visibilitychange', bilaAktif)
    window.addEventListener('focus', bilaAktif)

    return () => {
      batal = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', bilaAktif)
      window.removeEventListener('focus', bilaAktif)
    }
  }, [userId])

  return { jumlah, segarkan }
}