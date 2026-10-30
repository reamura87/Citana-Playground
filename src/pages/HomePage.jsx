import GameHighlight from '../components/GameHighlight'
import KartuAlat from '../components/KartuAlat'
import KartuKonten from '../components/KartuKonten'
import { DAFTAR_ALAT } from '../lib/alat'
import { ambilKonten } from '../lib/konten'
import { adalahHariIni } from '../lib/satua'
import { useAmbil } from '../lib/useAmbil'
import SatuaSelesai from '../components/SatuaSelesai'

export default function HomePage() {
  const { data, memuat, error } = useAmbil(ambilKonten, [])
  const hariIni = data ? data.filter(adalahHariIni) : []
  const tampil = hariIni.length > 0 ? hariIni : (data ?? []).slice(0, 6)

  return (
    <>
      <div className="beranda-atas">
        <GameHighlight />
        <SatuaSelesai />
      </div>

      <p className="redup">Arsip ide gabut: cerita, gambar, 3D, dan kode.</p>

      <section>
        <h2>Alat</h2>
        <p className="redup">Alat gratis tanpa daftar. Prosesnya di browsermu, file tidak dikirim ke server.</p>
        <div className="grid-alat">
          {DAFTAR_ALAT.map((a) => (
            <KartuAlat key={a.path} alat={a} />
          ))}
        </div>
      </section>

      <section>
        <h2>Yang update hari ini</h2>
        {memuat && <p className="redup">Memuat…</p>}
        {error && <p>Gagal memuat konten. Coba muat ulang halaman.</p>}
        {data && (
          <>
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
          </>
        )}
      </section>
    </>
  )
}