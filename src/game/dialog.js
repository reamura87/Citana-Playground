export const DIALOG = {
  kapten: {
    nama: 'Kapten Rowan',
    wajah: 'kapten',
    buka: [
      'Salam, {nama}! Perbatasan kerajaan butuh tangan yang cekatan.',
      'Selesaikan tugas harian dan ambil upahmu dariku.',
    ],
    tanya: 'Apa yang ingin kamu ketahui?',
    pilihan: [
      { teks: 'Lihat misi harian', aksi: ['layar', 'misi', { npc: 'kapten' }] },
      {
        teks: 'Cara bertarung',
        halaman: [
          'Tekan A atau klik untuk menebas musuh di dekatmu. Musuh akan mengejar dan membalas.',
          'Jaga HP-mu. Kalau HP habis, kamu menunggu 5 menit sebelum hidup kembali di desa.',
          'Tiap naik level kamu mendapat 3 poin untuk Health atau Kecepatan serang di menu Status.',
        ],
      },
      {
        teks: 'Tentang zona aman',
        halaman: [
          'Desa ini zona aman. Musuh tak bisa masuk, dan kamu pun tak bisa menyerang di dalamnya.',
          'Pakai desa untuk beristirahat, berdagang, dan mengobrol dengan pemain lain.',
        ],
      },
      { teks: 'Sampai jumpa', aksi: ['tutup'] },
    ],
  },
  herbalis: {
    nama: 'Herbalis Mira',
    wajah: 'herbalis',
    buka: [
      'Halo, {nama}. Hutan dan tambang penuh bahan berharga.',
      'Kumpulkan tumbuhan dan bijih, lalu jual di Pandai Besi.',
    ],
    tanya: 'Mau bantu aku hari ini?',
    pilihan: [
      { teks: 'Lihat misi harian', aksi: ['layar', 'misi', { npc: 'herbalis' }] },
      {
        teks: 'Tips mengumpulkan bahan',
        halaman: [
          'Tekan B (atau E) di dekat tumbuhan atau bijih, lalu jangan bergerak sampai bar penuh.',
          'Bijih hanya bisa ditambang dengan beliung satu tingkat di bawahnya. Belilah beliung di Pandai Besi.',
          'Tiap titik tumbuh kembali setelah beberapa saat, jadi kembalilah nanti.',
        ],
      },
      { teks: 'Sampai jumpa', aksi: ['tutup'] },
    ],
  },
  guru: {
    nama: 'Guru Elara',
    wajah: 'guru',
    buka: ['Selamat datang, {nama}. Aku Elara, penjaga jalan para petualang.'],
    tanya: 'Apa yang ingin kamu tanyakan?',
    pilihan: [
      { teks: 'Pelajari skill', aksi: ['layar', 'skill'] },
      {
        teks: 'Bisakah role diganti?',
        halaman: [
          'Tidak. Jalan yang sudah dipilih tak bisa diubah, sebab itulah takdir seorang petualang.',
          'Jika ingin memulai dari awal, pakai Restart Akun Game di menu profil (ikon avatarmu). Seluruh progres game akan dihapus.',
        ],
      },
      { teks: 'Sampai jumpa', aksi: ['tutup'] },
    ],
  },
  pandai: {
    nama: 'Pandai Besi',
    wajah: 'pandai',
    buka: ['Selamat datang! Senjata, zirah, dan perkakas terbaik ada di sini.'],
    tanya: 'Ada yang kamu cari?',
    pilihan: [
      { teks: 'Lihat dagangan', aksi: ['layar', 'toko'] },
      { teks: 'Tidak jadi', aksi: ['tutup'] },
    ],
  },
}