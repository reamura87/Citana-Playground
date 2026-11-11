// Daftar halaman situs yang boleh dibuka lewat asisten dan dijelaskan di system prompt.
// PENTING: sesuaikan "path" dengan <Route path="..."> di App.jsx milikmu.
export const HALAMAN = [
  { path: '/', nama: 'Beranda', deskripsi: 'Ringkasan situs, alat-alat, dan karya yang baru diperbarui hari ini.' },
  { path: '/satua', nama: 'Satua', deskripsi: 'Cerita pendek dan serial: tulisan resmi dan tulisan anggota. Anggota bisa menulis sendiri.' },
  { path: '/seni-rupa', nama: 'Seni Rupa', deskripsi: 'Galeri karya gambar. Anggota bisa mengunggah atau menggambar langsung di kanvas.' },
  { path: '/forum', nama: 'Forum', deskripsi: 'Tempat diskusi anggota: membuat topik, membalas, dan memberi upvote.' },
  { path: '/game', nama: 'Citana Quest', deskripsi: 'Game RPG 2D di browser: berburu, bertani, mencari bahan, dan menjelajah kripta.' },
  { path: '/masuk', nama: 'Masuk', deskripsi: 'Halaman masuk dan daftar akun.' },
]
