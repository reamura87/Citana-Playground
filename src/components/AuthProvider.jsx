import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from '../lib/authContext'
import { ambilProfilSaya } from '../lib/forum'
import { supabase } from '../lib/supabase'

export default function AuthProvider({ children }) {
  const [sesi, setSesi] = useState(undefined) // undefined = memuat, null = belum login
  const [dataProfil, setDataProfil] = useState({ userId: null, profil: null })

  const userId = sesi?.user.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesi(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, sesiBaru) => {
      setSesi(sesiBaru)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    ambilProfilSaya(userId)
      .then((profil) => setDataProfil({ userId, profil }))
      .catch(() => setDataProfil({ userId, profil: null }))
  }, [userId])

  const segarkanProfil = useCallback(async () => {
    if (!userId) return
    const profil = await ambilProfilSaya(userId)
    setDataProfil({ userId, profil })
  }, [userId])

  const profil = dataProfil.userId === userId ? dataProfil.profil : null
  const memuatProfil = userId !== null && dataProfil.userId !== userId

  return (
    <AuthContext.Provider value={{ sesi, profil, memuatProfil, segarkanProfil }}>
      {children}
    </AuthContext.Provider>
  )
}