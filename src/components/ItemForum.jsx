import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import TombolSuara from './TombolSuara'
import { formatWaktu } from '../lib/forum'

export default function ItemForum({
  jenis, data, avatarUrl, suaraAwal, userId, boleh, onHapus, onBalas, tautan,
}) {
  const isi = (
    <>
      <p className="forum-teks">{data.isi}</p>
      {data.gambar_url && (
        <img src={data.gambar_url} alt="Gambar terlampir" className="forum-gambar" loading="lazy" />
      )}
    </>
  )

  return (
    <article
      id={jenis === 'balasan' ? `balasan-${data.id}` : undefined}
      className={`forum-item${data.induk_id ? ' forum-anak' : ''}`}
    >
      <TombolSuara
        jenis={jenis}
        id={data.id}
        skor={data.skor}
        suaraAwal={suaraAwal}
        userId={userId}
      />
      <div className="forum-isi">
        <p className="forum-kepala">
          <Avatar profil={{ username: data.penulis_nama, avatar_url: avatarUrl }} ukuran={24} />
          <strong>{data.penulis_nama}</strong>
          <time dateTime={data.dibuat_pada}>{formatWaktu(data.dibuat_pada)}</time>
        </p>
        {tautan ? <Link to={tautan} className="forum-tautan">{isi}</Link> : isi}
        <p className="forum-kaki">
          {jenis === 'post' && <span>{data.jumlah_balasan} balasan</span>}
          {jenis === 'balasan' && userId && (
            <button type="button" className="tautan-tombol" onClick={() => onBalas(data)}>
              Balas
            </button>
          )}
          {boleh && (
            <button type="button" className="tautan-tombol" onClick={() => onHapus(data)}>
              Hapus
            </button>
          )}
        </p>
      </div>
    </article>
  )
}