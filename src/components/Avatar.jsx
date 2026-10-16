export default function Avatar({ profil, ukuran = 32 }) {
  const gaya = { width: ukuran, height: ukuran, fontSize: ukuran * 0.45 }

  if (profil?.avatar_url) {
    return <img className="avatar" src={profil.avatar_url} alt="" style={gaya} />
  }
  const huruf = (profil?.username ?? '?').charAt(0).toUpperCase()
  return (
    <span className="avatar" style={gaya} aria-hidden="true">
      {huruf}
    </span>
  )
}