import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import { SatuaList, SatuaDetail } from './pages/SatuaPages'
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

function App() {
  const [tema, setTema] = useState(
    () => document.documentElement.dataset.theme ?? 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem('tema', tema)
  }, [tema])

  return (
    <>
      <Header
        tema={tema}
        onGantiTema={() => setTema(tema === 'dark' ? 'light' : 'dark')}
      />
      <main>
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
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App