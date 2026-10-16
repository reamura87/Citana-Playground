import { Link, useSearchParams } from 'react-router-dom'
import { cariSemua } from '../lib/cari'
import { formatWaktu } from '../lib/forum'
import { useAmbil } from '../lib/useAmbil'

const KELOMPOK = [
  ['satua', 'Satua'],
  ['seniRupa', 'Seni rupa'],
  ['forum', 'Forum'],
]

function tautan(h) {
  if (h.jenis === 'satua') return `/satua/${h.slug}`
  if (h.jenis === 'seniRupa') return `/seni-rupa/${h.id}`
  if (h.jenis === 'balasan') return `/forum/${h.post_id}`
  return `/forum/${h.id}`
}

export default function CariPage() {
  const [params, setParams] = useSearchParams()
  const kata = (params.get('q') ?? '').trim()
  const { data, memuat, error } = useAmbil(
    () => (kata.length >= 2 ? cariSemua(kata) : Promise.resolve([])),
    [kata],
  )

  function kirim(e) {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    setParams(q ? { q } : {})
  }

  const grup = { satua: [], seniRupa: [], forum: [] }
  for (const h of data ?? []) {
    grup[h.jenis === 'balasan' ? 'forum' : h.jenis].push(h)
  }

  return (
    <>
      <h1>Cari</h1>
      <form className="form" role="search" onSubmit={kirim}>
        <div className="aksi">
          <input
            type="search"
            name="q"
            key={kata}
            defaultValue={kata}
            autoFocus={!kata}
            placeholder="Cari satua, karya, atau forum"
            aria-label="Kata kunci"
            className="kolom-cari"
          />
          <button type="submit" className="tombol utama">Cari</button>
        </div>
      </form>

      {kata.length < 2 && <p className="redup">Ketik minimal 2 huruf.</p>}
      {kata.length >= 2 && memuat && <p className="redup">Mencari…</p>}
      {error && <p>Gagal mencari. Coba lagi.</p>}

      {data && kata.length >= 2 && (
        <>
          <p className="redup">{data.length} hasil untuk “{kata}”</p>
          {KELOMPOK.map(([kode, nama]) =>
            grup[kode].length === 0 ? null : (
              <section key={kode}>
                <h2>{nama} ({grup[kode].length})</h2>
                <ul className="hasil-cari">
                  {grup[kode].map((h) => (
                    <li key={`${h.jenis}-${h.id}`}>
                      {h.gambar_url && kode !== 'forum' && (
                        <img src={h.gambar_url} alt="" loading="lazy" className="hasil-gambar" />
                      )}
                      <div>
                        <Link to={tautan(h)}>
                          {h.jenis === 'balasan' ? 'Balasan: ' : ''}{h.judul}
                        </Link>
                        {h.ringkasan && <p className="redup kecil">{h.ringkasan}</p>}
                        <p className="redup kecil">
                          {h.penulis ? `${h.penulis} · ` : ''}{formatWaktu(h.waktu)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
          {data.length === 0 && <p className="redup">Tidak ada yang cocok.</p>}
        </>
      )}
    </>
  )
}