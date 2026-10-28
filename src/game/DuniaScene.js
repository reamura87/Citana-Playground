import Phaser from 'phaser'
import {
  JENIS_TANAMAN,
  WARNA_BAJU,
  gambarBatu,
  gambarBunga,
  gambarGerbang,
  gambarGoblin,
  gambarGua,
  gambarJerami,
  gambarKastil,
  gambarKerangka,
  gambarNaga,
  gambarNisan,
  gambarObor,
  gambarOrc,
  gambarPandaiBesi,
  gambarPapan,
  gambarPemain,
  gambarPetak,
  gambarPohon,
  gambarPondok,
  gambarRumah,
  gambarSemak,
  gambarSerigala,
  gambarSumur,
  gambarTanaman,
  warnaDariNama,
} from './gambar'
import { DOMAIN_BOS, PETA, POSISI_PETAK, gambarTanah, posisiPatroli, sebarDekorasi } from './peta'

const KECEPATAN = 110
const LAJU_DANGKAL = 0.55
const JARAK_AKSI = 56
const JARAK_SERANG = 54
const DEPTH_UI = 100000
const WARNA_BUNGA = ['#e85d9a', '#f2c94c', '#7aa7f0']
const GAYA_LABEL = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.55)',
  padding: { x: 4, y: 2 },
}
const GAYA_NAMA_SAYA = { ...GAYA_LABEL, color: '#ffe38a' }
const RADIUS_HADIAH = 140

// aggro: jarak mulai mengejar, lepas: jarak berhenti mengejar, jangkauan: jarak memukul
const INFO_MUSUH = {
  goblin: { lebar: 32, tinggi: 32, radius: 16, kecepatan: 34, kejar: 62, aggro: 120, lepas: 300, jangkauan: 30, jeda: 1500 },
  serigala: { lebar: 32, tinggi: 32, radius: 18, kecepatan: 56, kejar: 95, aggro: 150, lepas: 340, jangkauan: 32, jeda: 1300 },
  kerangka: { lebar: 40, tinggi: 40, radius: 20, kecepatan: 28, kejar: 55, aggro: 150, lepas: 320, jangkauan: 36, jeda: 1800 },
  orc: { lebar: 40, tinggi: 40, radius: 22, kecepatan: 26, kejar: 52, aggro: 160, lepas: 330, jangkauan: 38, jeda: 2000 },
  naga: { lebar: 96, tinggi: 84, radius: 46, kecepatan: 0, kejar: 0, aggro: 0, lepas: 0, jangkauan: 150, jeda: 2600 },
}

function formatSisa(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const j = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const d = total % 60
  const dua = (n) => String(n).padStart(2, '0')
  return j > 0 ? `${j}:${dua(m)}:${dua(d)}` : `${m}:${dua(d)}`
}

export default class DuniaScene extends Phaser.Scene {
  constructor() {
    super('dunia')
  }

  init(data) {
    this.peta = data?.peta ?? 'server'
    this.arah = 'bawah'
    this.petakObj = []
    this.interaktif = []
    this.spawnObj = new Map()
    this.blokir = []
    this.dangkal = []
    this.menyerang = false
    this.sedangMati = false
    this.bolehSerangLagi = 0
    this.riakBerikut = 0
    this.pemainLain = new Map()
    this.namaPemain = new Map()
    this.gelembung = new Map()
    this.posisiCek = 0
    this.posisiLalu = null
    this.masihGerak = false
    this.pernahSerang = false
    this.laporBerikut = 0
    this.kunciSekitar = ''
  }

  create() {
    this.buatTekstur()
    this.buatAnimasi()
    const def = PETA[this.peta]
    const { lebar, tinggi } = def.ukuran
    this.lebarDunia = lebar
    this.tinggiDunia = tinggi
    this.cameras.main.setBounds(0, 0, lebar, tinggi)

    const kunciTanah = `tanah_${this.peta}`
    if (!this.textures.exists(kunciTanah)) this.textures.addCanvas(kunciTanah, gambarTanah(this.peta))
    this.add.image(0, 0, kunciTanah).setOrigin(0, 0).setDepth(-1000)

    if (def.air) def.air.forEach((a) => this.tambahAir(a))
    if (def.kastil) this.tambahKastil(def.kastil)
    if (def.gua) this.tambahGua(def.gua)
    if (def.sumur) this.tambahSumur(def.sumur)
    if (def.pondok) def.pondok.forEach((p) => this.tambahPondok(p))
    if (def.obor) def.obor.forEach((o) => this.tambahObor(o))
    if (def.gerbang) this.tambahGerbang(def.gerbang)
    if (def.toko) this.tambahToko(def.toko)
    if (def.papan) this.tambahPapan(def.papan)
    if (def.rumah) this.tambahRumah(def.rumah)
    if (this.peta === 'pribadi') this.tambahKebun()
    if (this.peta === 'server') this.tambahRintangan(DOMAIN_BOS.x, DOMAIN_BOS.y - 14, 70, 28)
    if (def.label) def.label.forEach((l) => this.labelStatis(l.x, l.y, l.teks))
    this.tambahDekorasi(def)

        // Titik lahir sedikit berbeda untuk tiap pemain supaya tidak bertumpuk
    const awal = this.titikMulai(def)
    this.pemain = this.add.sprite(awal.x, awal.y, 'pemain_bawah_0')
    this.labelSaya = this.add
      .text(0, 0, this.registry.get('status')?.pemain.nama ?? '', GAYA_NAMA_SAYA)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI)
    this.cameras.main.startFollow(this.pemain, true, 0.12, 0.12)

