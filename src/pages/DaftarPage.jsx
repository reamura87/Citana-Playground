import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Captcha from '../components/Captcha'

export default function DaftarPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [pesan, setPesan] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const [setuju, setSetuju] = useState(false)
  const [token, setToken] = useState(null)
  const navigate = useNavigate()

  async function daftar(e) {
    e.preventDefault()
    if (!setuju) {
      setPesan('Kamu perlu menyetujui Syarat dan Kebijakan Privasi.')
      return
    }
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: sandi,
        options: { captchaToken: token, data: { username: nama } },
      })

      if (error) {
        setPesan(`Pendaftaran gagal: ${error.message}`)
        return
      }
      if (data.session) {
        navigate('/forum')
        return
      }
      setPesan('Berhasil. Periksa emailmu untuk konfirmasi, lalu masuk.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setPesan(`Tidak dapat menghubungi server pendaftaran: ${detail}`)
    } finally {
      setMengirim(false)
    }
  }

  return (
    <>
      <h1>Daftar</h1>
      <p>
        daftar aja ndak usah banyak tanya.
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

        <label className="centang">
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
          <span>Saya setuju dengan <Link to="/syarat">Syarat</Link> dan <Link to="/privasi">Kebijakan Privasi</Link></span>
        </label>



        <div className="aksi">

          <button type="submit" className="tombol utama" disabled={!token || mengirim}>
            {mengirim ? 'Mendaftar…' : 'Daftar'}
          </button>
          {pesan && <span className="redup">{pesan}</span>}
          <Captcha onToken={setToken} />
        </div>
      </form>
      <p className="redup">Sudah punya akun? <Link to="/masuk">Masuk</Link></p>
    </>
  )
}