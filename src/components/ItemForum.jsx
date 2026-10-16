import { Link } from 'react-router-dom'
import TombolSuara from './TombolSuara'
import { formatWaktu } from '../lib/forum'

export default function ItemForum({ jenis, data, suaraAwal, userId, boleh, onHapus, tautan }) {
  const isi = (
    <>
      <p className="forum-teks">{data.isi}</p>
      {data.gambar_url && (
        <img src={data.gambar_url} alt="Gambar terlampir" className="forum-gambar" loading="lazy" />
      )}
    </>
  )

  return (
    <article className="forum-item">
      <TombolSuara
        jenis={jenis}
        id={data.id}
        skor={data.skor}
        suaraAwal={suaraAwal}
        userId={userId}
      />
      <div className="forum-isi">
        <p className="forum-kepala">
          <strong>{data.penulis_nama}</strong>{' '}
          <time dateTime={data.dibuat_pada}>{formatWaktu(data.dibuat_pada)}</time>
        </p>
        {tautan ? <Link to={tautan} className="forum-tautan">{isi}</Link> : isi}
        <p className="forum-kaki">
          {jenis === 'post' && <span>{data.jumlah_balasan} balasan</span>}
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