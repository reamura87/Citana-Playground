import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormKirim from '../components/FormKirim'
import ItemForum from '../components/ItemForum'
import { supabase } from '../lib/supabase'
import { useAmbil } from '../lib/useAmbil'
import { useSesi } from '../lib/useSesi'
import {
  ambilBalasan,
  ambilPost,
  ambilPostById,
  ambilProfilSaya,
  ambilSuaraSaya,
  hapusBalasan,
  hapusPost,
  kirimBalasan,
  kirimPost,
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
      const [post, suara, profil] = await Promise.all([
        ambilPost(urutan),
        ambilSuaraSaya('post'),
        ambilProfilSaya(userId),
      ])
      return { post, suara, profil }
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
            placeholder="Apa yang ingin kamu bagikan?"
            tombol="Kirim"
            onKirim={async (isi) => {
              await kirimPost(isi)
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
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')

  const { data, memuat, error } = useAmbil(
    async () => {
      const [post, balasan, suaraPost, suaraBalasan, profil] = await Promise.all([
        ambilPostById(id),
        ambilBalasan(id),
        ambilSuaraSaya('post'),
        ambilSuaraSaya('balasan'),
        ambilProfilSaya(userId),
      ])
      return { post, balasan, suaraPost, suaraBalasan, profil }
    },
    [id, versi, userId],
  )

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
    if (!window.confirm('Hapus balasan ini?')) return
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
          onKirim={async (isi) => {
            await kirimBalasan({ post_id: id, ...isi })
            setVersi((v) => v + 1)
          }}
        />
      ) : (
        <p className="redup">
          <Link to="/masuk">Masuk</Link> atau <Link to="/daftar">daftar</Link> untuk membalas.
        </p>
      )}

      {data.balasan.map((b) => (
        <ItemForum
          key={b.id}
          jenis="balasan"
          data={b}
          suaraAwal={data.suaraBalasan[b.id] ?? 0}
          userId={userId}
          boleh={userId === b.penulis_id || admin}
          onHapus={hapusSatuBalasan}
        />
      ))}
    </>
  )
}