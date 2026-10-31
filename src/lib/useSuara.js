import { useSyncExternalStore } from 'react'
import { suara } from '../game/suara'

// { nyala, volume }
export function useSuara() {
  return useSyncExternalStore(suara.berlangganan, suara.cuplikan)
}