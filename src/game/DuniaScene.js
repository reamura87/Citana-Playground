import Phaser from 'phaser'
import {
  JENIS_TANAMAN,
  WARNA_BAJU,
  WARNA_RAMBUT,
  gambarBatu,
  gambarBunga,
  gambarGerbang,
  gambarGoblin,
  gambarPapan,
  gambarPemain,
  gambarPetak,
  gambarPohon,
  gambarRumah,
  gambarSemak,
  gambarSerigala,
  gambarSlime,
  gambarTanaman,
  gambarToko,
} from './gambar'
import { PETA, POSISI_PETAK, SKALA, UKURAN_DUNIA, gambarTanah, sebarDekorasi } from './peta'

const KECEPATAN = 110
const JARAK_AKSI = 56
const DEPTH_UI = 100000
const WARNA_BUNGA = ['#e85d9a', '#f2c94c', '#7aa7f0']
const GAYA_LABEL = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.55)',
  padding: { x: 4, y: 2 },
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
    this.musuhObj = {}
    this.interaktif = []
  }

  create() {
    this.buatTekstur()
    this.buatAnimasi()
    const def = PETA[this.peta]
    const { lebar, tinggi } = UKURAN_DUNIA

    this.physics.world.setBounds(0, 0, lebar, tinggi)
    this.cameras.main.setBounds(0, 0, lebar, tinggi)

    const kunciTanah = `tanah_${this.peta}`
    if (!this.textures.exists(kunciTanah)) this.textures.addCanvas(kunciTanah, gambarTanah(this.peta))
    this.add.image(0, 0, kunciTanah).setOrigin(0, 0).setDepth(-1000)

    this.rintangan = this.physics.add.staticGroup()
    if (def.gerbang) this.tambahGerbang(def.gerbang)
    if (def.toko) this.tambahToko(def.toko)
    if (def.papan) this.tambahPapan(def.papan)
    if (def.musuh) def.musuh.forEach((m, i) => this.tambahMusuh(m, i))
    if (def.rumah) this.tambahRumah(def.rumah)
    if (this.peta === 'pribadi') this.tambahKebun()
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

    this.onStatus = () => this.terapkanStatus()
    this.registry.events.on('changedata-status', this.onStatus)
    this.events.once('shutdown', () => this.registry.events.off('changedata-status', this.onStatus))
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.perbaruiPetak() })

    this.terapkanStatus()
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

    const warna = this.registry.get('warna') ?? { baju: WARNA_BAJU[0], rambut: WARNA_RAMBUT[0] }
    for (const arah of ['bawah', 'atas', 'samping']) {
      for (const n of [0, 1, 2]) {
        tambah(`pemain_${arah}_${n}`, gambarPemain(arah, n, warna.baju, warna.rambut))
      }
    }
    tambah('musuh_slime', gambarSlime())
    tambah('musuh_goblin', gambarGoblin())
    tambah('musuh_serigala', gambarSerigala())
    tambah('pohon', gambarPohon())
    tambah('semak', gambarSemak())
    tambah('batu', gambarBatu())
    WARNA_BUNGA.forEach((w, i) => tambah(`bunga_${i}`, gambarBunga(w)))
    tambah('petak_buka', gambarPetak(false))
    tambah('petak_kunci', gambarPetak(true))
    for (const jenis of JENIS_TANAMAN) {
      for (const tahap of [0, 1, 2]) tambah(`tanaman_${jenis}_${tahap}`, gambarTanaman(jenis, tahap))
    }
    for (let l = 1; l <= 5; l += 1) tambah(`rumah_${l}`, gambarRumah(l))
    tambah('toko', gambarToko())
    tambah('gerbang', gambarGerbang())
    tambah('papan', gambarPapan())
  }

  buatAnimasi() {
    for (const arah of ['bawah', 'atas', 'samping']) {
      const kunci = `jalan_${arah}`
      if (this.anims.exists(kunci)) continue
      this.anims.create({
        key: kunci,
        frames: [1, 0, 2, 0].map((n) => ({ key: `pemain_${arah}_${n}` })),
        frameRate: 8,
        repeat: -1,
      })
    }
  }

  tambahRintangan(x, y, l, t) {
    const r = this.rintangan.create(x, y, 'kosong')
    r.setVisible(false)
    r.setDisplaySize(l, t)
    r.refreshBody()
  }

  labelStatis(x, y, teks) {
    return this.add.text(x, y, teks, GAYA_LABEL).setOrigin(0.5).setDepth(DEPTH_UI)
  }

  tambahGerbang(g) {
    const s = this.add.image(g.x, g.y, 'gerbang').setOrigin(0.5, 1).setScale(SKALA).setDepth(g.y)
    this.tweens.add({ targets: s, alpha: 0.75, yoyo: true, repeat: -1, duration: 900 })
    this.labelStatis(g.x, g.y - 106, g.label)
    this.interaktif.push({ jenis: 'gerbang', ke: g.ke, x: g.x, y: g.y + 10, label: g.label, radius: 60 })
  }

  tambahToko(t) {
    this.add.image(t.x, t.y, 'toko').setOrigin(0.5, 1).setScale(SKALA).setDepth(t.y)
    this.tambahRintangan(t.x, t.y - 30, 176, 60)
    this.labelStatis(t.x, t.y - 172, 'Toko')
    this.interaktif.push({ jenis: 'toko', x: t.x, y: t.y + 36, label: 'Buka toko', radius: 60 })
  }

  tambahPapan(p) {
    this.add.image(p.x, p.y, 'papan').setOrigin(0.5, 1).setScale(SKALA).setDepth(p.y)
    this.tambahRintangan(p.x, p.y - 6, 20, 12)
    this.interaktif.push({ jenis: 'papan', x: p.x, y: p.y + 14, label: 'Baca papan', radius: 50 })
  }

  tambahMusuh(m, i) {
    const sprite = this.add
      .image(m.x, m.y, `musuh_${m.id}`)
      .setOrigin(0.5, 1)
      .setScale(SKALA)
      .setDepth(m.y)
    this.tweens.add({
      targets: sprite,
      scaleY: SKALA * 0.94,
      yoyo: true,
      repeat: -1,
      duration: 700 + i * 90,
    })
    const label = this.labelStatis(m.x, m.y - 76, m.nama)
    this.musuhObj[m.id] = { sprite, label }
    this.interaktif.push({ jenis: 'musuh', id: m.id, x: m.x, y: m.y, label: `Lawan ${m.nama}`, radius: 56 })
  }

  tambahRumah(pos) {
    this.rumahSprite = this.add.image(pos.x, pos.y, 'rumah_1').setOrigin(0.5, 1).setScale(SKALA).setDepth(pos.y)
    this.tambahRintangan(pos.x, pos.y - 30, 176, 60)
    this.labelStatis(pos.x, pos.y - 172, 'Rumahku')
    this.interaktif.push({ jenis: 'rumah', x: pos.x, y: pos.y + 26, label: 'Rumah (upgrade)', radius: 60 })
  }

  tambahKebun() {
    POSISI_PETAK.forEach((pos, i) => {
      const tanah = this.add.image(pos.x, pos.y, 'petak_buka').setScale(SKALA).setDepth(1)
      const tanaman = this.add
        .image(pos.x, pos.y - 4, 'tanaman_wortel_0')
        .setScale(SKALA)
        .setDepth(pos.y)
        .setVisible(false)
      const label = this.labelStatis(pos.x, pos.y + 24, '').setDepth(DEPTH_UI)
      this.petakObj.push({ tanah, tanaman, label, keadaan: 'kosong' })
      this.interaktif.push({ jenis: 'petak', indeks: i, x: pos.x, y: pos.y, radius: 44 })
    })
  }

  tambahDekorasi(def) {
    const sudah = [...def.larangan]
    const taruh = (daftar, gambar) =>
      daftar.forEach((p) => {
        gambar(p)
        sudah.push([p.x - 24, p.y - 24, 48, 48])
      })
    const seed = this.peta === 'server' ? 101 : 202
    const pohon = (p) => {
      this.add.image(p.x, p.y, 'pohon').setOrigin(0.5, 1).setScale(SKALA).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 8, 20, 14)
    }
    const semak = (p) => this.add.image(p.x, p.y, 'semak').setOrigin(0.5, 1).setScale(SKALA).setDepth(p.y)
    const bunga = (p) =>
      this.add.image(p.x, p.y, `bunga_${(p.x + p.y) % 3}`).setOrigin(0.5, 1).setScale(SKALA).setDepth(p.y)
    const batu = (p) => {
      this.add.image(p.x, p.y, 'batu').setOrigin(0.5, 1).setScale(SKALA).setDepth(p.y)
      this.tambahRintangan(p.x, p.y - 6, 24, 12)
    }

    taruh(sebarDekorasi(seed, 18, sudah), pohon)
    if (def.zonaTaman) taruh(sebarDekorasi(seed + 1, 6, sudah, def.zonaTaman, 80), pohon)
    taruh(sebarDekorasi(seed + 2, 14, sudah, undefined, 60), semak)
    taruh(sebarDekorasi(seed + 3, 28, sudah, undefined, 40), bunga)
    if (def.zonaTaman) taruh(sebarDekorasi(seed + 4, 22, sudah, def.zonaTaman, 36), bunga)
    taruh(sebarDekorasi(seed + 5, 7, sudah, undefined, 90), batu)
  }

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

  update() {
    const kontrol = this.registry.get('kontrol') ?? {}
    const terkunci = Boolean(this.registry.get('terkunci'))
    const el = document.activeElement
    const fokusInput = Boolean(el) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
    const boleh = !terkunci && !fokusInput

    let dx = 0
    let dy = 0
    if (boleh) {
      if (this.kursor.left.isDown || this.wasd.A.isDown || kontrol.kiri) dx -= 1
      if (this.kursor.right.isDown || this.wasd.D.isDown || kontrol.kanan) dx += 1
      if (this.kursor.up.isDown || this.wasd.W.isDown || kontrol.atas) dy -= 1
      if (this.kursor.down.isDown || this.wasd.S.isDown || kontrol.bawah) dy += 1
    }

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

    if (terdekat && boleh) {
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

  teksMelayang(x, y, teks, warna) {
    const t = this.add
      .text(x, y, teks, { fontFamily: 'monospace', fontSize: '14px', color: warna, stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(DEPTH_UI + 2)
    this.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 700, onComplete: () => t.destroy() })
  }

  // Memutar ulang hasil pertarungan dari server (hanya tampilan)
  mainkanPertarungan(idMusuh, ronde, menang) {
    return new Promise((selesai) => {
      const m = this.musuhObj[idMusuh]
      if (!m) {
        selesai()
        return
      }
      const langkah = ronde.slice(0, 12)
      langkah.forEach((r, i) => {
        this.time.delayedCall(i * 320, () => {
          const pemainMenyerang = r.oleh === 'pemain'
          const target = pemainMenyerang ? m.sprite : this.pemain
          const tinggi = pemainMenyerang ? 70 : 34
          this.teksMelayang(target.x, target.y - tinggi, `-${r.damage}`, pemainMenyerang ? '#ffd23f' : '#ff6b6b')
          target.setTint(0xff9999)
          this.time.delayedCall(120, () => target.clearTint())
        })
      })
      this.time.delayedCall(langkah.length * 320 + 200, () => {
        if (menang) {
          m.sprite.setAlpha(0.15)
          this.time.delayedCall(1500, () => m.sprite.setAlpha(1))
        }
        selesai()
      })
    })
  }
}