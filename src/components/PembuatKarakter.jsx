import { useEffect, useRef, useState } from 'react'
import { NAMA_GAYA_RAMBUT, PALET_BAJU, PALET_KULIT, PALET_RAMBUT, gambarKelas, rupaDariKustom } from '../game/gambar'

const AWAL = { kulit: 1, rambut: 0, gaya: 0, baju: 0 }

function Pratinjau({ kelas, kustom, arah, serang = null, judul }) {
  const ref = useRef(null)
  useEffect(() => {
    const kanvas = ref.current
    if (!kanvas) return
    const rupa = rupaDariKustom(kustom)
    const ctx = kanvas.getContext('2d')
    ctx.clearRect(0, 0, kanvas.width, kanvas.height)
    ctx.drawImage(gambarKelas(kelas, arah, 0, rupa.baju, serang, rupa), 0, 0)
  }, [kelas, kustom, arah, serang])
  return (
    <figure className="kreator-gambar">
      <canvas ref={ref} width={32} height={32} role="img" aria-label={judul} />
      <figcaption>{judul}</figcaption>
    </figure>
  )
}

function Swatch({ palet, nilai, label, onPilih }) {
  return (
    <div className="kreator-swatch" role="group" aria-label={label}>
      {palet.map((warna, i) => (
        <button
          key={warna}
          type="button"
          className="swatch"
          style={{ background: warna }}
          aria-label={`${label} ${i + 1}`}
          aria-pressed={nilai === i}
          onClick={() => onPilih(i)}
        />
      ))}
    </div>
  )
}

export default function PembuatKarakter({ mode, nama, awalKelas, awalKustom, daftarKelas, sibuk, galat, onSimpan, onBatal }) {
  const [role, setRole] = useState(awalKelas ?? 'ksatria')
  const [kustom, setKustom] = useState({ ...AWAL, ...(awalKustom ?? {}) })
  const [paham, setPaham] = useState(false)
  const debug = mode === 'debug'
  const ubah = (kunci, nilai) => setKustom((k) => ({ ...k, [kunci]: nilai }))

  return (
    <section className="kreator" aria-label="Pembuat karakter">
      <p>
        Nama karakter: <strong>{nama}</strong>
      </p>

      <div className="kreator-pratinjau">
        <Pratinjau kelas={role} kustom={kustom} arah="bawah" judul="Depan" />
        <Pratinjau kelas={role} kustom={kustom} arah="samping" judul="Samping" />
        <Pratinjau kelas={role} kustom={kustom} arah="atas" judul="Belakang" />
        <Pratinjau kelas={role} kustom={kustom} arah="samping" serang={1} judul="Serang" />
      </div>

      <h3>Role</h3>
      <div className="kreator-role" role="radiogroup" aria-label="Pilih role">
        {daftarKelas.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={role === c.id}
            className="kartu-role"
            onClick={() => setRole(c.id)}
          >
            <strong>{c.nama}</strong>
            <small>{c.deskripsi}</small>
            <small className="redup">
              Jangkauan {c.jangkauan} px · Damage {c.damage_persen}% · Jeda +{c.jeda_tambah_ms} ms · Damage
              diterima {c.diterima_persen}% · DEF +{c.def_bonus}
            </small>
          </button>
        ))}
      </div>

      <h3>Penampilan</h3>
      <div className="kreator-baris">
        <span>Warna kulit</span>
        <Swatch palet={PALET_KULIT} nilai={kustom.kulit} label="Warna kulit" onPilih={(i) => ubah('kulit', i)} />
      </div>
      <div className="kreator-baris">
        <span>Gaya rambut</span>
        <div className="kreator-gaya" role="group" aria-label="Gaya rambut">
          {NAMA_GAYA_RAMBUT.map((n, i) => (
            <button key={n} type="button" className="tombol kecil" aria-pressed={kustom.gaya === i} onClick={() => ubah('gaya', i)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="kreator-baris">
        <span>Warna rambut</span>
        <Swatch palet={PALET_RAMBUT} nilai={kustom.rambut} label="Warna rambut" onPilih={(i) => ubah('rambut', i)} />
      </div>
      <div className="kreator-baris">
        <span>Warna pakaian</span>
        <Swatch palet={PALET_BAJU} nilai={kustom.baju} label="Warna pakaian" onPilih={(i) => ubah('baju', i)} />
      </div>

      {debug ? (
        <p className="peringatan">
          Mode debug admin: perubahan role dan penampilan langsung diterapkan tanpa batasan.
        </p>
      ) : (
        <div className="peringatan" role="note">
          <strong>Penting: role tidak bisa diganti setelah karakter dibuat.</strong>
          <span>
            Kalau terlanjur salah pilih, kamu bisa memakai <strong>Restart Akun Game</strong> di menu profil (klik
            avatarmu di pojok kanan atas). Restart menghapus seluruh progres game akunmu.
          </span>
          <label className="centang">
            <input type="checkbox" checked={paham} onChange={(e) => setPaham(e.target.checked)} />
            Saya mengerti bahwa role tidak bisa diganti.
          </label>
        </div>
      )}

      {galat && <p role="alert">{galat}</p>}

      <div className="aksi">
        <button
          type="button"
          className="tombol"
          disabled={sibuk || (!debug && !paham)}
          onClick={() => onSimpan(role, kustom)}
        >
          {debug ? 'Terapkan' : sibuk ? 'Membuat…' : 'Mulai petualangan'}
        </button>
        {onBatal && (
          <button type="button" className="tombol" onClick={onBatal}>
            Kembali
          </button>
        )}
      </div>
    </section>
  )
}