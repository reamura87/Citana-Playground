import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import { EpisodeDetail, SatuaDetail, SatuaList, SatuaPersonalList } from './pages/SatuaPages'
import './App.css'
import RuteAdmin from './components/RuteAdmin'
import MasukPage from './pages/MasukPage'
import AdminSatuaPage from './pages/admin/AdminSatuaPage'
import EditorSatuaPage from './pages/admin/EditorSatuaPage'
import { SeniRupaList, SeniRupaDetail } from './pages/SeniRupaPages'
import AdminPage from './pages/admin/AdminPage'
import AdminSeniRupaPage from './pages/admin/AdminSeniRupaPage'
import EditorSeniRupaPage from './pages/admin/EditorSeniRupaPage'
import { ForumList, ForumThread } from './pages/ForumPages'
import DaftarPage from './pages/DaftarPage'
import RuteMasuk from './components/RuteMasuk'
import KaryaSayaPage from './pages/KaryaSayaPage'
import CariPage from './pages/CariPage'
import { EditorEpisode, EditorTulisan, TulisanSaya } from './pages/TulisPages'
import { AlatList, HapusLatarPage } from './pages/AlatPages'
import PdfKeWordPage from './pages/PdfKeWordPage'
import PassfotoPage from './pages/PasfotoPage'
import GamePage from './pages/GamePage'
import { Lapor, Privasi, Syarat } from './pages/halamanhukum'


function App() {
  const [tema, setTema] = useState(
    () => document.documentElement.dataset.theme ?? 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem('tema', tema)
  }, [tema])

    const { pathname } = useLocation()

  return (
    <>
      <Header
        tema={tema}
        onGantiTema={() => setTema(tema === 'dark' ? 'light' : 'dark')}
      />
      <main className={pathname.startsWith('/game') ? 'lebar' : undefined}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/satua" element={<SatuaList />} />
          <Route path="/satua/:slug" element={<SatuaDetail />} />
          <Route path="/masuk" element={<MasukPage />} />
          <Route path="/admin/satua" element={<RuteAdmin><AdminSatuaPage /></RuteAdmin>} />
          <Route path="/admin/satua/baru" element={<RuteAdmin><EditorSatuaPage /></RuteAdmin>} />
          <Route path="/admin/satua/:id" element={<RuteAdmin><EditorSatuaPage /></RuteAdmin>} />
          <Route path="/seni-rupa" element={<SeniRupaList />} />
          <Route path="/seni-rupa/:id" element={<SeniRupaDetail />} />
          <Route path="/admin" element={<RuteAdmin><AdminPage /></RuteAdmin>} />
          <Route path="/admin/seni-rupa" element={<RuteAdmin><AdminSeniRupaPage /></RuteAdmin>} />
          <Route path="*" element={<p>Halaman tidak ditemukan.</p>} />
          <Route path="/forum" element={<ForumList />} />
          <Route path="/forum/:id" element={<ForumThread />} />
          <Route path="/daftar" element={<DaftarPage />} />
          <Route path="/seni-rupa/saya" element={<RuteMasuk><KaryaSayaPage /></RuteMasuk>} />
          <Route path="/seni-rupa/baru" element={<RuteMasuk><EditorSeniRupaPage /></RuteMasuk>} />
          <Route path="/cari" element={<CariPage />} />
          <Route path="/seni-rupa/:id/edit" element={<RuteMasuk><EditorSeniRupaPage /></RuteMasuk>} />
          <Route path="/satua" element={<SatuaList />} />
          <Route path="/satua/personal" element={<SatuaPersonalList />} />
          <Route path="/satua/:slug" element={<SatuaDetail />} />
          <Route path="/satua/:slug/episode/:nomor" element={<EpisodeDetail />} />

          <Route path="/tulis" element={<RuteMasuk><EditorTulisan /></RuteMasuk>} />
          <Route path="/tulis/saya" element={<RuteMasuk><TulisanSaya /></RuteMasuk>} />
          <Route path="/tulis/:id" element={<RuteMasuk><EditorTulisan /></RuteMasuk>} />
          <Route path="/tulis/:id/episode/baru" element={<RuteMasuk><EditorEpisode /></RuteMasuk>} />
          <Route path="/tulis/:id/episode/:episodeId" element={<RuteMasuk><EditorEpisode /></RuteMasuk>} />
          <Route path="/alat" element={<AlatList />} />
          <Route path="/alat/hapus-latar" element={<HapusLatarPage />} />
          <Route path="/alat/pdf-ke-word" element={<PdfKeWordPage />} />
          <Route path="/alat/pas-foto" element={<PassfotoPage />} />
          <Route path="/game" element={<RuteMasuk><GamePage /></RuteMasuk>} />
          <Route path="/syarat" element={<Syarat />} />
          <Route path="/privasi" element={<Privasi />} />
          <Route path="/lapor" element={<Lapor />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App