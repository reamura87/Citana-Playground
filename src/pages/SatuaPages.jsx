import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import BarisKategori from '../components/BarisKategori'
import IsiCerita from '../components/IsiCerita'
import KartuSatuaPersonal from '../components/KartuSatuaPersonal'
import KomentarSatua from '../components/KomentarSatua'
import PakaiSesi from '../components/PakaiSesi'
import TabSatua from '../components/TabSatua'
import TombolUpvote from '../components/TombolUpvote'
import { ambilAvatar } from '../lib/forum'
import {
  ambilEpisodeById,
  ambilEpisodeTerbit,
  ambilPersonal,
  hapusPersonal,
  sudahUpvote,
} from '../lib/personal'
import {
  ambilSatua,
  ambilSatuaBySlug,
  formatTanggal,
  kelompokkan,
  teksPolos,
} from '../lib/satua'
import { useAmbil } from '../lib/useAmbil'
import { useAuth } from '../lib/useSesi'

// ---------- Daftar satua resmi ----------
export function SatuaList() {
  const [params] = useSearchParams()
  const { data, memuat, error } = useAmbil(ambilSatua, [])
  const kata = (params.get('q') ?? '').trim()
  const q = kata.toLowerCase()

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat cerita. Coba muat ulang halaman.</p>

  const hasil = q
    ? data.filter((s) =>
        `${s.judul} ${s.kategori} ${teksPolos(s.isi)}`.toLowerCase().includes(q),
      )
    : data
  const baris = kelompokkan(hasil)

  return (
    <>
      <h1>Satua</h1>
      <TabSatua aktif="resmi" />
      {q && <p className="redup">{hasil.length} hasil untuk “{kata}”</p>}
      {baris.length === 0 && (
        <p className="redup">{q ? 'Tidak ada cerita yang cocok.' : 'Belum ada cerita.'}</p>
      )}
      {baris.map(([kategori, daftar]) => (
        <BarisKategori key={kategori} judul={kategori} daftar={daftar} />
      ))}
    </>
  )
}

// ---------- Daftar satua personal ----------
export function SatuaPersonalList() {
  const { data, memuat, error } = useAmbil(ambilPersonal, [])
  const [filter, setFilter] = useState('semua')

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat tulisan. Coba muat ulang halaman.</p>

  const tampil = filter === 'semua' ? data : data.filter((s) => s.jenis === filter)
  const baris = kelompokkan(tampil)

  return (
    <>
      <h1>Satua</h1>
      <TabSatua aktif="personal" />
      <div className="aksi">
        <Link to="/tulis" className="tombol utama">Tulis satua</Link>
        <Link to="/tulis/saya">Tulisan saya</Link>
      </div>
      <div className="aksi" role="group" aria-label="Filter jenis">
        {[['semua', 'Semua'], ['cerpen', 'Cerpen'], ['serial', 'Serial']].map(([kode, nama]) => (
          <button
            key={kode}
            type="button"
            className="tombol"
            aria-pressed={filter === kode}
            onClick={() => setFilter(kode)}
          >
            {nama}
          </button>
        ))}
      </div>
      {baris.length === 0 && <p className="redup">Belum ada tulisan.</p>}
      {baris.map(([kategori, daftar]) => (
        <BarisKategori key={kategori} judul={kategori} daftar={daftar} Kartu={KartuSatuaPersonal} />
      ))}
    </>
  )
}

// ---------- Halaman baca ----------
export function SatuaDetail() {
  const { slug } = useParams()
  return (
    <PakaiSesi>
      {(userId) => <IsiDetail key={`${slug}-${userId ?? 'tamu'}`} slug={slug} userId={userId} />}
    </PakaiSesi>
  )
}

