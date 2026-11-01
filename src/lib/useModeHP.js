import { useSyncExternalStore } from 'react'

// Mode HP: perangkat sentuh atau jendela sempit
const KUERI = '(pointer: coarse), (max-width: 700px)'

function langganan(fungsi) {
  const m = window.matchMedia(KUERI)
  m.addEventListener('change', fungsi)
  return () => m.removeEventListener('change', fungsi)
}
const cuplikan = () => window.matchMedia(KUERI).matches

export function useModeHP() {
  return useSyncExternalStore(langganan, cuplikan, () => false)
}