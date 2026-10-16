import DOMPurify from 'dompurify'

export default function IsiCerita({ html }) {
  return (
    <div
      className="isi"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  )
}