function IsiDetail({ slug, userId }) {
  const { profil } = useAuth()
  const { data, memuat, error } = useAmbil(
    async () => {
      const satua = await ambilSatuaBySlug(slug)
      if (!satua) return { satua: null }
      if (satua.jenis === 'resmi') return { satua }
      const [avatar, upvote, episode] = await Promise.all([
        ambilAvatar([satua.penulis_id]),
        satua.jenis === 'cerpen' && userId ? sudahUpvote('satua', satua.id) : Promise.resolve(false),
        satua.jenis === 'serial' ? ambilEpisodeTerbit(satua.id) : Promise.resolve([]),
      ])
      return { satua, avatar, upvote, episode }
    },
    [slug, userId],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat cerita. Coba muat ulang halaman.</p>
  if (!data.satua) {
    return (
      <>
        <p>Cerita tidak ditemukan.</p>
        <Link to="/satua">Kembali ke Satua</Link>
      </>
    )
  }

  const { satua } = data
  const admin = profil?.peran === 'admin'

  if (satua.jenis === 'resmi') {
    return (
      <article>
        <Link to="/satua">Kembali ke Satua</Link>
        <h1>{satua.judul}</h1>
        <p className="redup">
          {satua.kategori} · {formatTanggal(satua.diperbarui_pada)}
        </p>
        <IsiCerita html={satua.isi} />
      </article>
    )
  }

  if (satua.jenis === 'cerpen') {
    return (
      <Cerpen satua={satua} avatar={data.avatar} upvote={data.upvote} userId={userId} admin={admin} />
    )
  }

  return <Serial satua={satua} avatar={data.avatar} episode={data.episode} admin={admin} />
}

function Penulis({ satua, avatar }) {
  return (
    <p className="penulis-baris">
      <Avatar profil={{ username: satua.penulis_nama, avatar_url: avatar[satua.penulis_id] }} ukuran={24} />
      <span>
        oleh {satua.penulis_nama} · {satua.kategori} · {formatTanggal(satua.diperbarui_pada)}
      </span>
    </p>
  )
}

function TombolModerasi({ satua }) {
  const navigate = useNavigate()
  const [pesan, setPesan] = useState('')

  async function hapus() {
    if (!window.confirm(`Hapus “${satua.judul}” (moderasi)? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await hapusPersonal(satua)
      navigate('/satua/personal')
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  return (
    <p>
      <button type="button" className="tautan-tombol" onClick={hapus}>Hapus (moderasi admin)</button>
      {pesan && <span className="redup"> {pesan}</span>}
    </p>
  )
}

function Cerpen({ satua, avatar, upvote, userId, admin }) {
  return (
    <article>
      <Link to="/satua/personal">Kembali ke Satua personal</Link>
      <h1>{satua.judul}</h1>
      <Penulis satua={satua} avatar={avatar} />
      <IsiCerita html={satua.isi} />
      <TombolUpvote
        jenis="satua"
        id={satua.id}
        skor={satua.skor}
        sudahAwal={upvote}
        userId={userId}
        milikSendiri={userId === satua.penulis_id}
      />
      <KomentarSatua
        jenis="satua"
        id={satua.id}
        userId={userId}
        pemilikId={satua.penulis_id}
        admin={admin}
      />
      {admin && <TombolModerasi satua={satua} />}
    </article>
  )
}

function Serial({ satua, avatar, episode, admin }) {
  return (
    <article>
      <Link to="/satua/personal">Kembali ke Satua personal</Link>
      <h1>{satua.judul}</h1>
      <Penulis satua={satua} avatar={avatar} />
      <IsiCerita html={satua.isi} />

      <h2>{episode.length} episode</h2>
      {episode.length === 0 && <p className="redup">Belum ada episode yang terbit.</p>}
      {episode.length > 0 && (
        <>
          <p>
            <Link to={`/satua/${satua.slug}/episode/${episode[0].nomor}`} className="tombol utama">
              Mulai membaca
            </Link>
          </p>
          <ul className="daftar">
            {episode.map((e) => (
              <li key={e.id}>
                <Link to={`/satua/${satua.slug}/episode/${e.nomor}`}>
                  Episode {e.nomor}: {e.judul}
                </Link>
                <small className="redup">▲ {e.skor} · {e.jumlah_komentar} komentar</small>
              </li>
            ))}
          </ul>
        </>
      )}
      {admin && <TombolModerasi satua={satua} />}
    </article>
  )
}

// ---------- Halaman episode ----------
export function EpisodeDetail() {
  const { slug, nomor } = useParams()
  return (
    <PakaiSesi>
      {(userId) => (
        <IsiEpisode
          key={`${slug}-${nomor}-${userId ?? 'tamu'}`}
          slug={slug}
          nomor={nomor}
          userId={userId}
        />
      )}
    </PakaiSesi>
  )
}

function IsiEpisode({ slug, nomor, userId }) {
  const { profil } = useAuth()
  const { data, memuat, error } = useAmbil(
    async () => {
      const satua = await ambilSatuaBySlug(slug)
      if (!satua || satua.jenis !== 'serial') return { satua: null }
      const daftar = await ambilEpisodeTerbit(satua.id)
      const ringkas = daftar.find((e) => String(e.nomor) === nomor)
      if (!ringkas) return { satua, daftar, episode: null }
      const [episode, upvote, avatar] = await Promise.all([
        ambilEpisodeById(ringkas.id),
        userId ? sudahUpvote('episode', ringkas.id) : Promise.resolve(false),
        ambilAvatar([satua.penulis_id]),
      ])
      return { satua, daftar, episode, upvote, avatar }
    },
    [slug, nomor, userId],
  )

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat episode. Coba muat ulang halaman.</p>
  if (!data.satua || !data.episode) {
    return (
      <>
        <p>Episode tidak ditemukan.</p>
        <Link to={data.satua ? `/satua/${slug}` : '/satua/personal'}>Kembali</Link>
      </>
    )
  }

  const { satua, daftar, episode, upvote, avatar } = data
  const urutan = daftar.findIndex((e) => e.id === episode.id)
  const sebelumnya = daftar[urutan - 1]
  const berikutnya = daftar[urutan + 1]
  const admin = profil?.peran === 'admin'

  return (
    <article>
      <Link to={`/satua/${satua.slug}`}>← {satua.judul}</Link>
      <h1>Episode {episode.nomor}: {episode.judul}</h1>
      <Penulis satua={{ ...satua, diperbarui_pada: episode.diperbarui_pada }} avatar={avatar} />
      <IsiCerita html={episode.isi} />

      <div className="episode-nav">
        {sebelumnya ? (
          <Link to={`/satua/${satua.slug}/episode/${sebelumnya.nomor}`}>← Episode {sebelumnya.nomor}</Link>
        ) : <span />}
        {berikutnya ? (
          <Link to={`/satua/${satua.slug}/episode/${berikutnya.nomor}`}>Episode {berikutnya.nomor} →</Link>
        ) : <span />}
      </div>

      <TombolUpvote
        jenis="episode"
        id={episode.id}
        skor={episode.skor}
        sudahAwal={upvote}
        userId={userId}
        milikSendiri={userId === satua.penulis_id}
      />
      <KomentarSatua
        jenis="episode"
        id={episode.id}
        userId={userId}
        pemilikId={satua.penulis_id}
        admin={admin}
      />
    </article>
  )
}