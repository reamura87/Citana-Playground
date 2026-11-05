
import { useEffect, useRef } from 'react'

const KUNCI = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function Captcha({ onToken }) {
  const ref = useRef(null)
  const callbackRef = useRef(onToken)

  useEffect(() => {
    callbackRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!KUNCI) {
      console.error('Turnstile Site Key belum diatur.')
      return
    }

    let id = null
    let batal = false

    function gambar() {
      if (batal || !ref.current || !window.turnstile) return

      id = window.turnstile.render(ref.current, {
        sitekey: KUNCI,

        callback: (token) => {
          callbackRef.current(token)
        },

        'expired-callback': () => {
          callbackRef.current(null)
        },

        'error-callback': () => {
          callbackRef.current(null)
        }
      })
    }

    if (window.turnstile) {
      gambar()
    } else {
      let script = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      )

      if (!script) {
        script = document.createElement('script')
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      script.addEventListener('load', gambar)
    }

    return () => {
      batal = true

      if (id !== null && window.turnstile) {
        window.turnstile.remove(id)
      }
    }
  }, [])

  return <div ref={ref} />
}
