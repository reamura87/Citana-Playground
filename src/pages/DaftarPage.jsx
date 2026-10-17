import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function DaftarPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [pesan, setPesan] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const navigate = useNavigate()

  async function daftar(e) {
    e.preventDefault()
    const nama = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(nama)) {
      setPesan('Username 3–20 karakter: huruf, angka, atau garis bawah.')
      return
    }
    if (sandi.length < 8) {
      setPesan('Kata sandi minimal 8 karakter.')
      return
    }
    setMengirim(true)
    setPesan('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password: sandi,
      options: { data: { username: nama } },
    })
    setMengirim(false)
    if (error) {
      setPesan('Pendaftaran gagal. Username atau email mungkin sudah dipakai.')
      return
    }
    if (data.session) {
      navigate('/forum')
      return
    }
    setPesan('Berhasil. Periksa emailmu untuk konfirmasi, lalu masuk.')
  }

  return (
    <>
      <h1>Daftar</h1>
      <p>
        pakai password yang beda dari password emailmu. kalau ndak entar dicolong bagas
      </p>
      <form className="form" onSubmit={daftar}>
        <label>
          Username
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Kata sandi
          <input type="password" value={sandi} onChange={(e) => setSandi(e.target.value)} required />
        </label>
        <div className="aksi">
          <button type="submit" className="tombol utama" disabled={mengirim}>
            {mengirim ? 'Mendaftar…' : 'Daftar'}
          </button>
          {pesan && <span className="redup">{pesan}</span>}
        </div>
      </form>
      <p className="redup">Sudah punya akun? <Link to="/masuk">Masuk</Link></p>
    </>
  )
}