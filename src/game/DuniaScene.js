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
  gambarKios,
  gambarNaga,
  gambarNisan,
  gambarObor,
  gambarOrc,
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
} from './gambar'
import { DOMAIN_BOS, PETA, POSISI_PETAK, gambarTanah, posisiPatroli, sebarDekorasi } from './peta'

const KECEPATAN = 110
const JARAK_AKSI = 56
const JARAK_SERANG = 54
const JEDA_SERANG = 400
const DEPTH_UI = 100000
const WARNA_BUNGA = ['#e85d9a', '#f2c94c', '#7aa7f0']
const GAYA_LABEL = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.55)',
  padding: { x: 4, y: 2 },
}

const INFO_MUSUH = {
  goblin: { lebar: 32, tinggi: 32, radius: 16, kecepatan: 34 },
  serigala: { lebar: 32, tinggi: 32, radius: 18, kecepatan: 56 },
  kerangka: { lebar: 40, tinggi: 40, radius: 20, kecepatan: 28 },
  orc: { lebar: 40, tinggi: 40, radius: 22, kecepatan: 26 },
  naga: { lebar: 96, tinggi: 84, radius: 46, kecepatan: 0 },
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
    this.menyerang = false
    this.bolehSerangLagi = 0
  }

  create() {
    this.buatTekstur()
    this.buatAnimasi()
    const def = PETA[this.peta]
    const { lebar, tinggi } = def.ukuran

    this.physics.world.setBounds(0, 0, lebar, tinggi)
    this.cameras.main.setBounds(0, 0, lebar, tinggi)

    const kunciTanah = `tanah_${this.peta}`
    if (!this.textures.exists(kunciTanah)) this.textures.addCanvas(kunciTanah, gambarTanah(this.peta))
    this.add.image(0, 0, kunciTanah).setOrigin(0, 0).setDepth(-1000)

    this.rintangan = this.physics.add.staticGroup()
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
    if (def.label) def.label.forEach((l) => this.labelStatis(l.x, l.y, l.teks))
    this.tambahDekorasi(def)

    this.pemain = this.physics.add.sprite(def.mulai.x, def.mulai.y, 'pemain_bawah_0')
    this.pemain.setCollideWorldBounds(true)
    this.pemain.body.setSize(14, 10)
    this.pemain.body.setOffset(9, 20)
    this.physics.add.collider(this.pemain, this.rintangan)
    this.cameras.main.startFollow(this.pemain, true, 0.12, 0.12)

    this.petunjuk = this.add
      .text(0, 0, '', GAYA_LABEL)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI + 1)
      .setVisible(false)

    this.input.keyboard.disableGlobalCapture() // jangan memblokir ketikan di kolom input halaman
    this.kursor = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    this.tombolE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.tombolSpasi = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

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
    this.game.events.emit('peta', this.peta)
  }

  buatTekstur() {
    const tambah = (kunci, kanvas) => {
      if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    }
    const kosong = document.createElement('canvas')
    kosong.width = 1
    kosong.height = 1
    tambah('kosong', kosong)

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
    tambah('kios', gambarKios())
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

  // ---------- Pembangunan dunia ----------
  tambahRintangan(x, y, l, t) {
    const r = this.rintangan.create(x, y, 'kosong')
    r.setVisible(false)
    r.setDisplaySize(l, t)
    r.refreshBody()
  }

  labelStatis(x, y, teks) {
    return this.add.text(x, y, teks, GAYA_LABEL).setOrigin(0.5).setDepth(DEPTH_UI)
  }

  tambahKastil(p) {
    this.add.image(p.x, p.y, 'kastil').setOrigin(0.5, 1).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 24, 224, 48)
  }

  tambahGua(p) {
    this.add.image(p.x, p.y, 'gua').setOrigin(0.5, 1).setDepth(p.y - 60)
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
    this.add.image(t.x, t.y, 'kios').setOrigin(0.5, 1).setDepth(t.y)
    this.tambahRintangan(t.x, t.y - 16, 72, 32)
    this.labelStatis(t.x, t.y - 80, 'Clandys Swalayan')
    this.interaktif.push({ jenis: 'toko', x: t.x, y: t.y + 24, label: 'Buka toko', radius: 56 })
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
    const semak = (p) => this.add.image(p.x, p.y, 'semak').setOrigin(0.5, 1).setDepth(p.y)
    const bunga = (p) =>
      this.add.image(p.x, p.y, `bunga_${(p.x + p.y) % 3}`).setOrigin(0.5, 1).setDepth(p.y)
    const batu = (p) => {
      this.add.image(p.x, p.y, 'batu').setOrigin(0.5, 1).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 6, 24, 12)
    }
    const nisan = (p) => this.add.image(p.x, p.y, 'nisan').setOrigin(0.5, 1).setDepth(p.y)
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

  // ---------- Musuh bersama ----------
  buatSpawn(d) {
    const info = INFO_MUSUH[d.musuh_id]
    if (!info) return null
    const sprite = this.add.sprite(0, 0, `musuh_${d.musuh_id}_0`).setOrigin(0.5, 1)
    const latar = this.add.rectangle(0, 0, info.lebar, 5, 0x000000, 0.7).setDepth(DEPTH_UI)
    const isi = this.add
      .rectangle(0, 0, info.lebar - 2, 3, 0x59c35a)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_UI + 1)
    const nama = d.jenis === 'bos' ? this.labelStatis(0, 0, d.nama) : null
    return { data: d, info, sprite, latar, isi, nama, x: 0, y: 0, keadaan: null }
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
      m.nama?.destroy()
      this.spawnObj.delete(id)
    }
  }

  sembunyikan(m) {
    m.keadaan = 'hilang'
    m.sprite.setVisible(false)
    m.latar.setVisible(false)
    m.isi.setVisible(false)
    m.nama?.setVisible(false)
  }

  perbaruiMusuh() {
    if (this.spawnObj.size === 0) return
    const sekarang = Date.now() + (this.registry.get('selisihWaktu') ?? 0)

    for (const m of this.spawnObj.values()) {
      const d = m.data
      const info = m.info
      if (d.keadaan === 'hilang') {
        if (m.keadaan !== 'hilang') this.sembunyikan(m)
        continue
      }

      const pos =
        d.jenis === 'bos'
          ? { x: DOMAIN_BOS.x, y: DOMAIN_BOS.y, gerak: false, dx: 0 }
          : posisiPatroli(d.rute, d.fase, d.keadaan === 'mayat' ? Date.parse(d.mati_pada) : sekarang, info.kecepatan)
      m.x = pos.x
      m.y = pos.y
      m.sprite.setVisible(true)

      if (d.keadaan === 'mayat') {
        if (m.keadaan !== 'mayat') {
          m.sprite.anims.stop()
          m.sprite.setTexture(`musuh_${d.musuh_id}_0`)
          m.sprite.setOrigin(0.5, 0.5).setAngle(90).setTint(0x777777).setAlpha(0.85)
          m.keadaan = 'mayat'
        }
        m.sprite.setPosition(pos.x, pos.y - info.tinggi * 0.25).setDepth(pos.y - 1)
        m.latar.setVisible(false)
        m.isi.setVisible(false)
        m.nama?.setVisible(false)
        continue
      }

      if (m.keadaan !== 'hidup') {
        m.sprite.setOrigin(0.5, 1).setAngle(0).clearTint().setAlpha(1)
        m.keadaan = 'hidup'
      }
      m.sprite.anims.play(pos.gerak ? `jalan_${d.musuh_id}` : `idle_${d.musuh_id}`, true)
      if (pos.dx !== 0) m.sprite.setFlipX(pos.dx < 0)
      m.sprite.setPosition(pos.x, pos.y).setDepth(pos.y)

      const rasio = Math.max(0, d.hp / d.hp_maks)
      const tampilBar = rasio < 1 || d.jenis === 'bos'
      const barY = pos.y - info.tinggi - 8
      m.latar.setPosition(pos.x, barY).setVisible(tampilBar)
      m.isi
        .setPosition(pos.x - info.lebar / 2 + 1, barY)
        .setVisible(tampilBar)
        .setScale(Math.max(0.001, rasio), 1)
        .setFillStyle(rasio > 0.5 ? 0x59c35a : rasio > 0.25 ? 0xe0b030 : 0xd94a3d)
      if (m.nama) m.nama.setPosition(pos.x, barY - 12).setVisible(true)
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
    if (this.menyerang || this.registry.get('terkunci')) return
    if (this.time.now < this.bolehSerangLagi) return
    this.bolehSerangLagi = this.time.now + JEDA_SERANG
    this.menyerang = true

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
    this.pemain.setVelocity(0, 0)
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

  // Dipanggil React setelah server mengonfirmasi satu pukulan
  tampilkanPukulan(id, hasil) {
    const m = this.spawnObj.get(id)
    if (!m) return
    this.teksMelayang(m.x, m.y - m.info.tinggi - 14, `-${hasil.damage}`, '#ffd23f')
    if (!hasil.mati) {
      m.sprite.setTint(0xff8888)
      this.time.delayedCall(110, () => {
        if (m.keadaan === 'hidup') m.sprite.clearTint()
      })
    }
  }

  // ---------- Setiap frame ----------
  update() {
    const kontrol = this.registry.get('kontrol') ?? {}
    const terkunci = Boolean(this.registry.get('terkunci'))
    const el = document.activeElement
    const fokusInput = Boolean(el) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
    const boleh = !terkunci && !fokusInput

    this.perbaruiMusuh()

    if (boleh && (Phaser.Input.Keyboard.JustDown(this.tombolSpasi) || kontrol.serang)) this.serang(null)
    if (kontrol.serang) kontrol.serang = false

    if (this.menyerang || !boleh) {
      this.pemain.setVelocity(0, 0)
      if (!this.menyerang) {
        this.pemain.anims.stop()
        this.pemain.setTexture(`pemain_${this.arah}_0`)
      }
    } else {
      let dx = 0
      let dy = 0
      if (this.kursor.left.isDown || this.wasd.A.isDown || kontrol.kiri) dx -= 1
      if (this.kursor.right.isDown || this.wasd.D.isDown || kontrol.kanan) dx += 1
      if (this.kursor.up.isDown || this.wasd.W.isDown || kontrol.atas) dy -= 1
      if (this.kursor.down.isDown || this.wasd.S.isDown || kontrol.bawah) dy += 1

      if (dx !== 0 || dy !== 0) {
        const panjang = Math.hypot(dx, dy)
        this.pemain.setVelocity((dx / panjang) * KECEPATAN, (dy / panjang) * KECEPATAN)
        if (Math.abs(dx) >= Math.abs(dy)) {
          this.arah = 'samping'
          this.pemain.setFlipX(dx < 0)
        } else {
          this.arah = dy > 0 ? 'bawah' : 'atas'
          this.pemain.setFlipX(false)
        }
        this.pemain.anims.play(`jalan_${this.arah}`, true)
      } else {
        this.pemain.setVelocity(0, 0)
        this.pemain.anims.stop()
        this.pemain.setTexture(`pemain_${this.arah}_0`)
      }
    }
    this.pemain.setDepth(this.pemain.y)

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

    const tekan = (boleh && Phaser.Input.Keyboard.JustDown(this.tombolE)) || kontrol.aksi
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