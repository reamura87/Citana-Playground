import DOMPurify from 'dompurify'

const BASIS_STORAGE = `${import.meta.env.VITE_SUPABASE_URL}/storage/`
const RATA_BOLEH = ['left', 'center', 'right', 'justify']
const TAG_BOLEH = [
  'p', 'br', 'strong', 'em', 'b', 'i', 's', 'u', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'a',
]
const ATTR_BOLEH = ['src', 'alt', 'href', 'style']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Gaya inline: hanya rata teks yang dipertahankan
  if (node.hasAttribute && node.hasAttribute('style')) {
    const rata = node.style.textAlign
    node.removeAttribute('style')
    if (RATA_BOLEH.includes(rata)) node.style.textAlign = rata
  }
  // Gambar: hanya dari penyimpanan situs ini
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') ?? ''
    if (!src.startsWith(BASIS_STORAGE)) node.remove()
  }
  // Tautan: selalu tab baru dan nofollow
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

export default function IsiCerita({ html }) {
  const bersih = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAG_BOLEH,
    ALLOWED_ATTR: ATTR_BOLEH,
  })
  return <div className="isi" dangerouslySetInnerHTML={{ __html: bersih }} />
}