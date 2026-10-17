import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ambilProfilSaya } from '../lib/forum'

export default function MasukPage() {
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [pesan, setPesan] = useState('')
  const navigate = useNavigate()

async function masuk(e) {
  e.preventDefault()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sandi })
  if (error) {
    setPesan('Email atau kata sandi salah.')
    return
  }
  const profil = await ambilProfilSaya(data.user.id)
  navigate(profil?.peran === 'admin' ? '/admin' : '/forum')
}

  return (
    <>
      <h1>Masuk</h1>
      <p>
        Ada fitur login di website ini karena aku ndak percaya sama khe. bercanda
      </p>
      <form className="form" onSubmit={masuk}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Kata sandi
          <input type="password" value={sandi} onChange={(e) => setSandi(e.target.value)} required />
        </label>
        <div className="aksi">
          <button type="submit" className="tombol utama">Masuk</button>
          {pesan && <span className="redup">{pesan}</span>}
        <p className="redup">Belum punya akun? <Link to="/daftar">Daftar</Link></p>
        </div>
      </form>
    </>
  )
}