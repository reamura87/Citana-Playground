import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useSesi() {
  const [sesi, setSesi] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesi(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, sesiBaru) => {
      setSesi(sesiBaru)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return sesi
}