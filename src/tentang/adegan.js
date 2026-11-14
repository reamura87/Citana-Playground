// Adegan WebGL: latar kain, sulur dan daun pepatraan 3D berlapis (paralaks), prabha, dan foto dalam bingkai.
import * as THREE from 'three'
import { Kumpulan, acak, sulur } from './daun'
import {
  FRAG_BINGKAI, FRAG_DAUN, FRAG_DEBU, FRAG_LATAR, FRAG_PRABHA, PALET, URUTAN_PALET,
  VERT_BIDANG, VERT_DAUN, VERT_DEBU, VERT_LATAR,
} from './shader'

const FOV = 32
const JARAK = 14 // jarak kamera ke bidang foto pada layar lebar
const ASPEK_RUJUKAN = 1.6
const TAN = Math.tan((FOV * Math.PI) / 360)

const hexKeVektor = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

function geometriDari(K) {
  const a = K.larik()
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(a.nor, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(a.uv, 2))
  g.setAttribute('aInfo', new THREE.BufferAttribute(a.info, 4))
  g.setIndex(new THREE.BufferAttribute(a.idx, 1))
  return g
}

// Foto pengganti (siluet) bila berkas foto belum ada
function fotoPengganti() {
  const k = document.createElement('canvas')
  k.width = 600
  k.height = 760
  const c = k.getContext('2d')
  const g = c.createLinearGradient(0, 0, 0, 760)
  g.addColorStop(0, '#f2dba5')
  g.addColorStop(1, '#c98f4d')
  c.fillStyle = g
  c.fillRect(0, 0, 600, 760)
  c.fillStyle = '#5a2f1c'
  c.beginPath()
  c.ellipse(300, 790, 250, 230, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#e8bf9a'
  c.fillRect(268, 430, 64, 110)
  c.beginPath()
  c.ellipse(300, 340, 108, 135, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#2a1a12'
  c.beginPath()
  c.ellipse(300, 262, 118, 90, 0, Math.PI, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(42,26,18,0.55)'
  c.font = '600 26px Georgia, serif'
  c.textAlign = 'center'
  c.fillText('Taruh fotomu di public/foto-profil.jpg', 300, 735)
  const t = new THREE.CanvasTexture(k)
  t.colorSpace = THREE.NoColorSpace
  return t
}

// Menyusun semua sulur untuk satu lapisan kedalaman
function susunLapisan(K, rand, { lebar, tinggi, baris, esk, z, palet, kepadatan, depan, potret }) {
  const L = lebar / 2
  const T = tinggi / 2
  const s = (o) => sulur(K, rand, { skala: esk * (o.skala ?? 1), palDaun: palet, z, ...o, panjang: o.panjang * esk })
  if (depan) {
    // beberapa daun besar di tepi, tidak menutupi foto
    s({ x: -L * 1.06, y: -T * 0.5, sudut: 0.75, panjang: 4.2, arahPutar: -1, skala: 1.3, bungaDiUjung: false })
    s({ x: L * 1.06, y: T * 0.6, sudut: -2.4, panjang: 4.2, arahPutar: 1, skala: 1.3, bungaDiUjung: false })
    return
  }
  // sudut-sudut layar pertama: bingkai alami di sekeliling foto
  const hero = [
    { x: -L * 1.04, y: -T * 1.08, sudut: 1.18, panjang: 7.4, arahPutar: -1 },
    { x: L * 1.04, y: -T * 1.08, sudut: Math.PI - 1.18, panjang: 7.4, arahPutar: 1 },
    { x: -L * 1.04, y: T * 1.08, sudut: -1.2, panjang: 6.2, arahPutar: 1 },
    { x: L * 1.04, y: T * 1.08, sudut: -Math.PI + 1.2, panjang: 6.2, arahPutar: -1 },
    { x: -L * 1.08, y: T * 0.05, sudut: 0.3, panjang: 3.4, arahPutar: -1, skala: 0.9 },
    { x: L * 1.08, y: -T * 0.1, sudut: Math.PI - 0.3, panjang: 3.4, arahPutar: 1, skala: 0.9 },
  ]
  for (const h of hero) if (rand() < kepadatan) s(h)
  if (potret) {
    // layar potret lebih tinggi: tambahkan sulur di sisi dan di tengah atas/bawah (di belakang foto)
    s({ x: -L * 1.04, y: -T * 0.35, sudut: 0.7, panjang: 5.6, arahPutar: -1, skala: 0.9 })
    s({ x: L * 1.04, y: -T * 0.4, sudut: Math.PI - 0.7, panjang: 5.6, arahPutar: 1, skala: 0.9 })
    s({ x: -L * 1.04, y: T * 0.4, sudut: -0.7, panjang: 5.6, arahPutar: 1, skala: 0.9 })
    s({ x: L * 1.04, y: T * 0.35, sudut: -Math.PI + 0.7, panjang: 5.6, arahPutar: -1, skala: 0.9 })
    s({ x: -L * 0.2, y: T * 1.06, sudut: -1.45, panjang: 5.2, arahPutar: 1, skala: 0.85 })
    s({ x: L * 0.25, y: -T * 1.06, sudut: 1.65, panjang: 5.4, arahPutar: -1, skala: 0.85 })
  }
  // baris berikutnya (halaman panjang): sulur di tepi kiri dan kanan
  for (let k = 1; k <= baris; k += 1) {
    const y = -tinggi * k
    s({ x: -L * 1.04, y: y - T * 0.9, sudut: 1.1 + rand() * 0.3, panjang: 6.4, arahPutar: -1 })
    s({ x: L * 1.04, y: y - T * 0.9, sudut: Math.PI - 1.1 - rand() * 0.3, panjang: 6.4, arahPutar: 1 })
    s({ x: -L * 1.04, y: y + T * 0.2, sudut: -0.9 - rand() * 0.3, panjang: 5.2, arahPutar: 1, skala: 0.9 })
    s({ x: L * 1.04, y: y + T * 0.1, sudut: -Math.PI + 0.9 + rand() * 0.3, panjang: 5.2, arahPutar: -1, skala: 0.9 })
  }
}

export function buatAdegan(kanvas, opsi) {
  const { urlFoto, kurangGerak = false, rendah = false, halaman, onGagal } = opsi
  const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  const kamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120)
  const adegan = new THREE.Scene()
  const warna = {
    terang: URUTAN_PALET.map((n) => hexKeVektor(PALET[n][0])),
    gelap: URUTAN_PALET.map((n) => hexKeVektor(PALET[n][1])),
  }
  const aktif = { geometri: [], bahan: [], tekstur: [] }
  const waktuAwal = performance.now()
  const target = { x: 0, y: 0 }
  const halus = { x: 0, y: 0 }
  let lapisan = []
  let ukuranKey = ''
  let upx = 0.01 // unit dunia per piksel pada bidang foto
  let H0 = 8
  let bukaTop = 0
  let rid = 0
  let hancur = false
  let tinggiHalaman = 0
  let yBingkai = 0
  let siap = false // true setelah semua objek adegan selesai dibuat

  // ---------- Latar ----------
  const latarBahan = new THREE.ShaderMaterial({
    vertexShader: VERT_LATAR, fragmentShader: FRAG_LATAR, depthTest: false, depthWrite: false,
    uniforms: { uResolusi: { value: new THREE.Vector2(1, 1) }, uGeser: { value: new THREE.Vector2() }, uWaktu: { value: 0 } },
  })
  const latar = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), latarBahan)
  latar.frustumCulled = false
  latar.renderOrder = -10
  adegan.add(latar)

  // ---------- Bahan daun per lapisan ----------
  const buatBahanDaun = (kabut, kuatKabut, redup) =>
    new THREE.ShaderMaterial({
      vertexShader: VERT_DAUN, fragmentShader: FRAG_DAUN, side: THREE.DoubleSide,
      uniforms: {
        uWaktu: { value: 0 }, uAngin: { value: new THREE.Vector2() },
        uTerang: { value: warna.terang }, uGelap: { value: warna.gelap },
        uKabut: { value: hexKeVektor(kabut) }, uKabutKuat: { value: kuatKabut }, uRedup: { value: redup },
      },
    })
  const bahanBelakang = buatBahanDaun('#1d2a55', 0.42, 0.9)
  const bahanTengah = buatBahanDaun('#3a2a2a', 0.0, 1.0)
  const bahanDepan = buatBahanDaun('#150d0a', 0.28, 0.85)

  // ---------- Prabha, bayangan, dan bingkai foto ----------
  const prabhaBahan = new THREE.ShaderMaterial({
    vertexShader: VERT_BIDANG, fragmentShader: FRAG_PRABHA,
    uniforms: { uWaktu: { value: 0 }, uUkuran: { value: new THREE.Vector2(1, 1) } },
  })
  const prabha = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), prabhaBahan)
  prabha.position.z = -0.9
  adegan.add(prabha)

  const bingkaiUniform = (bayangan) => ({
    uFoto: { value: null }, uAspekFoto: { value: 0.8 }, uBayangan: { value: bayangan }, uWaktu: { value: 0 }, uUkuran: { value: new THREE.Vector2(1, 1.4) },
  })
  const bingkaiBahan = new THREE.ShaderMaterial({ vertexShader: VERT_BIDANG, fragmentShader: FRAG_BINGKAI, transparent: true, uniforms: bingkaiUniform(0) })
  const bayanganBahan = new THREE.ShaderMaterial({
    vertexShader: VERT_BIDANG, fragmentShader: FRAG_BINGKAI, transparent: true, depthWrite: false, uniforms: bingkaiUniform(1),
  })
  const bingkai = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), bingkaiBahan)
  const bayangan = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), bayanganBahan)
  bayangan.position.z = -0.25
  adegan.add(bayangan, bingkai)

  // ---------- Debu emas ----------
  const debuBahan = new THREE.ShaderMaterial({
    vertexShader: VERT_DEBU, fragmentShader: FRAG_DEBU, transparent: true, depthWrite: false,
    uniforms: { uWaktu: { value: 0 }, uTinggi: { value: 12 }, uSkalaPiksel: { value: 1 } },
  })
  let debu = null

  aktif.bahan.push(bahanBelakang, bahanTengah, bahanDepan, latarBahan, prabhaBahan, bingkaiBahan, bayanganBahan, debuBahan)
  aktif.geometri.push(prabha.geometry, bingkai.geometry, bayangan.geometry, latar.geometry)

  const teksturFoto = { nilai: null }
  const pasangFoto = (tex) => {
    teksturFoto.nilai = tex
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    aktif.tekstur.push(tex)
    const img = tex.image
    const aspek = img && img.width ? img.width / img.height : 0.8
    for (const b of [bingkaiBahan, bayanganBahan]) {
      b.uniforms.uFoto.value = tex
      b.uniforms.uAspekFoto.value = aspek
    }
    gambarSekali()
  }

  function bangunDebu(lebarDunia, tinggiTotal) {
    if (debu) {
      adegan.remove(debu)
      debu.geometry.dispose()
    }
    const n = rendah ? 70 : 150
    const rand = acak(77)
    const mulai = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i += 1) {
      mulai.set([(rand() - 0.5) * lebarDunia * 1.1, rand() * tinggiTotal, -3 + rand() * 5.5], i * 3)
      seed[i] = rand()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aMulai', new THREE.BufferAttribute(mulai, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    debu = new THREE.Points(g, debuBahan)
    debu.frustumCulled = false
    debuBahan.uniforms.uTinggi.value = tinggiTotal
    adegan.add(debu)
  }

  // ---------- Membangun ulang geometri bila ukuran berubah ----------
  function bangunSulur(lebarDunia, tinggiDunia, baris) {
    for (const l of lapisan) {
      adegan.remove(l)
      l.geometry.dispose()
    }
    lapisan = []
    // skala mengikuti sisi yang lebih sempit agar sulur tidak menjalar menutupi foto pada layar potret
    const esk = Math.min(tinggiDunia / 8, (lebarDunia / 12.8) * 1.5)
    const potret = lebarDunia / tinggiDunia < 1
    const rakit = (seed, bahan, z, opsiLapis) => {
      const K = new Kumpulan()
      susunLapisan(K, acak(seed), { lebar: lebarDunia, tinggi: tinggiDunia, baris, esk, z, potret, ...opsiLapis })
      const m = new THREE.Mesh(geometriDari(K), bahan)
      m.frustumCulled = false
      adegan.add(m)
      lapisan.push(m)
    }
    rakit(11, bahanBelakang, -6, { palet: [2, 0, 7, 2, 3], kepadatan: 1 })
    rakit(23, bahanTengah, -1.7, { palet: [0, 1, 3, 0, 1, 4], kepadatan: 1 })
    if (!potret) rakit(37, bahanDepan, 2.4, { palet: [7, 0, 2], kepadatan: 1, depan: true })
  }

  // ---------- Ukuran dan tata letak ----------
  function ukur() {
    const lebar = Math.max(1, Math.floor(kanvas.clientWidth))
    const tinggi = Math.max(1, Math.floor(kanvas.clientHeight))
    const dpr = Math.min(window.devicePixelRatio || 1, rendah ? 1.25 : 2)
    renderer.setPixelRatio(dpr)
    renderer.setSize(lebar, tinggi, false)
    const aspek = lebar / tinggi
    kamera.aspect = aspek
    const zoom = Math.max(1, ASPEK_RUJUKAN / aspek)
    kamera.position.z = JARAK * zoom
    kamera.updateProjectionMatrix()
    H0 = 2 * kamera.position.z * TAN
    upx = H0 / tinggi
    bukaTop = (halaman?.getBoundingClientRect().top ?? 0) + window.scrollY
    const tinggiTampak = Math.max(300, tinggi - bukaTop)
    const hBingkaiPx = Math.min(560, Math.max(210, Math.min(tinggiTampak * 0.5, lebar * 0.8 * 1.26)))
    const wBingkaiPx = hBingkaiPx / 1.26
    const yPusatPx = tinggiTampak * 0.45
    const yDunia = (tinggi / 2 - yPusatPx) * upx
    yBingkai = yDunia
    const wUnit = wBingkaiPx * upx
    bingkai.scale.set(wUnit, wUnit, 1)
    bayangan.scale.set(wUnit * 1.04, wUnit * 1.04, 1)
    bingkai.position.set(0, yDunia, 0)
    bayangan.position.set(0, yDunia, -0.25)
    const rHalo = hBingkaiPx * (aspek < 1 ? 0.68 : 0.8) * upx
    prabha.scale.set((rHalo * 2) / 0.96, (rHalo * 2) / 0.96, 1)
    prabha.position.set(0, yDunia, -0.9)
    debuBahan.uniforms.uSkalaPiksel.value = dpr
    // variabel CSS untuk menata teks hero tepat di bawah bingkai
    const inti = kanvas.parentElement?.parentElement
    inti?.style.setProperty('--foto-bawah', `${Math.round(yPusatPx + hBingkaiPx / 2)}px`)
    inti?.style.setProperty('--foto-atas', `${Math.round(yPusatPx - hBingkaiPx / 2)}px`)
    latarBahan.uniforms.uResolusi.value.set(lebar, tinggi)

    // tinggi halaman menentukan banyaknya baris sulur
    tinggiHalaman = Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight)
    const baris = Math.min(8, Math.ceil((tinggiHalaman * upx) / H0))
    const lebarDunia = H0 * aspek
    const kunci = `${Math.round(aspek * 8)}|${Math.round(H0 * 10)}|${baris}`
    if (kunci !== ukuranKey) {
      ukuranKey = kunci
      bangunSulur(lebarDunia, H0, baris)
      bangunDebu(lebarDunia, H0 * (baris + 1))
    }
    gambarSekali()
  }

  // ---------- Gambar ----------
  function perbarui(t) {
    const w = kurangGerak ? 0 : t
    for (const b of [bahanBelakang, bahanTengah, bahanDepan]) {
      b.uniforms.uWaktu.value = w
      b.uniforms.uAngin.value.set(halus.x, halus.y)
    }
    for (const b of [prabhaBahan, bingkaiBahan, bayanganBahan, debuBahan, latarBahan]) b.uniforms.uWaktu.value = w
    const gulir = Math.max(0, window.scrollY - bukaTop)
    const geser = gulir * upx
    kamera.position.x = halus.x * 2.2
    kamera.position.y = -geser + halus.y * 1.4
    latarBahan.uniforms.uGeser.value.set(halus.x * 0.3, geser * 0.2)
    // foto tetap di tengah terhadap gerak penunjuk, tetapi ikut bergulir bersama halaman
    bingkai.position.x = halus.x * 2.2
    bayangan.position.x = halus.x * 2.2
    prabha.position.x = halus.x * 2.2
    bingkai.rotation.y = halus.x * 0.14
    bingkai.rotation.x = -halus.y * 0.09
    bayangan.rotation.y = bingkai.rotation.y
    const ayun = kurangGerak ? 0 : Math.sin(t * 0.8) * 0.04
    bingkai.position.y = yBingkai + halus.y * 1.4 + ayun
    bayangan.position.y = bingkai.position.y
    prabha.position.y = bingkai.position.y
    renderer.render(adegan, kamera)
  }

  function gambarSekali() {
    if (kurangGerak && siap && !hancur) perbarui(0)
  }

  function putar() {
    rid = requestAnimationFrame(putar)
    const t = (performance.now() - waktuAwal) / 1000
    halus.x += (target.x - halus.x) * 0.06
    halus.y += (target.y - halus.y) * 0.06
    perbarui(t)
  }

  const saatPenunjuk = (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2
    target.y = -(e.clientY / window.innerHeight - 0.5) * 2
  }
  const saatGulir = () => gambarSekali()
  const saatUbahUkuran = () => {
    clearTimeout(saatUbahUkuran.timer)
    saatUbahUkuran.timer = setTimeout(ukur, 120)
  }
  const saatHilang = (e) => {
    e.preventDefault()
    cancelAnimationFrame(rid)
    onGagal?.()
  }
  kanvas.addEventListener('webglcontextlost', saatHilang)
  window.addEventListener('resize', saatUbahUkuran)
  window.addEventListener('scroll', saatGulir, { passive: true })
  if (!kurangGerak) window.addEventListener('pointermove', saatPenunjuk, { passive: true })

  pasangFoto(fotoPengganti())
  new THREE.TextureLoader().load(urlFoto, (tex) => {
    if (hancur) {
      tex.dispose()
      return
    }
    tex.colorSpace = THREE.NoColorSpace
    teksturFoto.nilai?.dispose()
    pasangFoto(tex)
  })

  siap = true
  ukur()
  if (kurangGerak) perbarui(0)
  else rid = requestAnimationFrame(putar)

  return {
    ukur,
    hancurkan() {
      hancur = true
      cancelAnimationFrame(rid)
      clearTimeout(saatUbahUkuran.timer)
      kanvas.removeEventListener('webglcontextlost', saatHilang)
      window.removeEventListener('resize', saatUbahUkuran)
      window.removeEventListener('scroll', saatGulir)
      window.removeEventListener('pointermove', saatPenunjuk)
      for (const l of lapisan) l.geometry.dispose()
      debu?.geometry.dispose()
      for (const g of aktif.geometri) g.dispose()
      for (const b of aktif.bahan) b.dispose()
      for (const t of aktif.tekstur) t.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
