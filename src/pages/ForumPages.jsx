import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import FormKirim from '../components/FormKirim'
import ItemForum from '../components/ItemForum'
import { supabase } from '../lib/supabase'
import { useAmbil } from '../lib/useAmbil'
import { useSesi } from '../lib/useSesi'
import {
  ambilAvatar,
  ambilBalasan,
  ambilPost,
  ambilPostById,
  ambilProfilSaya,
  ambilSuaraSaya,
  hapusBalasan,
  hapusPost,
  kirimBalasan,
  kirimPost,
  susunBalasan,
} from '../lib/forum'

// ---------- Daftar tweet ----------
export function ForumList() {
  const sesi = useSesi()
  if (sesi === undefined) return <p className="redup">Memuat…</p>
  return <IsiForum key={sesi?.user.id ?? 'tamu'} userId={sesi?.user.id ?? null} />
}

function IsiForum({ userId }) {
  const [urutan, setUrutan] = useState('terbaru')
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')

  const { data, memuat, error } = useAmbil(
    async () => {
      const post = await ambilPost(urutan)
      const [suara, profil, avatar] = await Promise.all([
        ambilSuaraSaya('post'),
        ambilProfilSaya(userId),
        ambilAvatar(post.map((p) => p.penulis_id)),
      ])
      return { post, suara, profil, avatar }
    },
    [urutan, versi, userId],
  )

  async function hapus(post) {
    if (!window.confirm('Hapus tweet ini beserta semua balasannya?')) return
    try {
      await hapusPost(post)
      setPesan('')
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat forum. Coba muat ulang halaman.</p>

  const admin = data.profil?.peran === 'admin'

  return (
    <>
      <h1>Forum</h1>

      {userId ? (
        <>
          <p className="redup">
            Masuk sebagai {data.profil?.username ?? 'akunmu'} ·{' '}
            <button type="button" className="tautan-tombol" onClick={() => supabase.auth.signOut()}>
              Keluar
            </button>
          </p>
          <FormKirim
            userId={userId}
            placeholder="Apa yang ingin kamu bagikan? Sebut orang dengan @username"
            tombol="Kirim"
            onKirim={async (konten) => {
              await kirimPost(konten)
              setVersi((v) => v + 1)
            }}
          />
        </>
      ) : (
        <p className="redup">
          <Link to="/masuk">Masuk</Link> atau <Link to="/daftar">daftar</Link> untuk ikut berdiskusi.
        </p>
      )}

      <div className="aksi forum-urutan" role="group" aria-label="Urutan">
        <button type="button" className="tombol" aria-pressed={urutan === 'terbaru'} onClick={() => setUrutan('terbaru')}>
          Terbaru
        </button>
        <button type="button" className="tombol" aria-pressed={urutan === 'teratas'} onClick={() => setUrutan('teratas')}>
          Teratas
        </button>
      </div>
      {pesan && <p className="redup">{pesan}</p>}

      {data.post.length === 0 && <p className="redup">Belum ada tweet. Jadilah yang pertama.</p>}
      {data.post.map((p) => (
        <ItemForum
          key={p.id}
          jenis="post"
          data={p}
          avatarUrl={data.avatar[p.penulis_id]}
          suaraAwal={data.suara[p.id] ?? 0}
          userId={userId}
          boleh={userId === p.penulis_id || admin}
          onHapus={hapus}
          tautan={`/forum/${p.id}`}
        />
      ))}
    </>
  )
}

// ---------- Halaman thread ----------
export function ForumThread() {
  const { id } = useParams()
  const sesi = useSesi()
  if (sesi === undefined) return <p className="redup">Memuat…</p>
  return (
    <IsiThread key={`${id}-${sesi?.user.id ?? 'tamu'}`} id={id} userId={sesi?.user.id ?? null} />
  )
}

function IsiThread({ id, userId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const hashTerakhir = useRef('')
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const [membalasKe, setMembalasKe] = useState(null) // id balasan yang sedang dibalas

  const { data, memuat, error } = useAmbil(
    async () => {
      const [post, balasan] = await Promise.all([ambilPostById(id), ambilBalasan(id)])
      const [suaraPost, suaraBalasan, profil, avatar] = await Promise.all([
        ambilSuaraSaya('post'),
        ambilSuaraSaya('balasan'),
        ambilProfilSaya(userId),
        ambilAvatar([post?.penulis_id, ...balasan.map((b) => b.penulis_id)]),
      ])
      return { post, balasan, suaraPost, suaraBalasan, profil, avatar }
    },
    [id, versi, userId],
  )

  // Lompat ke balasan tertentu (dari notifikasi), sekali per tautan
  useEffect(() => {
    if (!data || !location.hash || hashTerakhir.current === location.hash) return
    hashTerakhir.current = location.hash
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [data, location.hash])

  async function hapusTweet(post) {
    if (!window.confirm('Hapus tweet ini beserta semua balasannya?')) return
    try {
      await hapusPost(post)
      navigate('/forum')
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  async function hapusSatuBalasan(balasan) {
    if (!window.confirm('Hapus balasan ini beserta balasan di bawahnya?')) return
    try {
      await hapusBalasan(balasan)
      setPesan('')
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  if (memuat) return <p className="redup">Memuat…</p>
  if (error) return <p>Gagal memuat tweet. Coba muat ulang halaman.</p>
  if (!data.post) {
    return (
      <>
        <p>Tweet tidak ditemukan.</p>
        <Link to="/forum">Kembali ke Forum</Link>
      </>
    )
  }

  const admin = data.profil?.peran === 'admin'

  return (
    <>
      <Link to="/forum">Kembali ke Forum</Link>

      <ItemForum
        jenis="post"
        data={data.post}
        avatarUrl={data.avatar[data.post.penulis_id]}
        suaraAwal={data.suaraPost[data.post.id] ?? 0}
        userId={userId}
        boleh={userId === data.post.penulis_id || admin}
        onHapus={hapusTweet}
      />

      <h2>{data.balasan.length} balasan</h2>
      {pesan && <p className="redup">{pesan}</p>}

      {userId ? (
        <FormKirim
          userId={userId}
          placeholder="Tulis balasan"
          tombol="Balas"
          onKirim={async (konten) => {
            await kirimBalasan({ post_id: id, ...konten })
            setVersi((v) => v + 1)
          }}
        />
      ) : (
        <p className="redup">
          <Link to="/masuk">Masuk</Link> atau <Link to="/daftar">daftar</Link> untuk membalas.
        </p>
      )}

      {susunBalasan(data.balasan).map((b) => (
        <Fragment key={b.id}>
          <ItemForum
            jenis="balasan"
            data={b}
            avatarUrl={data.avatar[b.penulis_id]}
            suaraAwal={data.suaraBalasan[b.id] ?? 0}
            userId={userId}
            boleh={userId === b.penulis_id || admin}
            onHapus={hapusSatuBalasan}
            onBalas={(x) => setMembalasKe(x.id)}
          />
          {membalasKe === b.id && (
            <div className="forum-balas-inline">
              <FormKirim
                userId={userId}
                placeholder={`Balas ${b.penulis_nama}`}
                tombol="Balas"
                awalIsi={`@${b.penulis_nama} `}
                fokus
                onBatal={() => setMembalasKe(null)}
                onKirim={async (konten) => {
                  await kirimBalasan({ post_id: id, induk_id: b.id, ...konten })
                  setMembalasKe(null)
                  setVersi((v) => v + 1)
                }}
              />
            </div>
          )}
        </Fragment>
      ))}
    </>
  )
}