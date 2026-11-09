import Phaser from 'phaser'
import { DIALOG } from '../dialog'
import { rupaDariKustom } from '../gambar'
import { WAJAH, gambarIkon, gambarIkonSkill, gambarKelas, gambarWajah } from '../seni'
import { suara } from '../suara'
import { LAYAR } from './layar'
import { L, T, WARNA, formatSisa, gambarJendela, gaya, rupiah } from './gaya'

const TAHAN_AWAL = 380
const TAHAN_ULANG = 110
const ARAH = ['atas', 'bawah', 'kiri', 'kanan']

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('ui')
  }

  create() {
    this.hidup = true
    this.tumpukan = []
    this.lapis = null
    this.dialog = null
    this.lapisDialog = null
    this.toastBox = null
    this.toastWaktu = null
    this.sekitar = []
    this.peta = 'server'
    this.aman = false
    this.target = null
    this.sibukLokal = false
    this.seret = null
    this.tahan = { atas: 0, bawah: 0, kiri: 0, kanan: 0 }
    this.ulang = { atas: 0, bawah: 0, kiri: 0, kanan: 0 }
    this.buatHud()
    this.pasangEvent()
    if (this.registry.get('mode') === 'karakter') {
      this.add.rectangle(0, 0, L, T, 0x0b1030).setOrigin(0).setDepth(0)
      this.buka('kreator', { mode: 'awal', tetap: true })
    }
  }

  // ---------- Akses data ----------
  status() { return this.registry.get('status') }
  katalog() { return this.registry.get('katalog') }
  dunia() { return this.registry.get('dunia') }
  api() { return this.registry.get('api') }
  sibuk() { return this.sibukLokal || Boolean(this.registry.get('sibuk')) }
  atas() { return this.tumpukan[this.tumpukan.length - 1] }
  tandaiKlik() { this.registry.set('klikUI', performance.now()) }

  tulis(x, y, teks, ukuran = 13, warna = WARNA.teks, opsi = {}) {
    const t = this.add.text(x, y, teks, gaya(ukuran, warna, opsi))
    t.setResolution?.(2)
    return t
  }

  // ---------- Pemasangan event ----------
  pasangEvent() {
    const ev = this.game.events
    const daftar = [
      ['hadiah', (h) => this.buka('hadiah', h)],
      ['toast', (t) => this.toast(t)],
      ['peta', (n) => {
        this.peta = n
        suara.setSuasana(n === 'pribadi' ? 'rumah' : n === 'dungeon' ? 'kripta' : 'kerajaan')
      }],
      ['zona-aman', (v) => { this.aman = v }],
      ['pemain-sekitar', (d) => { this.sekitar = d }],
      ['target', (t) => { this.target = { ...t, sampai: performance.now() + 6000 } }],
      ['tombol', (n) => this.saatTombol(n)],
      ['interaksi', (o) => this.saatInteraksi(o)],
    ]
    for (const [nama, fn] of daftar) ev.on(nama, fn)
    const tekan = (e) => this.saatKey(e)
    window.addEventListener('keydown', tekan)
    const data = () => {
      if (this.hidup && this.tumpukan.length) this.render()
    }
    const kunciData = ['status', 'dunia', 'katalog', 'skillSaya']
    for (const k of kunciData) this.registry.events.on(`changedata-${k}`, data)
    this.input.on('pointerdown', (p) => {
      this.seret = { y0: p.y, g0: this.atas()?.gulir ?? 0, gerak: false }
    })
    this.input.on('pointermove', (p) => this.saatGeser(p))
    this.input.on('wheel', (p, o, dx, dy) => this.saatRoda(dy))
    const bersih = () => {
      if (!this.hidup) return
      this.hidup = false
      for (const [nama, fn] of daftar) ev.off(nama, fn)
      window.removeEventListener('keydown', tekan)
      for (const k of kunciData) this.registry.events.off(`changedata-${k}`, data)
      document.documentElement.dataset.gameUi = '0'
    }
    this.events.once('shutdown', bersih)
    this.events.once('destroy', bersih)
  }

  // ---------- HUD ----------
  buatHud() {
    const t = (x, y, s, ukuran, warna, o = {}) =>
      this.tulis(x, y, s, ukuran, warna, { stroke: '#000000', strokeThickness: 3, ...o })
    this.hNama = t(8, 2, '', 13)
    this.hHpLatar = this.add.rectangle(8, 20, 130, 13, 0x000000, 0.65).setOrigin(0)
    this.hHpIsi = this.add.rectangle(9, 21, 128, 11, 0xd94a3d).setOrigin(0)
    this.hHpTeks = t(73, 21, '', 10).setOrigin(0.5, 0)
    this.hXpLatar = this.add.rectangle(8, 35, 130, 5, 0x000000, 0.65).setOrigin(0)
    this.hXpIsi = this.add.rectangle(9, 36, 128, 3, 0xe0b030).setOrigin(0)
    this.hGold = t(472, 30, '', 13, WARNA.emas).setOrigin(1, 0)
    this.hAman = t(472, 46, '', 11, WARNA.hijau).setOrigin(1, 0)
    this.hMenu = this.add
      .rectangle(420, 4, 52, 22, WARNA.jendela, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, WARNA.garis)
      .setInteractive({ useHandCursor: true })
    this.hMenu.on('pointerdown', () => this.tandaiKlik())
    this.hMenu.on('pointerup', () => this.alihMenu())
    this.hMenuTeks = this.tulis(446, 8, 'MENU', 11, WARNA.teks).setOrigin(0.5, 0)

    const bar = (y) => ({
      nama: t(240, y, '', 11).setOrigin(0.5, 0),
      latar: this.add.rectangle(160, y + 14, 160, 8, 0x000000, 0.65).setOrigin(0),
      isi: this.add.rectangle(161, y + 15, 158, 6, 0xd94a3d).setOrigin(0),
    })
    this.hTarget = bar(4)
    this.hBos = bar(30)
    this.hForageNama = t(240, 274, '', 11).setOrigin(0.5, 0)
    this.hForageLatar = this.add.rectangle(160, 290, 160, 9, 0x000000, 0.65).setOrigin(0)
    this.hForageIsi = this.add.rectangle(161, 291, 158, 7, 0xe0b030).setOrigin(0)

    this.hud = this.add
      .container(0, 0, [
        this.hNama, this.hHpLatar, this.hHpIsi, this.hHpTeks, this.hXpLatar, this.hXpIsi, this.hGold, this.hAman,
        this.hMenu, this.hMenuTeks,
        this.hTarget.nama, this.hTarget.latar, this.hTarget.isi,
        this.hBos.nama, this.hBos.latar, this.hBos.isi,
        this.hForageNama, this.hForageLatar, this.hForageIsi,
      ])
      .setDepth(10)

    // Bilah skill: 4 slot di kiri bawah
    this.hSkill = [0, 1, 2, 3].map((i) => {
      const x = 8 + i * 36
      const y = 280
      const bingkai = this.add
        .rectangle(x, y, 32, 32, 0x0b1030, 0.75)
        .setOrigin(0)
        .setStrokeStyle(1, WARNA.garisDalam)
        .setInteractive({ useHandCursor: true })
      bingkai.on('pointerdown', () => this.tandaiKlik())
      bingkai.on('pointerup', () => this.game.events.emit('skill', i + 1))
      const ikon = this.add.image(x + 4, y + 4, 'cahaya').setOrigin(0).setDisplaySize(24, 24).setVisible(false)
      const cd = this.add.rectangle(x + 1, y + 1, 30, 30, 0x000000, 0.65).setOrigin(0).setVisible(false)
      const detik = t(x + 16, y + 9, '', 13).setOrigin(0.5, 0)
      const kunci = t(x + 3, y + 1, String(i + 1), 9, WARNA.emas)
      this.hud.add([bingkai, ikon, cd, detik, kunci])
      return { bingkai, ikon, cd, detik, id: null }
    })

    this.matiTeks = this.tulis(240, 156, '', 14).setOrigin(0.5)
    this.mati = this.add
      .container(0, 0, [
        this.add.rectangle(0, 0, L, T, 0x0a0606, 0.72).setOrigin(0),
        this.tulis(240, 118, 'Kamu gugur', 24, WARNA.bahaya).setOrigin(0.5),
        this.matiTeks,
      ])
      .setDepth(20)
      .setVisible(false)
  }

  barMusuh(b, d) {
    const tampil = Boolean(d)
    b.nama.setVisible(tampil)
    b.latar.setVisible(tampil)
    b.isi.setVisible(tampil)
    if (!d) return
    b.nama.setText(`${d.nama}  ${d.hp}/${d.maks}`)
    b.isi.setSize(Math.max(0, Math.round(158 * (d.hp / d.maks))), 6)
  }

  perbaruiHud() {
    const st = this.status()
    const dunia = this.registry.get('mode') === 'dunia'
    const tampil = Boolean(st) && dunia && !this.tumpukan.length && !this.dialog
    this.hud.setVisible(tampil)
    if (!st || !dunia) {
      this.mati.setVisible(false)
      return
    }
    const p = st.pemain
    const sekarang = Date.now() + (this.registry.get('selisihWaktu') ?? 0)
    if (p.mati_sampai) {
      this.mati.setVisible(true)
      this.matiTeks.setText(`Hidup kembali di desa dalam ${formatSisa(Date.parse(p.mati_sampai) - sekarang)}`)
    } else {
      this.mati.setVisible(false)
    }
    if (!tampil) return

    const sejak = Math.max(0, sekarang - Date.parse(st.waktu_server))
    const hp = p.mati_sampai ? 0 : Math.min(p.hp_maks, p.hp + Math.floor(sejak / 4000))
    this.hNama.setText(`${p.nama} Lv${p.level}`)
    this.hHpIsi.setSize(Math.max(0, Math.round(128 * (hp / p.hp_maks))), 11)
    this.hHpTeks.setText(`${hp}/${p.hp_maks}`)
    this.hXpIsi.setSize(Math.round(128 * Math.min(1, p.xp / p.xp_butuh)), 3)
    this.hGold.setText(`${rupiah(p.gold)} G`)
    this.hAman.setText(this.aman ? 'Zona aman' : '')

    const slots = this.registry.get('slotSkill') ?? []
    for (let i = 0; i < 4; i += 1) {
      const s = slots[i]
      const o = this.hSkill[i]
      if (!s?.ada) {
        o.ikon.setVisible(false)
        o.cd.setVisible(false)
        o.detik.setText('')
        o.bingkai.setAlpha(0.45)
        continue
      }
      o.bingkai.setAlpha(1)
      if (o.id !== s.id) {
        o.id = s.id
        o.ikon.setTexture(this.ikonSkill(s.id))
      }
      o.ikon.setVisible(true)
      const sisa = Math.max(0, s.akhir - Date.now())
      if (sisa > 0) {
        o.cd.setVisible(true).setSize(30, Math.max(1, Math.round(30 * Math.min(1, sisa / s.total))))
        o.detik.setText(String(Math.ceil(sisa / 1000)))
      } else {
        o.cd.setVisible(false)
        o.detik.setText('')
      }
    }

    const tg = this.target && performance.now() < this.target.sampai ? this.target : null
    this.barMusuh(this.hTarget, tg ? { nama: tg.nama, hp: tg.hp, maks: tg.hp_maks } : null)
    const bos = this.peta === 'server' || this.peta === 'dungeon' ? this.dunia()?.spawn.find((s) => s.jenis === 'bos') : null
    this.barMusuh(
      this.hBos,
      bos ? { nama: `${bos.nama}${bos.keadaan === 'hidup' ? '' : ' (kalah)'}`, hp: bos.hp, maks: bos.hp_maks } : null,
    )

    const f = this.registry.get('forage')
    this.hForageNama.setVisible(Boolean(f))
    this.hForageLatar.setVisible(Boolean(f))
    this.hForageIsi.setVisible(Boolean(f))
    if (f) {
      this.hForageNama.setText(`${f.jenis === 'ore' ? 'Menambang' : 'Mengumpulkan'} ${f.nama}`)
      this.hForageIsi.setSize(Math.max(1, Math.round(158 * Math.min(1, (Date.now() - f.mulai) / f.durasi))), 7)
    }
  }

  toast(teks) {
    if (!teks || !this.hidup) return
    this.toastBox?.destroy(true)
    const t = this.tulis(0, 0, teks, 13, WARNA.teks, { wordWrap: { width: 420 }, align: 'center' })
    const w = Math.min(448, t.width + 24)
    const h = t.height + 16
    const x = (L - w) / 2
    const y = T - h - 8 - (this.dialog ? 108 : 0)
    const g = this.add.graphics()
    gambarJendela(g, x, y, w, h, 0.94)
    t.setPosition(L / 2, y + 8).setOrigin(0.5, 0)
    this.toastBox = this.add.container(0, 0, [g, t]).setDepth(300)
    this.toastWaktu?.remove()
    this.toastWaktu = this.time.delayedCall(3800, () => {
      this.toastBox?.destroy(true)
      this.toastBox = null
    })
  }

  // ---------- Siklus per frame ----------
  update(waktu, delta) {
    this.perbaruiHud()
    this.pollArah(waktu)
    if (this.dialog) {
      if (!this.dialog.selesai) {
        this.dialog.huruf += delta * 0.045
        this.perbaruiTeksDialog()
      }
      this.dialog.panah?.setAlpha(0.5 + 0.5 * Math.sin(waktu / 200))
    }
  }

  // D-pad HTML dibaca sebagai navigasi saat jendela atau dialog terbuka
  pollArah(waktu) {
    if (!(this.dialog || this.tumpukan.length)) {
      for (const a of ARAH) this.tahan[a] = 0
      return
    }
    const k = this.registry.get('kontrol')
    for (const a of ARAH) {
      if (k?.[a]) {
        if (!this.tahan[a]) {
          this.tahan[a] = waktu
          this.ulang[a] = waktu + TAHAN_AWAL
          this.arah(a)
        } else if (waktu >= this.ulang[a]) {
          this.ulang[a] = waktu + TAHAN_ULANG
          this.arah(a)
        }
      } else {
        this.tahan[a] = 0
      }
    }
  }

  // ---------- Masukan ----------
  saatTombol(n) {
    if (n === 'START') this.alihMenu()
    else if (n === 'A') this.konfirmasi()
    else if (n === 'B') this.batal()
  }

  saatKey(e) {
    const tag = document.activeElement?.tagName
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return
    if (!(this.dialog || this.tumpukan.length)) {
      if (e.code === 'Escape' && this.registry.get('mode') === 'dunia' && !e.repeat) {
        e.preventDefault()
        this.alihMenu()
      }
      return
    }
    const peta = {
      ArrowUp: 'atas', KeyW: 'atas', ArrowDown: 'bawah', KeyS: 'bawah',
      ArrowLeft: 'kiri', KeyA: 'kiri', ArrowRight: 'kanan', KeyD: 'kanan',
    }
    if (peta[e.code]) this.arah(peta[e.code])
    else if (['Enter', 'Space', 'KeyE'].includes(e.code)) {
      if (!e.repeat) this.konfirmasi()
    } else if (['Escape', 'Backspace', 'KeyQ', 'KeyX'].includes(e.code)) {
      if (!e.repeat) this.batal()
    } else return
    e.preventDefault()
  }

  saatGeser(p) {
    const ent = this.atas()
    if (!ent?.desc || !this.seret || !p.isDown) return
    const dy = p.y - this.seret.y0
    if (Math.abs(dy) > 10) this.seret.gerak = true
    if (!this.seret.gerak) return
    const g = Phaser.Math.Clamp(this.seret.g0 - Math.round(dy / 28), 0, Math.max(0, ent.desc.baris.length - 1))
    if (g !== ent.gulir) {
      ent.gulir = g
      ent.pilih = g
      this.render()
    }
  }

  saatRoda(dy) {
    const ent = this.atas()
    if (ent?.desc) this.geser(ent, dy > 0 ? 1 : -1)
  }

  geser(ent, delta) {
    const baris = ent.desc.baris
    let i = ent.pilih
    for (let n = 0; n < baris.length; n += 1) {
      i = (i + delta + baris.length) % baris.length
      if (!baris[i].pemisah) {
        ent.pilih = i
        break
      }
    }
    this.render()
  }

  arah(a) {
    if (this.dialog) {
      const d = this.dialog
      if (d.pilihan && (a === 'atas' || a === 'bawah')) {
        d.pilih = (d.pilih + (a === 'bawah' ? 1 : -1) + d.pilihan.length) % d.pilihan.length
        this.renderDialog()
      }
      return
    }
    const ent = this.atas()
    if (!ent?.desc) return
    if (a === 'atas' || a === 'bawah') {
      this.geser(ent, a === 'bawah' ? 1 : -1)
      return
    }
    const nilai = a === 'kanan' ? 1 : -1
    const b = ent.desc.baris[ent.pilih]
    if (b?.ubah) {
      b.ubah(nilai)
      return
    }
    const tab = ent.desc.tab
    if (tab) {
      const n = tab.daftar.length
      tab.pilih((tab.aktif + nilai + n) % n)
    }
  }

  konfirmasi() {
    if (this.dialog) {
      this.konfirmasiDialog()
      return
    }
    const ent = this.atas()
    if (ent?.desc) this.aktifkan(ent, ent.pilih)
  }

  batal() {
    if (this.dialog) {
      this.batalDialog()
      return
    }
    this.kembali()
  }

  alihMenu() {
    if (this.registry.get('mode') !== 'dunia' || this.dialog) return
    if (this.tumpukan.length) {
      this.tutupSemua()
      return
    }
    if (this.registry.get('mati') || !this.status() || this.sibuk()) return
    this.buka('menu')
  }

  // ---------- Interaksi dengan dunia ----------
  saatInteraksi(o) {
    if (this.dialog || this.tumpukan.length || this.sibuk() || this.registry.get('mati')) return
    switch (o.jenis) {
      case 'toko': this.bukaDialog('pandai'); break
      case 'rumah': this.buka('rumah'); break
      case 'papan': this.buka('papan'); break
      case 'npc': this.bukaDialog(o.npc); break
      case 'petak': this.aksiPetak(o.indeks); break
      case 'dungeon': this.buka('dungeon'); break
      case 'keluar_dungeon': this.buka('keluarDungeon'); break
      case 'mata_air': this.api().dungeonPulih(); break
      case 'peti': this.bukaPeti(o.idx); break
      default: break // titik foraging ditangani halaman
    }
  }

  aksiPetak(i) {
    const st = this.status()
    const petak = st.petak.find((x) => x.indeks === i)
    if (!petak) {
      this.buka('tanam', { indeks: i })
      return
    }
    if (Date.parse(petak.siap_pada) > Date.now() + (this.registry.get('selisihWaktu') ?? 0)) {
      this.toast('Tanaman belum siap dipanen.')
      return
    }
    this.api().panen(i)
  }

  // ---------- Jendela ----------
  buka(id, param = {}) {
    this.tumpukan.push({ id, param, pilih: 0, gulir: 0, tab: 0, data: null, desc: null })
    this.registry.set('uiBuka', true)
    document.documentElement.dataset.gameUi = '1'
    suara.sfx('klik')
    this.render()
  }

  tanya(param) {
    this.buka('tanya', param)
  }

  kembali() {
    const ent = this.atas()
    if (!ent || ent.param?.tetap) return
    this.tumpukan.pop()
    this.render()
    this.tutupJikaKosong()
  }

  tutupSemua() {
    this.tumpukan = []
    this.render()
    this.tutupJikaKosong()
  }

  // Jeda singkat agar tombol yang sama tidak langsung diteruskan ke dunia game
  tutupJikaKosong() {
    if (this.tumpukan.length || this.dialog) return
    this.time.delayedCall(120, () => {
      if (this.hidup && !this.tumpukan.length && !this.dialog) {
        this.registry.set('uiBuka', false)
        document.documentElement.dataset.gameUi = '0'
      }
    })
  }

  render() {
    if (!this.hidup) return
    this.lapis?.destroy(true)
    this.lapis = null
    const ent = this.atas()
    if (!ent) return
    const desc = LAYAR[ent.id](this, ent)
    ent.desc = desc
    this.lapis = this.gambarLayar(desc, ent)
  }

  async aktifkan(ent, i) {
    const b = ent.desc?.baris[i]
    if (!b || b.pemisah || this.sibuk()) return
    suara.sfx('klik')
    ent.pilih = i
    if (b.aktif === false) {
      if (b.alasan) this.toast(b.alasan)
      this.render()
      return
    }
    if (b.ubah) {
      b.ubah(1)
      return
    }
    this.sibukLokal = true
    try {
      await b.aksi?.()
    } finally {
      this.sibukLokal = false
    }
    if (this.hidup && this.atas() === ent) this.render()
  }

    async bukaPeti(idx) {
    const p = this.dunia()?.peti?.find((x) => x.idx === idx)
    if (p?.dibuka) {
      this.toast('Peti ini sudah dibuka.')
      return
    }
    this.sibukLokal = true
    const r = await this.api().dungeonPeti(idx)
    this.sibukLokal = false
    if (r && this.hidup) this.buka('hadiah', { judul: 'Isi peti', gold: r.gold, loot: r.loot })
  }


  pratinjauKarakter(kelas, kustom) {
    const rupa = rupaDariKustom(kustom)
    const bentuk = [['bawah', null], ['samping', null], ['atas', null], ['samping', 1]]
    return bentuk.map(([arah, serang], i) => {
      const kunci = `prev_${i}`
      if (this.textures.exists(kunci)) this.textures.remove(kunci)
      this.textures.addCanvas(kunci, gambarKelas(kelas, arah, 0, rupa.baju, serang, rupa))
      return kunci
    })
  }

    // Kunci tekstur ikon sebuah item (dibuat sekali saja)
  ikon(item) {
    if (!item) return null
    const kunci = `ikon_${item.id}`
    if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, gambarIkon(item))
    return kunci
  }

  ikonSkill(id) {
    const kunci = `skill_${id}`
    if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, gambarIkonSkill(id))
    return kunci
  }

  gambarLayar(d, ent) {
    const c = this.add.container(0, 0).setDepth(100)
    const kecil = Boolean(d.kecil)
    const tinggiBaris = (b) => (b.pemisah ? 22 : 30 + (b.sub ? (b.sub.length > (b.ikon ? 46 : 56) ? 26 : 13) : 0))
    const W = kecil ? (d.lebar ?? 300) : 456
    let H = 300
    if (kecil) {
      H = Math.min(290, 48 + (d.info?.length ?? 0) * 16 + d.baris.reduce((a, b) => a + tinggiBaris(b), 0) + 10)
    }
    const X = Math.round((L - W) / 2)
    const Y = kecil ? Math.round((T - H) / 2) : 10

    const redam = this.add.rectangle(0, 0, L, T, 0x000000, kecil ? 0.55 : 0.4).setOrigin(0).setInteractive()
    redam.on('pointerdown', () => this.tandaiKlik())
    const g = this.add.graphics()
    gambarJendela(g, X, Y, W, H)
    c.add([redam, g])
    c.add(this.tulis(X + 14, Y + 9, d.judul, 16, WARNA.emas))
    if (!ent.param?.tetap) {
      const x = this.tulis(X + W - 28, Y + 6, 'X', 16, WARNA.redup).setInteractive({ useHandCursor: true })
      x.on('pointerup', () => {
        if (!this.seret?.gerak) this.kembali()
      })
      c.add(x)
    }

    let y = Y + 34
    if (d.tab) {
      const n = d.tab.daftar.length
      const lebarTab = Math.floor((W - 24) / n)
      d.tab.daftar.forEach((nama, i) => {
        const aktif = i === d.tab.aktif
        const r = this.add
          .rectangle(X + 12 + i * lebarTab, y, lebarTab - 4, 22, aktif ? 0x3a4a9a : 0x161c48, 0.95)
          .setOrigin(0)
          .setStrokeStyle(1, aktif ? WARNA.garis : WARNA.garisDalam)
          .setInteractive({ useHandCursor: true })
        r.on('pointerup', () => {
          if (!this.seret?.gerak) d.tab.pilih(i)
        })
        c.add(r)
        c.add(
          this.tulis(X + 12 + i * lebarTab + (lebarTab - 4) / 2, y + 4, nama, 11, aktif ? WARNA.emas : WARNA.redup).setOrigin(0.5, 0),
        )
      })
      y += 28
    }

    const tulisInfo = (x0, y0, lebar, ukuran) => {
      let yy = y0
      for (const baris of d.info ?? []) {
        const s = typeof baris === 'string' ? { t: baris } : baris
        const tx = this.tulis(x0, yy, s.t, ukuran, s.warna ?? WARNA.redup, { wordWrap: { width: lebar } })
        c.add(tx)
        yy += tx.height + 3
      }
      return yy
    }

    let xr = X + 10
    let wr = W - 20
    if (d.pratinjau) {
      d.pratinjau.forEach((kunci, i) => {
        c.add(
          this.add.image(X + 12 + (i % 2) * 68, y + Math.floor(i / 2) * 68, kunci).setOrigin(0).setDisplaySize(64, 64),
        )
      })
      tulisInfo(X + 12, y + 140, 136, 11)
      xr = X + 160
      wr = W - 170
    } else {
      y = tulisInfo(X + 16, y, W - 32, 12) + 2
      for (const para of d.paragraf ?? []) {
        const tx = this.tulis(X + 16, y, para, 13, WARNA.teks, { wordWrap: { width: W - 32 }, lineSpacing: 2 })
        c.add(tx)
        y += tx.height + 8
      }
    }

    // Baris daftar (hanya yang muat yang digambar, jadi tanpa masker)
    const yAkhir = Y + H - 26
    const baris = d.baris
    ent.pilih = Phaser.Math.Clamp(ent.pilih, 0, Math.max(0, baris.length - 1))
    let mulai = Math.min(ent.gulir, Math.max(0, baris.length - 1))
    if (ent.pilih < mulai) mulai = ent.pilih
    const muat = (m) => {
      let yy = y
      let n = 0
      for (let i = m; i < baris.length; i += 1) {
        const h = tinggiBaris(baris[i])
        if (yy + h > yAkhir) break
        yy += h
        n += 1
      }
      return n
    }
    while (ent.pilih >= mulai + muat(mulai) && mulai < ent.pilih) mulai += 1
    ent.gulir = mulai

    let yy = y
    let tergambar = 0
    for (let i = mulai; i < baris.length; i += 1) {
      const h = tinggiBaris(baris[i])
      if (yy + h > yAkhir) break
      this.gambarBaris(c, baris[i], i === ent.pilih, xr, yy, wr, h, ent, i)
      yy += h
      tergambar += 1
    }
    if (mulai > 0) c.add(this.tulis(X + W - 24, y - 2, '^', 12, WARNA.emas))
    if (mulai + tergambar < baris.length) c.add(this.tulis(X + W - 24, yAkhir - 12, 'v', 12, WARNA.emas))
    c.add(this.tulis(X + 16, Y + H - 20, d.kaki ?? 'A: pilih · B: kembali', 10, WARNA.redup))
    return c
  }

  gambarBaris(c, b, pilih, x, y, w, h, ent, i) {
    if (b.pemisah) {
      c.add(this.tulis(x + 8, y + 4, b.teks, 11, b.warna ?? WARNA.redup, { wordWrap: { width: w - 16 } }))
      return
    }
    const aktif = b.aktif !== false
    if (pilih) {
      c.add(this.add.rectangle(x + 2, y + 1, w - 4, h - 2, WARNA.sorot, 0.16).setOrigin(0))
      c.add(this.tulis(x + 6, y + 7, '>', 14, WARNA.emas))
    }
    const geser = b.ikon ? 30 : 0
    if (b.ikon) c.add(this.add.image(x + 22, y + 3, b.ikon).setOrigin(0).setAlpha(aktif ? 1 : 0.55))
    c.add(this.tulis(x + 22 + geser, y + 7, b.teks, 14, aktif ? WARNA.teks : WARNA.nonaktif))
    if (b.ubah) {
      const kn = this.tulis(x + w - 12, y + 7, '>', 15, WARNA.emas).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      const kr = this.tulis(x + w - 156, y + 7, '<', 15, WARNA.emas).setInteractive({ useHandCursor: true })
      kn.on('pointerup', () => {
        if (this.seret?.gerak) return
        ent.pilih = i
        b.ubah(1)
      })
      kr.on('pointerup', () => {
        if (this.seret?.gerak) return
        ent.pilih = i
        b.ubah(-1)
      })
      c.add([kn, kr])
      c.add(this.tulis(x + w - 84, y + 7, String(b.kanan ?? ''), 13, WARNA.emas).setOrigin(0.5, 0))
      if (b.warna !== undefined) {
        c.add(this.add.rectangle(x + w - 176, y + 8, 14, 14, b.warna).setOrigin(0).setStrokeStyle(1, 0xffffff))
      }
    } else if (b.kanan) {
      c.add(this.tulis(x + w - 8, y + 7, String(b.kanan), 13, b.warnaKanan ?? WARNA.emas).setOrigin(1, 0))
    }
    if (b.sub) c.add(this.tulis(x + 22 + geser, y + 26, b.sub, 11, WARNA.redup, { wordWrap: { width: w - 34 - geser } }))
    const z = this.add
      .rectangle(x, y, b.ubah ? w - 190 : w, h, 0xffffff, 0.001)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
    z.on('pointerup', () => {
      if (this.seret?.gerak) return
      this.aktifkan(ent, i)
    })
    c.add(z)
  }

  // ---------- Dialog NPC ----------
  isi(teks) {
    return teks.replace('{nama}', this.status()?.pemain.nama ?? 'petualang')
  }

  kunciWajah(id) {
    const kunci = `wajah_${id}`
    if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, gambarWajah(WAJAH[id]))
    return kunci
  }

  bukaDialog(id) {
    const data = DIALOG[id]
    if (!data || this.dialog || this.tumpukan.length) return
    this.registry.set('uiBuka', true)
    document.documentElement.dataset.gameUi = '1'
    this.dialog = {
      id, data, halaman: data.buka.map((t) => this.isi(t)),
      i: 0, huruf: 0, selesai: false, pilihan: null, pilih: 0, teksObj: null, panah: null,
    }
    suara.sfx('klik')
    this.renderDialog()
  }

  renderDialog() {
    this.lapisDialog?.destroy(true)
    const d = this.dialog
    if (!d) {
      this.lapisDialog = null
      return
    }
    const c = this.add.container(0, 0).setDepth(120)
    const sentuh = this.add.rectangle(0, 0, L, T, 0x000000, 0.001).setOrigin(0).setInteractive()
    sentuh.on('pointerdown', () => this.tandaiKlik())
    sentuh.on('pointerup', () => {
      if (!d.pilihan) this.konfirmasiDialog()
    })
    c.add(sentuh)

    const X = 8
    const W = 464
    const H = 100
    const Y = T - H - 8
    const g = this.add.graphics()
    gambarJendela(g, X, Y, W, H, 0.94)
    c.add(g)
    c.add(this.add.image(X + 8, Y + 2, this.kunciWajah(d.data.wajah)).setOrigin(0).setDisplaySize(96, 96))

    const nama = this.tulis(0, 0, d.data.nama, 13, WARNA.emas)
    const lebarNama = nama.width + 22
    const gn = this.add.graphics()
    gambarJendela(gn, X + 12, Y - 22, lebarNama, 24, 0.96)
    c.add(gn)
    nama.setPosition(X + 23, Y - 17)
    c.add(nama)

    d.teksObj = this.tulis(X + 116, Y + 12, '', 14, WARNA.teks, { wordWrap: { width: W - 132 }, lineSpacing: 4 })
    c.add(d.teksObj)
    d.panah = this.tulis(X + W - 28, Y + H - 22, 'v', 14, WARNA.emas).setVisible(false)
    c.add(d.panah)

    if (d.pilihan) {
      const n = d.pilihan.length
      const hp = n * 28 + 12
      const wp = 230
      const xp = L - 8 - wp
      const yp = Y - hp - 6
      const gp = this.add.graphics()
      gambarJendela(gp, xp, yp, wp, hp, 0.96)
      c.add(gp)
      d.pilihan.forEach((o, i) => {
        const yy = yp + 6 + i * 28
        if (i === d.pilih) c.add(this.add.rectangle(xp + 6, yy, wp - 12, 26, WARNA.sorot, 0.18).setOrigin(0))
        c.add(this.tulis(xp + 14, yy + 5, `${i === d.pilih ? '> ' : '  '}${o.teks}`, 14, WARNA.teks))
        const z = this.add.rectangle(xp, yy, wp, 26, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true })
        z.on('pointerup', () => {
          d.pilih = i
          this.pilihDialog()
        })
        c.add(z)
      })
    }
    this.lapisDialog = c
    this.perbaruiTeksDialog()
  }

  perbaruiTeksDialog() {
    const d = this.dialog
    if (!d?.teksObj) return
    const penuh = d.halaman[d.i]
    const n = Math.min(penuh.length, Math.floor(d.huruf))
    d.teksObj.setText(penuh.slice(0, n))
    if (n >= penuh.length) d.selesai = true
    d.panah?.setVisible(d.selesai && !d.pilihan)
  }

  konfirmasiDialog() {
    const d = this.dialog
    if (!d) return
    if (d.pilihan) {
      this.pilihDialog()
      return
    }
    if (!d.selesai) {
      d.huruf = d.halaman[d.i].length
      this.perbaruiTeksDialog()
      return
    }
    if (d.i < d.halaman.length - 1) {
      d.i += 1
      d.huruf = 0
      d.selesai = false
      this.renderDialog()
      return
    }
    if (d.data.pilihan) {
      d.halaman = [this.isi(d.data.tanya ?? 'Ada yang bisa kubantu?')]
      d.i = 0
      d.huruf = 0
      d.selesai = false
      d.pilihan = d.data.pilihan
      d.pilih = 0
      this.renderDialog()
      return
    }
    this.tutupDialog()
  }

  batalDialog() {
    if (this.dialog?.pilihan) this.tutupDialog()
    else this.konfirmasiDialog()
  }

  pilihDialog() {
    const d = this.dialog
    const o = d.pilihan[d.pilih]
    suara.sfx('klik')
    if (o.halaman) {
      d.halaman = o.halaman.map((t) => this.isi(t))
      d.i = 0
      d.huruf = 0
      d.selesai = false
      d.pilihan = null
      this.renderDialog()
      return
    }
    const [tipe, id, param] = o.aksi ?? ['tutup']
    this.tutupDialog()
    if (tipe === 'layar') this.buka(id, param ?? {})
  }

  tutupDialog() {
    this.lapisDialog?.destroy(true)
    this.lapisDialog = null
    this.dialog = null
    this.tutupJikaKosong()
  }
}