    this.petunjuk = this.add
      .text(0, 0, '', GAYA_LABEL)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI + 1)
      .setVisible(false)

        // Keyboard dibaca sendiri (bukan lewat plugin keyboard Phaser) supaya tidak ada tombol
    // yang dibatalkan dan kolom chat tetap bisa dipakai mengetik
    this.tombolTekan = new Set()
    this.tekanE = false
    this.tekanSpasi = false
    const turun = (e) => {
      if (this.fokusDiInput() || e.ctrlKey || e.metaKey || e.altKey) return
      this.tombolTekan.add(e.code)
      if (e.repeat) return
      if (e.code === 'KeyE') this.tekanE = true
      if (e.code === 'Space') this.tekanSpasi = true
    }
    const naik = (e) => this.tombolTekan.delete(e.code)
    const lepasSemua = () => this.tombolTekan.clear()
    window.addEventListener('keydown', turun)
    window.addEventListener('keyup', naik)
    window.addEventListener('blur', lepasSemua)
    const bersihkan = () => {
      window.removeEventListener('keydown', turun)
      window.removeEventListener('keyup', naik)
      window.removeEventListener('blur', lepasSemua)
    }
    this.events.once('shutdown', bersihkan)
    this.events.once('destroy', bersihkan)

    // Klik atau ketuk = satu tebasan. Phaser menahan perubahan fokus saat klik di kanvas,
    // jadi fokus kolom chat dilepas di sini.
    this.input.off('pointerdown')
    this.input.on('pointerdown', (pointer) => {
      if (this.fokusDiInput()) document.activeElement.blur()
      this.serang({ x: pointer.worldX, y: pointer.worldY })
    })

    // Klik atau ketuk = satu tebasan
    this.input.off('pointerdown')
    this.input.on('pointerdown', (pointer) => this.serang({ x: pointer.worldX, y: pointer.worldY }))

    this.onStatus = () => this.terapkanStatus()
    this.onDunia = () => this.terapkanDunia()
    this.registry.events.on('changedata-status', this.onStatus)
    this.registry.events.on('changedata-dunia', this.onDunia)
    this.events.once('shutdown', () => {
      this.registry.events.off('changedata-status', this.onStatus)
      this.registry.events.off('changedata-dunia', this.onDunia)
    })
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.perbaruiPetak() })

    this.terapkanStatus()
    this.terapkanDunia()
    this.game.events.emit('pemain-sekitar', [])
    this.game.events.emit('peta', this.peta)
  }

  buatTekstur() {
    const tambah = (kunci, kanvas) => {
      if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    }
    const baju = this.registry.get('warna')?.baju ?? WARNA_BAJU[0]
    for (const arah of ['bawah', 'atas', 'samping']) {
      for (const n of [0, 1, 2]) {
        tambah(`pemain_${arah}_${n}`, gambarPemain(arah, n, baju))
        tambah(`pemain_${arah}_serang${n}`, gambarPemain(arah, 0, baju, n))
      }
    }
    const pembuatMusuh = {
      goblin: gambarGoblin,
      serigala: gambarSerigala,
      kerangka: gambarKerangka,
      orc: gambarOrc,
      naga: gambarNaga,
    }
    for (const [id, buat] of Object.entries(pembuatMusuh)) {
      for (const f of [0, 1]) tambah(`musuh_${id}_${f}`, buat(f))
    }
    tambah('pohon', gambarPohon())
    tambah('semak', gambarSemak())
    tambah('batu', gambarBatu())
    tambah('nisan', gambarNisan())
    tambah('jerami', gambarJerami())
    tambah('obor', gambarObor())
    tambah('sumur', gambarSumur())
    tambah('pondok_0', gambarPondok(0))
    tambah('pondok_1', gambarPondok(1))
    tambah('pandai', gambarPandaiBesi())
    tambah('kastil', gambarKastil())
    tambah('gua', gambarGua())
    tambah('papan', gambarPapan())
    tambah('gerbang', gambarGerbang())
    WARNA_BUNGA.forEach((w, i) => tambah(`bunga_${i}`, gambarBunga(w)))
    tambah('petak_buka', gambarPetak(false))
    tambah('petak_kunci', gambarPetak(true))
    for (const jenis of JENIS_TANAMAN) {
      for (const tahap of [0, 1, 2]) tambah(`tanaman_${jenis}_${tahap}`, gambarTanaman(jenis, tahap))
    }
    for (let l = 1; l <= 5; l += 1) tambah(`rumah_${l}`, gambarRumah(l))
  }

  buatAnimasi() {
    const buat = (key, daftar, frameRate, repeat) => {
      if (this.anims.exists(key)) return
      this.anims.create({ key, frames: daftar.map((k) => ({ key: k })), frameRate, repeat })
    }
    for (const arah of ['bawah', 'atas', 'samping']) {
      buat(`jalan_${arah}`, [1, 0, 2, 0].map((n) => `pemain_${arah}_${n}`), 8, -1)
      buat(`serang_${arah}`, [0, 1, 2].map((n) => `pemain_${arah}_serang${n}`), 14, 0)
    }
    for (const id of Object.keys(INFO_MUSUH)) {
      buat(`idle_${id}`, [0, 1].map((f) => `musuh_${id}_${f}`), 2, -1)
      buat(`jalan_${id}`, [0, 1].map((f) => `musuh_${id}_${f}`), 6, -1)
    }
  }

  // ---------- Tabrakan (ditulis sendiri, tanpa physics) ----------
  tambahRintangan(x, y, l, t) {
    this.blokir.push({ tipe: 'kotak', x1: x - l / 2, y1: y - t / 2, x2: x + l / 2, y2: y + t / 2 })
  }

  tambahAir(a) {
    this.blokir.push({ tipe: 'elips', cx: a.cx, cy: a.cy, rx: a.rx, ry: a.ry })
    this.dangkal.push({ cx: a.cx, cy: a.cy, rx: a.rx + 22, ry: a.ry + 12 })
  }

  // Menguji kotak kecil di kaki pemain (14x10) terhadap semua penghalang
  menabrak(x, y) {
    const fx = x
    const fy = y + 12
    const x1 = fx - 7
    const x2 = fx + 7
    const y1 = fy - 5
    const y2 = fy + 5
    if (x1 < 0 || x2 > this.lebarDunia || y1 < 0 || y2 > this.tinggiDunia) return true
    const titik = [[x1, y1], [x2, y1], [x1, y2], [x2, y2], [fx, fy]]
    for (const b of this.blokir) {
      if (b.tipe === 'kotak') {
        if (x2 > b.x1 && x1 < b.x2 && y2 > b.y1 && y1 < b.y2) return true
      } else if (titik.some(([px, py]) => ((px - b.cx) / b.rx) ** 2 + ((py - b.cy) / b.ry) ** 2 < 1)) {
        return true
      }
    }
    return false
  }

  diAirDangkal(x, y) {
    const py = y + 12
    return this.dangkal.some((b) => ((x - b.cx) / b.rx) ** 2 + ((py - b.cy) / b.ry) ** 2 < 1)
  }

  riak() {
    const r = this.add
      .ellipse(this.pemain.x, this.pemain.y + 16, 16, 7)
      .setStrokeStyle(1, 0xffffff, 0.7)
      .setDepth(this.pemain.y + 15)
    this.tweens.add({ targets: r, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 500, onComplete: () => r.destroy() })
  }

  // ---------- Pembangunan dunia ----------
  labelStatis(x, y, teks) {
    return this.add.text(x, y, teks, GAYA_LABEL).setOrigin(0.5).setDepth(DEPTH_UI)
  }

  tambahKastil(p) {
    this.add.image(p.x, p.y, 'kastil').setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 24, 224, 48)
  }

  tambahGua(p) {
    this.add.image(p.x, p.y, 'gua').setOrigin(0.5, 1).setDepth(p.y - 60)
    this.tambahRintangan(p.x, p.y - 14, 72, 28)
  }

  tambahSumur(p) {
    this.add.image(p.x, p.y, 'sumur').setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 8, 28, 16)
  }

  tambahPondok(p) {
    this.add.image(p.x, p.y, `pondok_${p.v}`).setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 14, 56, 28)
  }

  tambahObor(p) {
    this.add.image(p.x, p.y, 'obor').setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 3, 8, 6)
    const cahaya = this.add.circle(p.x, p.y - 28, 26, 0xffa040, 0.18).setDepth(p.y + 1)
    this.tweens.add({ targets: cahaya, alpha: 0.08, yoyo: true, repeat: -1, duration: 500 })
  }

  tambahGerbang(g) {
    const s = this.add.image(g.x, g.y, 'gerbang').setOrigin(0.5, 1).setDepth(g.y)
    this.tweens.add({ targets: s, alpha: 0.8, yoyo: true, repeat: -1, duration: 900 })
    this.labelStatis(g.x, g.y - 70, g.label)
    this.interaktif.push({ jenis: 'gerbang', ke: g.ke, x: g.x, y: g.y + 10, label: g.label, radius: 56 })
  }

  tambahToko(t) {
    this.add.image(t.x, t.y, 'pandai').setOrigin(0.5, 1).setDepth(t.y)
    this.tambahRintangan(t.x, t.y - 18, 76, 36)
    this.labelStatis(t.x, t.y - 84, 'Pandai Besi')
    this.interaktif.push({ jenis: 'toko', x: t.x, y: t.y + 24, label: 'Perlengkapan & toko', radius: 56 })
  }

  tambahPapan(p) {
    this.add.image(p.x, p.y, 'papan').setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 6, 20, 12)
    this.interaktif.push({ jenis: 'papan', x: p.x, y: p.y + 14, label: 'Baca papan', radius: 46 })
  }

  tambahRumah(pos) {
    this.rumahSprite = this.add.image(pos.x, pos.y, 'rumah_1').setOrigin(0.5, 1).setDepth(pos.y)
    this.tambahRintangan(pos.x, pos.y - 24, 84, 48)
    this.labelStatis(pos.x, pos.y - 96, 'Rumahku')
    this.interaktif.push({ jenis: 'rumah', x: pos.x, y: pos.y + 22, label: 'Rumah (upgrade)', radius: 56 })
  }

  tambahKebun() {
    POSISI_PETAK.forEach((pos, i) => {
      const tanah = this.add.image(pos.x, pos.y, 'petak_buka').setDepth(1)
      const tanaman = this.add
        .image(pos.x, pos.y - 3, 'tanaman_wortel_0')
        .setDepth(pos.y)
        .setVisible(false)
      const label = this.labelStatis(pos.x, pos.y + 32, '')
      this.petakObj.push({ tanah, tanaman, label, keadaan: 'kosong' })
      this.interaktif.push({ jenis: 'petak', indeks: i, x: pos.x, y: pos.y, radius: 40 })
    })
  }

  tambahDekorasi(def) {
    const umum = [...def.larangan]
    if (def.reruntuhan) umum.push(def.reruntuhan)
    if (def.padang) umum.push(def.padang)
    const khusus = [...def.larangan]
    const luas = [0, 0, def.ukuran.lebar, def.ukuran.tinggi]
    const seed = this.peta === 'server' ? 101 : 202

    const taruh = (daftar, gambar, daftarRintang) =>
      daftar.forEach((p) => {
        gambar(p)
        daftarRintang.push([p.x - 24, p.y - 24, 48, 48])
      })
    const pohon = (p) => {
      this.add.image(p.x, p.y, 'pohon').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 8, 20, 14)
    }
    const semak = (p) => {
      this.add.image(p.x, p.y, 'semak').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 5, 24, 10)
    }
    const bunga = (p) =>
      this.add.image(p.x, p.y, `bunga_${(p.x + p.y) % 3}`).setOrigin(0.5, 1).setDepth(p.y)
    const batu = (p) => {
      this.add.image(p.x, p.y, 'batu').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 6, 24, 12)
    }
    const nisan = (p) => {
      this.add.image(p.x, p.y, 'nisan').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 4, 12, 8)
    }
    const jerami = (p) => {
      this.add.image(p.x, p.y, 'jerami').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 8, 26, 14)
    }

    taruh(sebarDekorasi(seed, this.peta === 'server' ? 14 : 18, umum, luas), pohon, umum)
    if (def.hutan) taruh(sebarDekorasi(seed + 1, 34, umum, def.hutan, 62), pohon, umum)
    taruh(sebarDekorasi(seed + 2, 14, umum, luas, 60), semak, umum)
    taruh(sebarDekorasi(seed + 3, 30, umum, luas, 40), bunga, umum)
    taruh(sebarDekorasi(seed + 7, 6, umum, luas, 90), batu, umum)
    if (def.padang) taruh(sebarDekorasi(seed + 4, 9, khusus, def.padang, 70), jerami, khusus)
    if (def.reruntuhan) {
      taruh(sebarDekorasi(seed + 5, 12, khusus, def.reruntuhan, 50), nisan, khusus)
      taruh(sebarDekorasi(seed + 6, 5, khusus, def.reruntuhan, 80), batu, khusus)
    }
  }

  // ---------- Status dari React ----------
  terapkanStatus() {
    const st = this.registry.get('status')
    if (!st) return
    this.status = st
    if (this.peta !== 'pribadi') return
    this.rumahSprite?.setTexture(`rumah_${st.rumah.level}`)
    this.perbaruiPetak()
  }

  perbaruiPetak() {
    if (this.peta !== 'pribadi' || !this.status) return
    const sekarang = Date.now() + (this.registry.get('selisihWaktu') ?? 0)
    const terbuka = this.status.rumah.jumlah_petak

    this.petakObj.forEach((o, i) => {
      o.tanah.setTexture(i < terbuka ? 'petak_buka' : 'petak_kunci')
      if (i >= terbuka) {
        o.keadaan = 'terkunci'
        o.tanaman.setVisible(false)
        o.label.setText('')
        return
      }
      const data = this.status.petak.find((p) => p.indeks === i)
      if (!data) {
        o.keadaan = 'kosong'
        o.tanaman.setVisible(false)
        o.label.setText('')
        return
      }
      const siap = Date.parse(data.siap_pada)
      const mulai = Date.parse(data.ditanam_pada)
      const sisa = siap - sekarang
      const tahap = sisa <= 0 ? 2 : (sekarang - mulai) / (siap - mulai) >= 1 / 3 ? 1 : 0
      o.keadaan = sisa <= 0 ? 'siap' : 'tumbuh'
      const kunci = `tanaman_${data.tanaman_id}_${tahap}`
      if (this.textures.exists(kunci)) o.tanaman.setTexture(kunci).setVisible(true)
      o.label.setText(sisa <= 0 ? 'Siap!' : formatSisa(sisa))
    })
  }

  labelPetak(indeks) {
    const keadaan = this.petakObj[indeks]?.keadaan
    if (keadaan === 'terkunci') return 'Terkunci (upgrade rumah)'
    if (keadaan === 'siap') return 'Panen'
    if (keadaan === 'tumbuh') return 'Sedang tumbuh'
    return 'Tanam'
  }

  // ---------- Musuh ----------
  buatSpawn(d) {
    const info = INFO_MUSUH[d.musuh_id]
    if (!info) return null
    const sprite = this.add.sprite(0, 0, `musuh_${d.musuh_id}_0`).setOrigin(0.5, 1)
    const latar = this.add.rectangle(0, 0, info.lebar, 5, 0x000000, 0.7).setDepth(DEPTH_UI)
    const isi = this.add
      .rectangle(0, 0, info.lebar - 2, 3, 0x59c35a)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_UI + 1)
    const nama = this.labelStatis(0, 0, '').setVisible(false)
    return {
      data: d, info, sprite, latar, isi, nama,
      x: undefined, y: undefined, keadaan: null,
      aggro: false, kembali: false, bolehSerang: 0, hentak: 0, teksTerakhir: '',
    }
  }

  terapkanDunia() {
    const d = this.registry.get('dunia')
    if (!d || this.peta !== 'server') return
    const ada = new Set()
    for (const s of d.spawn) {
      ada.add(s.id)
      let m = this.spawnObj.get(s.id)
      if (!m) {
        m = this.buatSpawn(s)
        if (!m) continue
        this.spawnObj.set(s.id, m)
      }
      m.data = s
    }
    for (const [id, m] of this.spawnObj) {
      if (ada.has(id)) continue
      m.sprite.destroy()
      m.latar.destroy()
      m.isi.destroy()
      m.nama.destroy()
      this.spawnObj.delete(id)
    }
  }

  sembunyikan(m) {
    m.keadaan = 'hilang'
    m.sprite.setVisible(false)
    m.latar.setVisible(false)
    m.isi.setVisible(false)
    m.nama.setVisible(false)
  }

  musuhMenyerang(m) {
    m.bolehSerang = this.time.now + m.info.jeda
    if (m.data.jenis === 'bos') {
      // Gelombang area: pemain bisa menghindar kalau menjauh sebelum gelombang selesai
      const lingkar = this.add.circle(m.x, m.y - 24, 20, 0xff3030, 0.35).setDepth(DEPTH_UI)
      this.tweens.add({ targets: lingkar, scale: 7, alpha: 0, duration: 650, onComplete: () => lingkar.destroy() })
      this.time.delayedCall(350, () => {
        if (this.registry.get('mati') || m.keadaan !== 'hidup') return
        const j = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y + 8, m.x, m.y)
        if (j < m.info.jangkauan + 20) this.game.events.emit('diserang', m.data.id)
      })
      return
    }
    const arah = Math.sign(this.pemain.x - m.x) || 1
    this.tweens.add({ targets: m, hentak: arah * 8, duration: 80, yoyo: true })
    this.game.events.emit('diserang', m.data.id)
  }

  perbaruiMusuh(dt) {
    if (this.spawnObj.size === 0) return
    const sekarang = Date.now() + (this.registry.get('selisihWaktu') ?? 0)
    const pemainHidup = !this.registry.get('mati')

    for (const m of this.spawnObj.values()) {
      const d = m.data
      const info = m.info
      if (d.keadaan === 'hilang') {
        if (m.keadaan !== 'hilang') this.sembunyikan(m)
        continue
      }

      const waktuPatroli = d.keadaan === 'mayat' ? Date.parse(d.mati_pada) : sekarang
      const patrol =
        d.jenis === 'bos'
          ? { x: DOMAIN_BOS.x, y: DOMAIN_BOS.y, gerak: false, dx: 0 }
          : posisiPatroli(d.rute, d.fase, waktuPatroli, info.kecepatan)

      if (d.keadaan === 'mayat') {
        if (m.keadaan !== 'mayat') {
          if (m.keadaan !== 'hidup' || m.x === undefined) {
            m.x = patrol.x
            m.y = patrol.y
          }
          m.aggro = false
          m.kembali = false
          m.sprite.anims.stop()
          m.sprite.setTexture(`musuh_${d.musuh_id}_0`)
          m.sprite.setOrigin(0.5, 0.5).setAngle(90).setTint(0x777777).setAlpha(0.85)
          m.keadaan = 'mayat'
        }
        m.sprite.setPosition(m.x, m.y - info.tinggi * 0.25).setDepth(m.y - 1).setVisible(true)
        m.latar.setVisible(false)
        m.isi.setVisible(false)
        m.nama.setVisible(false)
        continue
      }

      if (m.keadaan !== 'hidup') {
        m.sprite.setOrigin(0.5, 1).setAngle(0).clearTint().setAlpha(1)
        m.x = patrol.x
        m.y = patrol.y
        m.aggro = false
        m.kembali = false
        m.bolehSerang = this.time.now + 800
        m.keadaan = 'hidup'
      }
      m.sprite.setVisible(true)

      let gerak = patrol.gerak
      let arahX = patrol.dx

      if (d.jenis === 'bos') {
        m.x = patrol.x
        m.y = patrol.y
        const jarak = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y + 8, m.x, m.y)
        if (pemainHidup && jarak < info.jangkauan && this.time.now >= m.bolehSerang) this.musuhMenyerang(m)
      } else {
        const jarakPemain = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y + 8, m.x, m.y)
        const jarakPatroli = Phaser.Math.Distance.Between(m.x, m.y, patrol.x, patrol.y)

        if (!pemainHidup && m.aggro) {
          m.aggro = false
          m.kembali = true
        }
        if (!m.aggro && pemainHidup && jarakPemain < info.aggro) {
          m.aggro = true
          m.kembali = false
          m.bolehSerang = this.time.now + 600
        }
        if (m.aggro && (jarakPemain > info.lepas || jarakPatroli > 380)) {
          m.aggro = false
          m.kembali = true
        }

        if (m.aggro) {
          arahX = this.pemain.x - m.x
          if (jarakPemain > info.jangkauan) {
            const k = (info.kejar * dt) / jarakPemain
            m.x += arahX * k
            m.y += (this.pemain.y + 8 - m.y) * k
            gerak = true
          } else {
            gerak = false
            if (this.time.now >= m.bolehSerang) this.musuhMenyerang(m)
          }
        } else if (m.kembali) {
          if (jarakPatroli < 8) {
            m.kembali = false
            m.x = patrol.x
            m.y = patrol.y
          } else {
            const k = (info.kecepatan * 1.6 * dt) / jarakPatroli
            arahX = patrol.x - m.x
            m.x += arahX * k
            m.y += (patrol.y - m.y) * k
            gerak = true
          }
        } else {
          m.x = patrol.x
          m.y = patrol.y
        }
      }

      m.sprite.anims.play(gerak ? `jalan_${d.musuh_id}` : `idle_${d.musuh_id}`, true)
      if (arahX !== 0) m.sprite.setFlipX(arahX < 0)
      m.sprite.setPosition(m.x + m.hentak, m.y).setDepth(m.y)

      // Bar HP dan angkanya muncul untuk musuh yang terluka, sedang mengejar, atau bos
      const rasio = Math.max(0, d.hp / d.hp_maks)
      const tampil = rasio < 1 || m.aggro || d.jenis === 'bos'
      const barY = m.y - info.tinggi - 8
      m.latar.setPosition(m.x, barY).setVisible(tampil)
      m.isi
        .setPosition(m.x - info.lebar / 2 + 1, barY)
        .setVisible(tampil)
        .setScale(Math.max(0.001, rasio), 1)
        .setFillStyle(rasio > 0.5 ? 0x59c35a : rasio > 0.25 ? 0xe0b030 : 0xd94a3d)
      const teks = `${d.nama}  ${d.hp}/${d.hp_maks}`
      if (teks !== m.teksTerakhir) {
        m.nama.setText(teks)
        m.teksTerakhir = teks
      }
      m.nama.setPosition(m.x, barY - 12).setVisible(tampil)
    }
  }

  // ---------- Tebasan ----------
  cariTarget(titik) {
    let terbaik = null
    let skor = Infinity
    for (const m of this.spawnObj.values()) {
      if (m.keadaan !== 'hidup') continue
      const jarakPemain = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y, m.x, m.y)
      if (jarakPemain > JARAK_SERANG + m.info.radius) continue
      const nilai = titik
        ? Phaser.Math.Distance.Between(titik.x, titik.y, m.x, m.y - m.info.tinggi / 2)
        : jarakPemain
      if (titik && nilai > Math.max(56, m.info.radius + 28)) continue
      if (nilai < skor) {
        terbaik = m
        skor = nilai
      }
    }
    return terbaik
  }

  serang(titik) {
    if (this.menyerang || this.registry.get('terkunci') || this.registry.get('mati')) return
    if (this.time.now < this.bolehSerangLagi) return
    this.bolehSerangLagi = this.time.now + (this.registry.get('jedaSerang') ?? 420)
    this.menyerang = true
    this.pernahSerang = true

    const target = this.cariTarget(titik)
    const arahKe = titik ?? (target ? { x: target.x, y: target.y } : null)
    if (arahKe) {
      const dx = arahKe.x - this.pemain.x
      const dy = arahKe.y - this.pemain.y
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.arah = 'samping'
        this.pemain.setFlipX(dx < 0)
      } else {
        this.arah = dy > 0 ? 'bawah' : 'atas'
        this.pemain.setFlipX(false)
      }
    }
    this.pemain.anims.play(`serang_${this.arah}`, true)
    this.time.delayedCall(260, () => {
      this.menyerang = false
    })
    if (target) this.game.events.emit('serang', target.data.id)
  }

  teksMelayang(x, y, teks, warna) {
    const t = this.add
      .text(x, y, teks, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: warna,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_UI + 2)
    this.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 700, onComplete: () => t.destroy() })
  }

  // Dipanggil React setelah server mengonfirmasi satu pukulan ke musuh
  tampilkanPukulan(id, hasil) {
    const m = this.spawnObj.get(id)
    if (!m) return
    this.teksMelayang(m.x, m.y - m.info.tinggi - 24, `-${hasil.damage}`, '#ffd23f')
    if (!hasil.mati) {
      m.sprite.setTint(0xff8888)
      this.time.delayedCall(110, () => {
        if (m.keadaan === 'hidup') m.sprite.clearTint()
      })
    }
  }

  // Dipanggil React setelah server mengonfirmasi pemain terkena pukulan
  tampilkanLuka(hasil) {
    if (!this.pemain) return
    this.teksMelayang(this.pemain.x, this.pemain.y - 24, `-${hasil.damage}`, '#ff6b6b')
    this.pemain.setTint(0xff6666)
    this.time.delayedCall(140, () => {
      if (!this.sedangMati) this.pemain.clearTint()
    })
  }

  // Mengembalikan true kalau scene sedang dimulai ulang (bangkit di plaza desa)
  perbaruiMati(mati) {
    if (mati && !this.sedangMati) {
      this.sedangMati = true
      this.menyerang = false
      this.pemain.anims.stop()
      this.pemain.setTexture(`pemain_${this.arah}_0`)
      this.pemain.setAngle(90).setTint(0x777777)
    } else if (!mati && this.sedangMati) {
      this.sedangMati = false
      this.scene.restart({ peta: 'server' })
      return true
    }
    return false
  }

    // ---------- Pemain lain (multiplayer) ----------
  pastikanWarna(baju) {
    const kunci = baju.replace('#', '')
    if (!this.textures.exists(`pl_${kunci}_bawah_0`)) {
      for (const arah of ['bawah', 'atas', 'samping']) {
        for (const n of [0, 1, 2]) {
          this.textures.addCanvas(`pl_${kunci}_${arah}_${n}`, gambarPemain(arah, n, baju))
        }
        this.textures.addCanvas(`pl_${kunci}_${arah}_s`, gambarPemain(arah, 0, baju, 1))
      }
    }
    return kunci
  }

  buatPemainLain(id) {
    const kunci = this.pastikanWarna(warnaDariNama(id).baju)
    const sprite = this.add.sprite(0, 0, `pl_${kunci}_bawah_0`)
    const label = this.add
      .text(0, 0, this.namaPemain.get(id) ?? '…', GAYA_LABEL)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI)
    const o = {
      id, sprite, label, kunci,
      x: undefined, y: undefined, tx: 0, ty: 0,
      a: 'bawah', f: false, g: false, serangSampai: 0, terakhir: 0,
    }
    this.pemainLain.set(id, o)
    return o
  }

  pemainLainPosisi(id, d) {
    if (!this.pemainLain || this.peta !== 'server') return
    const o = this.pemainLain.get(id) ?? this.buatPemainLain(id)
    o.tx = d.x
    o.ty = d.y
    o.a = d.a
    o.f = d.f
    o.g = d.g
    o.terakhir = this.time.now
    if (o.x === undefined) {
      o.x = d.x
      o.y = d.y
    }
    if (d.s) o.serangSampai = this.time.now + 260
  }

  pemainLainNama(id, nama) {
    if (!this.pemainLain) return
    this.namaPemain.set(id, nama)
    this.pemainLain.get(id)?.label.setText(nama)
  }

  pemainLainKeluar(id) {
    const o = this.pemainLain?.get(id)
    if (!o) return
    o.sprite.destroy()
    o.cincin?.destroy()
    o.label.destroy()
    this.pemainLain.delete(id)
    const g = this.gelembung.get(id)
    if (g) {
      g.teks.destroy()
      this.gelembung.delete(id)
    }
  }

  hapusSemuaPemainLain() {
    if (!this.pemainLain) return
    for (const id of [...this.pemainLain.keys()]) this.pemainLainKeluar(id)
  }

  sinkronPemainLain(daftar) {
    if (!this.pemainLain || this.peta !== 'server') return
    for (const p of daftar) {
      if (p.nama) this.namaPemain.set(p.id, p.nama)
      this.pemainLainPosisi(p.id, p)
    }
  }

    // Halus: pemain lain bergerak mendekati posisi terakhir yang diterima
  perbaruiPemainLain(dt) {
    if (!this.pemainLain) return
    const k = 1 - Math.exp(-dt * 7)
    for (const o of this.pemainLain.values()) {
      if (o.x === undefined) continue
      o.x += (o.tx - o.x) * k
      o.y += (o.ty - o.y) * k
      const gerak =
        (o.g && this.time.now - o.terakhir < 1500) || Math.hypot(o.tx - o.x, o.ty - o.y) > 4
      let kunciTekstur = `pl_${o.kunci}_${o.a}_0`
      if (this.time.now < o.serangSampai) {
        kunciTekstur = `pl_${o.kunci}_${o.a}_s`
      } else if (gerak) {
        kunciTekstur = `pl_${o.kunci}_${o.a}_${[1, 0, 2, 0][Math.floor(this.time.now / 125) % 4]}`
      }
      o.sprite
        .setTexture(kunciTekstur)
        .setFlipX(o.a === 'samping' && o.f)
        .setPosition(o.x, o.y)
        .setDepth(o.y + 16)
      o.label.setPosition(o.x, o.y - 20)

      const dekat = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y, o.x, o.y) <= RADIUS_HADIAH
      if (dekat && !o.cincin) o.cincin = this.add.ellipse(0, 0, 40, 16).setStrokeStyle(2, 0xffe38a, 0.9)
      if (o.cincin) o.cincin.setVisible(dekat).setPosition(o.x, o.y + 16).setDepth(o.y + 15)
    }
    this.laporSekitar()
  }

  // Memberi tahu panel chat siapa saja yang ada di sekitar (dipakai untuk bisik dan hadiah)
  laporSekitar() {
    if (this.time.now < this.laporBerikut) return
    this.laporBerikut = this.time.now + 400
    const kamera = this.cameras.main.worldView
    const mata = ['timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut', 'utara', 'timur laut']
    const daftar = []
    for (const o of this.pemainLain.values()) {
      if (o.x === undefined) continue
      const dx = o.x - this.pemain.x
      const dy = o.y - this.pemain.y
      const jarak = Math.hypot(dx, dy)
      const sudut = (Math.atan2(dy, dx) * 180) / Math.PI
      daftar.push({
        id: o.id,
        nama: this.namaPemain.get(o.id) ?? '…',
        jarak: Math.round(jarak / 10) * 10,
        dekat: jarak <= RADIUS_HADIAH,
        arah: mata[Math.round(((sudut + 360) % 360) / 45) % 8],
        terlihat: kamera.contains(o.x, o.y),
      })
    }
    daftar.sort((a, b) => a.jarak - b.jarak)
    const kunci = JSON.stringify(daftar)
    if (kunci === this.kunciSekitar) return
    this.kunciSekitar = kunci
    this.game.events.emit('pemain-sekitar', daftar)
  }

  // Posisi kita dikirim hanya saat bergerak, berhenti, atau menebas
  kirimPosisiSaya() {
    if (this.peta !== 'server' || this.time.now < this.posisiCek) return
    this.posisiCek = this.time.now + 120
    const x = Math.round(this.pemain.x)
    const y = Math.round(this.pemain.y)
    const lalu = this.posisiLalu
    const bergerak = !lalu || Math.hypot(x - lalu.x, y - lalu.y) > 1.5
    if (!(bergerak || this.masihGerak || this.pernahSerang)) return
    this.game.events.emit('posisi-saya', {
      x, y, a: this.arah, f: this.pemain.flipX, g: bergerak, s: this.pernahSerang,
    })
    this.masihGerak = bergerak
    this.pernahSerang = false
    this.posisiLalu = { x, y }
  }

  // Gelembung ucapan di atas kepala saat ada pesan chat
  tampilkanGelembung(idPengirim, teks) {
    if (!this.gelembung || this.peta !== 'server') return
    const kunci = idPengirim === this.registry.get('idSaya') ? 'saya' : idPengirim
    if (kunci !== 'saya' && !this.pemainLain.has(kunci)) return
    const potong = teks.length > 60 ? `${teks.slice(0, 57)}…` : teks
    let g = this.gelembung.get(kunci)
    if (!g) {
      g = {
        teks: this.add
          .text(0, 0, '', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#1c1c1c',
            backgroundColor: 'rgba(255,255,255,0.92)',
            padding: { x: 5, y: 3 },
            wordWrap: { width: 150 },
          })
          .setOrigin(0.5, 1)
          .setDepth(DEPTH_UI + 3),
        sampai: 0,
      }
      this.gelembung.set(kunci, g)
    }
    g.teks.setText(potong)
    g.sampai = this.time.now + 5000
  }

  perbaruiGelembung() {
    if (!this.gelembung) return
    for (const [kunci, g] of this.gelembung) {
      const sumber = kunci === 'saya' ? this.pemain : this.pemainLain.get(kunci)?.sprite
      if (!sumber || this.time.now > g.sampai) {
        g.teks.destroy()
        this.gelembung.delete(kunci)
        continue
      }
      g.teks.setPosition(sumber.x, sumber.y - 34)
    }
  }

    titikMulai(def) {
      if (this.peta !== 'server') return def.mulai
      let h = 0
      for (const c of String(this.registry.get('idSaya') ?? 'x')) h = (h * 31 + c.charCodeAt(0)) >>> 0
      for (let i = 0; i < 10; i += 1) {
        const sudut = (((h + i * 37) % 360) * Math.PI) / 180
        const jari = 36 + (((h >> 4) + i * 13) % 50)
        const x = def.mulai.x + Math.cos(sudut) * jari
        const y = def.mulai.y + Math.sin(sudut) * jari
        if (!this.menabrak(x, y)) return { x, y }
      }
      return def.mulai
  }

    fokusDiInput() {
    const el = document.activeElement
    return (
      Boolean(el) && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
    )
  }
  // ---------- Setiap frame ----------
    update(_waktu, delta) {
    const dt = Math.min(delta, 50) / 1000
    const kontrol = this.registry.get('kontrol') ?? {}
    const mati = Boolean(this.registry.get('mati'))
    if (this.perbaruiMati(mati)) return

    const terkunci = Boolean(this.registry.get('terkunci')) || mati
    const boleh = !terkunci && !this.fokusDiInput()
    const tombol = this.tombolTekan

    // E dan Spasi hanya berlaku sekali per tekan
    const tekanE = this.tekanE
    const tekanSpasi = this.tekanSpasi
    this.tekanE = false
    this.tekanSpasi = false

    this.perbaruiMusuh(dt)

    if (boleh && (tekanSpasi || kontrol.serang)) this.serang(null)
    if (kontrol.serang) kontrol.serang = false

    if (this.menyerang || !boleh) {
      if (!this.menyerang && !mati) {
        this.pemain.anims.stop()
        this.pemain.setTexture(`pemain_${this.arah}_0`)
      }
    } else {
      let dx = 0
      let dy = 0
      if (tombol.has('ArrowLeft') || tombol.has('KeyA') || kontrol.kiri) dx -= 1
      if (tombol.has('ArrowRight') || tombol.has('KeyD') || kontrol.kanan) dx += 1
      if (tombol.has('ArrowUp') || tombol.has('KeyW') || kontrol.atas) dy -= 1
      if (tombol.has('ArrowDown') || tombol.has('KeyS') || kontrol.bawah) dy += 1

      if (dx !== 0 || dy !== 0) {
        const panjang = Math.hypot(dx, dy)
        const dangkal = this.diAirDangkal(this.pemain.x, this.pemain.y)
        const langkah = KECEPATAN * (dangkal ? LAJU_DANGKAL : 1) * dt
        const nx = this.pemain.x + (dx / panjang) * langkah
        if (!this.menabrak(nx, this.pemain.y)) this.pemain.x = nx
        const ny = this.pemain.y + (dy / panjang) * langkah
        if (!this.menabrak(this.pemain.x, ny)) this.pemain.y = ny

        if (Math.abs(dx) >= Math.abs(dy)) {
          this.arah = 'samping'
          this.pemain.setFlipX(dx < 0)
        } else {
          this.arah = dy > 0 ? 'bawah' : 'atas'
          this.pemain.setFlipX(false)
        }
        this.pemain.anims.play(`jalan_${this.arah}`, true)
        if (dangkal && this.time.now > this.riakBerikut) {
          this.riakBerikut = this.time.now + 260
          this.riak()
        }
      } else {
        this.pemain.anims.stop()
        this.pemain.setTexture(`pemain_${this.arah}_0`)
      }
    }
    // Urutan gambar berdasarkan titik kaki, sama seperti objek dunia
    this.pemain.setDepth(this.pemain.y + 16)
    this.labelSaya.setPosition(this.pemain.x, this.pemain.y - 20)
    this.kirimPosisiSaya()
    this.perbaruiPemainLain(dt)
    this.perbaruiGelembung()

    let terdekat = null
    let jarakMin = Infinity
    for (const o of this.interaktif) {
      const j = Phaser.Math.Distance.Between(this.pemain.x, this.pemain.y, o.x, o.y)
      if (j < (o.radius ?? JARAK_AKSI) && j < jarakMin) {
        terdekat = o
        jarakMin = j
      }
    }

    if (terdekat && boleh && !this.menyerang) {
      const teks = terdekat.jenis === 'petak' ? this.labelPetak(terdekat.indeks) : terdekat.label
      this.petunjuk
        .setText(`${teks}  [E]`)
        .setPosition(this.pemain.x, this.pemain.y - 40)
        .setVisible(true)
    } else {
      this.petunjuk.setVisible(false)
    }

    const tekan = (boleh && tekanE) || kontrol.aksi
    if (kontrol.aksi) kontrol.aksi = false
    if (tekan && terdekat && boleh) this.jalankanAksi(terdekat)
  }

  jalankanAksi(o) {
    if (o.jenis === 'gerbang') {
      this.scene.restart({ peta: o.ke })
      return
    }
    this.game.events.emit('interaksi', o)
  }
}