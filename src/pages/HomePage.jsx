import KartuKonten from '../components/KartuKonten'
import { ambilKonten } from '../lib/konten'
import { adalahHariIni } from '../lib/satua'
import { useAmbil } from '../lib/useAmbil'

export default function HomePage() {
  const { data, memuat, error } = useAmbil(ambilKonten, [])

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat konten. Coba muat ulang halaman.</p>

  const hariIni = data.filter(adalahHariIni)
  const tampil = hariIni.length > 0 ? hariIni : data.slice(0, 6)

  return (
    <>
      <p className="redup">Info Pertamina terdekat</p>

      <section>
        <h2>Yang update hari ini</h2>
        {hariIni.length === 0 && (
          <p className="redup">
            {data.length === 0 ? 'Belum ada konten.' : 'Belum ada update hari ini. Ini yang terbaru:'}
          </p>
        )}
        <div className="grid">
          {tampil.map((item) => (
            <KartuKonten key={`${item.jenis}-${item.id}`} item={item} />
          ))}
        </div>
      </section>
    </>
  )
}