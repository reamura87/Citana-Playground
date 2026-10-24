import { Link } from 'react-router-dom'

const NAMA = 'Citana Playground'
const PENYELENGGARA = 'Nama penyelenggara' // ganti: namamu atau nama komunitas
const EMAIL = 'emailkamu@example.com' // ganti dengan email yang rutin kamu baca
const REGION = 'isi region proyek Supabase-mu' // ganti
const TERAKHIR = '17 Oktober 2026'

export function Syarat() {
  return (
    <>
      <h1>Syarat dan ketentuan</h1>
      <p className="redup">Terakhir diperbarui: {TERAKHIR}</p>
      <p>
        {NAMA} dikelola oleh {PENYELENGGARA}. Dengan membuat akun atau memakai situs ini, kamu
        menyetujui ketentuan berikut dan <Link to="/privasi">Kebijakan Privasi</Link>.
      </p>
      <h2>Akun</h2>
      <p>Kamu bertanggung jawab atas akunmu dan atas semua yang kamu tulis atau unggah.</p>
      <h2>Konten yang dilarang</h2>
      <p>
        Dilarang mengunggah konten yang melanggar hukum Indonesia, termasuk perjudian, pornografi,
        penipuan atau phishing, terorisme, ujaran kebencian, ancaman, pelanggaran hak cipta, dan data
        pribadi orang lain. Spam dan tautan promosi juga dilarang.
      </p>
      <h2>Moderasi</h2>
      <p>
        Kami dapat menghapus konten atau menonaktifkan akun yang melanggar tanpa pemberitahuan lebih
        dulu. Laporan ditanggapi paling lambat 24 jam, dan untuk konten mendesak berupaya paling lambat
        4 jam. Cara melapor ada di halaman <Link to="/lapor">Lapor konten</Link>.
      </p>
      <h2>Kerja sama dengan penegak hukum</h2>
      <p>
        Kami dapat memberikan informasi pengguna kepada pihak berwenang sesuai peraturan perundang-undangan.
      </p>
      <h2>Hak atas konten</h2>
      <p>
        Kamu tetap pemilik karyamu. Dengan mengunggahnya, kamu mengizinkan situs ini menampilkannya.
        Jangan mengunggah karya yang bukan milikmu atau yang kamu tidak punya haknya.
      </p>
      <h2>Layanan</h2>
      <p>Situs ini adalah proyek pribadi dan disediakan apa adanya, tanpa jaminan ketersediaan.</p>
    </>
  )
}

export function Privasi() {
  return (
    <>
      <h1>Kebijakan privasi</h1>
      <p className="redup">Terakhir diperbarui: {TERAKHIR}</p>
      <h2>Data yang kami kumpulkan</h2>
      <p>
        Alamat email, username, foto profil (kalau kamu mengunggahnya), serta konten yang kamu tulis
        atau unggah. Kata sandimu dikelola penyedia autentikasi dan tidak bisa kami baca. Penyedia hosting
        juga mencatat data teknis dasar kunjungan, seperti alamat IP.
      </p>
      <h2>Untuk apa</h2>
      <p>Untuk menjalankan akun, menampilkan kontenmu, dan menjaga keamanan serta moderasi situs.</p>
      <h2>Penyedia layanan</h2>
      <p>
        Data disimpan di Supabase (database, autentikasi, dan penyimpanan file) dengan lokasi server
        di {REGION}, dan situs dihosting di Vercel. Alat penghapus latar mengunduh model dari CDN
        IMG.LY; file gambar dan PDF yang kamu proses di alat tidak dikirim ke server kami maupun
        pihak lain.
      </p>
      <h2>Penyimpanan dan penghapusan</h2>
      <p>
        Data disimpan selama akunmu aktif. Untuk meminta salinan, perbaikan, atau penghapusan akun dan
        datamu, hubungi {EMAIL}.
      </p>
      <h2>Kontak</h2>
      <p>{PENYELENGGARA} — {EMAIL}</p>
    </>
  )
}

export function Lapor() {
  const subjek = encodeURIComponent(`Laporan konten ${NAMA}`)
  const isi = encodeURIComponent('Tautan halaman:\nAlasan laporan:\n')
  return (
    <>
      <h1>Lapor konten</h1>
      <p>
        Temukan konten yang melanggar hukum atau ketentuan situs? Kirim laporan ke{' '}
        <a href={`mailto:${EMAIL}?subject=${subjek}&body=${isi}`}>{EMAIL}</a> berisi tautan halaman dan
        alasannya. Kami menanggapi paling lambat 24 jam, dan konten yang mendesak (misalnya terorisme
        atau eksploitasi anak) berupaya dalam 4 jam.
      </p>
    </>
  )
}