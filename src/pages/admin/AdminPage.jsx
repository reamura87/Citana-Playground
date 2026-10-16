import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const navigate = useNavigate()

  async function keluar() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <h1>Admin</h1>
      <ul className="daftar">
        <li><Link to="/admin/satua">Kelola satua</Link></li>
        <li><Link to="/admin/seni-rupa">Kelola seni rupa</Link></li>
      </ul>
      <p>
        <button type="button" className="tombol" onClick={keluar}>Keluar</button>
      </p>
    </>
  )
}