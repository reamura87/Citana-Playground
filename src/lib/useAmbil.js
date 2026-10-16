import { useEffect, useState } from 'react'

export function useAmbil(ambil, deps) {
  const [state, setState] = useState({ data: null, memuat: true, error: null })

  useEffect(() => {
    let batal = false
    ambil()
      .then((data) => {
        if (!batal) setState({ data, memuat: false, error: null })
      })
      .catch((error) => {
        if (!batal) setState({ data: null, memuat: false, error })
      })
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}