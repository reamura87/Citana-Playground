import { useState } from 'react'
import { hapusFileForum, unggahGambarForum } from '../lib/forum'

export default function FormKirim({
  userId, placeholder, tombol, onKirim, awalIsi = '', fokus = false, onBatal,
}) {
  const [isi, setIsi] = useState(awalIsi)
  const [file, setFile] = useState(null)
  const [pratinjau, setPratinjau] = useState('')
  const [status, setStatus] = useState('')
  const [mengirim, setMengirim] = useState(false)

  function pilihFile(e) {
    const dipilih = e.target.files?.[0]
    e.target.value = ''
    if (!dipilih) return
    if (pratinjau) URL.revokeObjectURL(pratinjau)
    setFile(dipilih)
    setPratinjau(URL.createObjectURL(dipilih))
  }

  function lepasFile() {
    if (pratinjau) URL.revokeObjectURL(pratinjau)
    setFile(null)
    setPratinjau('')
  }

  async function kirim(e) {
    e.preventDefault()
    const teks = isi.trim()
    if (!teks) {
      setStatus('Tulisan tidak boleh kosong.')
      return
    }
    setMengirim(true)
    setStatus('')
    let url = null
    try {
      if (file) url = await unggahGambarForum(file, userId)
      await onKirim({ isi: teks, gambar_url: url })
      setIsi('')
      lepasFile()
    } catch (err) {
      if (url) await hapusFileForum(url)
      setStatus(`Gagal mengirim: ${err.message}`)
    }
    setMengirim(false)
  }

  function kursorKeAkhir(e) {
    const panjang = e.currentTarget.value.length
    e.currentTarget.setSelectionRange(panjang, panjang)
  }

  return (
    <form className="form" onSubmit={kirim}>
      <textarea
        rows={3}
        maxLength={1000}
        value={isi}
        placeholder={placeholder}
        onChange={(e) => setIsi(e.target.value)}
        aria-label={placeholder}
        autoFocus={fokus}
        onFocus={fokus ? kursorKeAkhir : undefined}
      />
      {pratinjau && (
        <div>
          <img src={pratinjau} alt="Pratinjau" className="forum-gambar" />
          <button type="button" className="tautan-tombol" onClick={lepasFile}>Lepas gambar</button>
        </div>
      )}
      <div className="aksi">
        <button type="submit" className="tombol utama" disabled={mengirim}>
          {mengirim ? 'Mengirim…' : tombol}
        </button>
        <label className="tombol">
          Gambar
          <input type="file" accept="image/*" hidden onChange={pilihFile} />
        </label>
        {onBatal && (
          <button type="button" className="tombol" onClick={onBatal}>Batal</button>
        )}
        <span className="redup">{isi.length}/1000</span>
        {status && <span className="redup">{status}</span>}
      </div>
    </form>
  )
}