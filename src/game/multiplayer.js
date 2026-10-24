import { supabase } from '../lib/supabase'

const JUMLAH_RUANG = 3
const BATAS_PESAN_PER_MENIT = 160
const ARAH = ['bawah', 'atas', 'samping']

export function buatMultiplayer({ userId, maks, onPosisi, onKeluar, onNama, onStatus }) {
  let kanal = null
  let ruang = 0
  let hadir = new Set()
  let dihentikan = false
  let posisiTerakhir = null
  let tertunda = null
  let terakhirKirim = 0
  let timerKirim = null
  let timerNama = null
  let antreNama = new Set()
  let kiriman = []
  const posisi = new Map()
  const nama = new Map()

  // Makin ramai, makin jarang tiap pemain mengirim
  const jedaKirim = () => Math.max(400, 150 * (hadir.size + 1))
  const lapor = () => onStatus?.({ jenis: 'terhubung', ruang, jumlah: hadir.size + 1 })

  function jadwalkanNama(id) {
    if (nama.has(id)) return
    antreNama.add(id)
    if (timerNama) return
    timerNama = setTimeout(async () => {
      timerNama = null
      const ids = [...antreNama]
      antreNama = new Set()
      if (ids.length === 0 || dihentikan) return
      const { data } = await supabase.from('profil_publik').select('id, username').in('id', ids)
      for (const r of data ?? []) {
        nama.set(r.id, r.username)
        onNama?.(r.id, r.username)
      }
    }, 300)
  }

  function terima(p) {
    if (!p || typeof p.id !== 'string' || p.id === userId || !hadir.has(p.id)) return
    const x = Number(p.x)
    const y = Number(p.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    const d = {
      x: Math.min(1600, Math.max(0, x)),
      y: Math.min(1200, Math.max(0, y)),
      a: ARAH.includes(p.a) ? p.a : 'bawah',
      f: Boolean(p.f),
      g: Boolean(p.g),
      s: Boolean(p.s),
    }
    posisi.set(p.id, d)
    onPosisi?.(p.id, d)
  }

  function kirimPesan(event, payload) {
    if (!kanal || dihentikan) return
    const sekarang = Date.now()
    kiriman = kiriman.filter((t) => sekarang - t < 60000)
    if (kiriman.length >= BATAS_PESAN_PER_MENIT) return
    kiriman.push(sekarang)
    kanal.send({ type: 'broadcast', event, payload })
  }

  function kirimPos(data) {
    terakhirKirim = performance.now()
    kirimPesan('pos', { id: userId, ...data })
  }

  // Memberi tahu pemain lain di mana kita berada (hanya jika ada yang menerima)
  function kirimSekarang() {
    if (posisiTerakhir && hadir.size > 0) kirimPos({ ...posisiTerakhir, g: false, s: false })
  }

  // Dipanggil scene beberapa kali per detik; di sini dibatasi sesuai anggaran
  function kirimPosisi(data) {
    posisiTerakhir = data
    if (hadir.size === 0) return // sendirian: nol pesan
    const sisa = jedaKirim() - (performance.now() - terakhirKirim)
    if (sisa <= 0) {
      kirimPos(data)
      return
    }
    tertunda = data // pastikan posisi terakhir (saat berhenti) tetap terkirim
    if (!timerKirim) {
      timerKirim = setTimeout(() => {
        timerKirim = null
        if (tertunda) {
          const d = tertunda
          tertunda = null
          kirimPos(d)
        }
      }, sisa)
    }
  }

  function sinkron(ids) {
    const baru = new Set(ids.filter((id) => id !== userId))
    for (const id of baru) {
      if (!hadir.has(id)) jadwalkanNama(id)
    }
    for (const id of hadir) {
      if (!baru.has(id)) {
        posisi.delete(id)
        onKeluar?.(id)
      }
    }
    hadir = baru
    lapor()
  }

  function cobaRuang(n) {
    return new Promise((selesai) => {
      const ch = supabase.channel(`dunia:kerajaan:${n}`, {
        config: { broadcast: { self: false }, presence: { key: userId } },
      })
      let putus = false
      const akhiri = (hasil) => {
        if (putus) return
        putus = true
        clearTimeout(timer)
        selesai(hasil)
      }
      const timer = setTimeout(() => {
        if (putus) return
        supabase.removeChannel(ch)
        akhiri('gagal')
      }, 9000)

      ch.on('broadcast', { event: 'pos' }, ({ payload }) => terima(payload))
        .on('broadcast', { event: 'minta' }, () => kirimSekarang())
        .on('presence', { event: 'sync' }, () => {
          const ids = Object.keys(ch.presenceState())
          if (!putus) {
            if (ids.length > maks) {
              supabase.removeChannel(ch)
              akhiri('penuh')
              return
            }
            kanal = ch
            ruang = n
            akhiri('ok')
          }
          if (kanal === ch) sinkron(ids)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') ch.track({ t: Date.now() })
          if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !putus) {
            supabase.removeChannel(ch)
            akhiri('gagal')
          }
          if (kanal === ch && (status === 'CLOSED' || status === 'CHANNEL_ERROR')) {
            onStatus?.({ jenis: 'menyambung' })
          }
        })
    })
  }

  async function sambung() {
    for (let n = 1; n <= JUMLAH_RUANG; n += 1) {
      if (dihentikan) return
      const hasil = await cobaRuang(n)
      if (dihentikan) {
        if (kanal) supabase.removeChannel(kanal)
        kanal = null
        return
      }
      if (hasil === 'ok') {
        // Minta posisi pemain yang sedang diam, dan umumkan posisi sendiri
        if (hadir.size > 0) {
          kirimPesan('minta', {})
          kirimSekarang()
        }
        return
      }
      if (hasil === 'gagal') {
        onStatus?.({ jenis: 'gagal' })
        return
      }
    }
    onStatus?.({ jenis: 'penuh' })
  }

  function hentikan() {
    dihentikan = true
    clearTimeout(timerKirim)
    clearTimeout(timerNama)
    if (kanal) supabase.removeChannel(kanal)
    kanal = null
    hadir = new Set()
    posisi.clear()
  }

  const daftar = () => [...posisi].map(([id, d]) => ({ id, ...d, nama: nama.get(id) }))

  return { sambung, hentikan, kirimPosisi, daftar }
}