import { useEffect, useRef } from 'react'

const KUNCI = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function Captcha({ onToken }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!KUNCI) return
    let id = null
    let batal = false
    function gambar() {
      if (batal || !ref.current || !window.turnstile) return
      id = window.turnstile.render(ref.current, {
        sitekey: KUNCI,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      })
    }
    if (window.turnstile) {
      gambar()
    } else {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.onload = gambar
      document.head.appendChild(s)
    }
    return () => {
      batal = true
      if (id !== null && window.turnstile) window.turnstile.remove(id)
    }
  }, [onToken])

  return <div ref={ref} />
}