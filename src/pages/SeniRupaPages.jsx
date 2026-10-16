import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import KartuSeniRupa from '../components/KartuSeniRupa'
import KomentarSatua from '../components/KomentarSatua'
import PakaiSesi from '../components/PakaiSesi'
import TombolUpvote from '../components/TombolUpvote'
import { ambilAvatar } from '../lib/forum'
import { sudahUpvote } from '../lib/personal'
import { formatTanggal } from '../lib/satua'
import { ambilSeniRupa, ambilSeniRupaById } from '../lib/seniRupa'
import { useAmbil } from '../lib/useAmbil'
import { useAuth } from '../lib/useSesi'

// ---------- Galeri ----------
export function SeniRupaList() {
  const { data, memuat, error } = useAmbil(ambilSeniRupa, [])
  const [kategori, setKategori] = useState('Semua')
  const [urutan, setUrutan] = useState('terbaru')

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat galeri. Coba muat ulang halaman.</p>

  const daftarKategori = ['Semua', ...new Set(data.map((k) => k.kategori))]
  const disaring = kategori === 'Semua' ? data : data.filter((k) => k.kategori === kategori)
  const tampil =
    urutan === 'teratas'
      ? [...disaring].sort(
          (a, b) => b.skor - a.skor || new Date(b.dibuat_pada) - new Date(a.dibuat_pada),
        )
      : disaring

  return (
    <>
      <h1>Seni rupa</h1>
      <div className="aksi">
        <Link to="/seni-rupa/baru" className="tombol utama">Buat karya</Link>
        <Link to="/seni-rupa/saya">Karya saya</Link>
      </div>

      {data.length === 0 && <p className="redup">Belum ada karya.</p>}
      {data.length > 0 && (
        <>
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
          <div className="aksi" role="group" aria-label="Urutan">
            <button type="button" className="tombol" aria-pressed={urutan === 'terbaru'} onClick={() => setUrutan('terbaru')}>
              Terbaru
            </button>
            <button type="button" className="tombol" aria-pressed={urutan === 'teratas'} onClick={() => setUrutan('teratas')}>
              Teratas
            </button>
          </div>
        </>
      )}

      <div className="galeri">
        {tampil.map((karya) => (
          <KartuSeniRupa key={karya.id} data={karya} />
        ))}
      </div>
    </>
  )
}

// ---------- Detail karya ----------
export function SeniRupaDetail() {
  const { id } = useParams()
  return (
    <PakaiSesi>
      {(userId) => <IsiKarya key={`${id}-${userId ?? 'tamu'}`} id={id} userId={userId} />}
    </PakaiSesi>
  )
}

function IsiKarya({ id, userId }) {
  const { profil } = useAuth()
  const { data, memuat, error } = useAmbil(
    async () => {
      const karya = await ambilSeniRupaById(id)
      if (!karya) return { karya: null }
      const [upvote, avatar] = await Promise.all([
        userId ? sudahUpvote('karya', karya.id) : Promise.resolve(false),
        ambilAvatar([karya.pembuat_id]),
      ])
      return { karya, upvote, avatar }
    },
    [id, userId],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat karya. Coba muat ulang halaman.</p>
  if (!data.karya) {
    return (
      <>
        <p>Karya tidak ditemukan.</p>
        <Link to="/seni-rupa">Kembali ke Seni rupa</Link>
      </>
    )
  }

  const { karya, upvote, avatar } = data

  return (
    <article>
      <Link to="/seni-rupa">Kembali ke Seni rupa</Link>
      <img src={karya.gambar_url} alt={karya.nama} className="karya" />
      <h1>{karya.nama}</h1>
      <p className="penulis-baris">
        <Avatar
          profil={{ username: karya.pembuat_nama, avatar_url: avatar[karya.pembuat_id] }}
          ukuran={24}
        />
        <span>
          oleh {karya.pembuat_nama} · {karya.kategori} · {formatTanggal(karya.dibuat_pada)}
        </span>
      </p>
      <p className="redup">
        {karya.asal === 'lukis' ? 'Digambar langsung di situs ini' : 'Gambar yang diunggah'}
      </p>

      <TombolUpvote
        jenis="karya"
        id={karya.id}
        skor={karya.skor}
        sudahAwal={upvote}
        userId={userId}
        milikSendiri={Boolean(userId) && userId === karya.pembuat_id}
      />
      <KomentarSatua
        jenis="karya"
        id={karya.id}
        userId={userId}
        pemilikId={karya.pembuat_id}
        admin={profil?.peran === 'admin'}
      />
    </article>
  )
}