import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import KartuSeniRupa from '../components/KartuSeniRupa'
import { useAmbil } from '../lib/useAmbil'
import { formatTanggal } from '../lib/satua'
import { ambilSeniRupa, ambilSeniRupaById } from '../lib/seniRupa'

export function SeniRupaList() {
  const { data, memuat, error } = useAmbil(ambilSeniRupa, [])
  const [kategori, setKategori] = useState('Semua')

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat galeri. Coba muat ulang halaman.</p>

  const daftarKategori = ['Semua', ...new Set(data.map((k) => k.kategori))]
  const tampil = kategori === 'Semua' ? data : data.filter((k) => k.kategori === kategori)

  return (
    <>
      <h1>Seni rupa</h1>
      {data.length === 0 && <p className="redup">Belum ada karya.</p>}
      {data.length > 0 && (
        <div className="aksi" role="group" aria-label="Filter kategori">
          {daftarKategori.map((k) => (
            <button
              key={k}
              type="button"
              className="tombol"
              aria-pressed={k === kategori}
              onClick={() => setKategori(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <div className="galeri">
        {tampil.map((karya) => (
          <KartuSeniRupa key={karya.id} data={karya} />
        ))}
      </div>
    </>
  )
}

export function SeniRupaDetail() {
  const { id } = useParams()
  const { data: karya, memuat, error } = useAmbil(() => ambilSeniRupaById(id), [id])

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat karya. Coba muat ulang halaman.</p>
  if (!karya) {
    return (
      <>
        <p>Karya tidak ditemukan.</p>
        <Link to="/seni-rupa">Kembali ke Seni rupa</Link>
      </>
    )
  }

  return (
    <article>
      <Link to="/seni-rupa">Kembali ke Seni rupa</Link>
      <img src={karya.gambar_url} alt={karya.nama} className="karya" />
      <h1>{karya.nama}</h1>
      <p className="redup">
        {karya.kategori} · oleh {karya.pembuat_nama} · {formatTanggal(karya.dibuat_pada)}
      </p>
      <p className="redup">
        {karya.asal === 'lukis' ? 'Digambar langsung di situs ini' : 'Gambar yang diunggah'}
      </p>
    </article>
  )
}