const format = (n) => n.toLocaleString('id-ID')

function BlokPemain({ pemain: p, hp, persenHp, persenXp, harian, sisaReset, peta, aman }) {
  return (
    <>
      <div className="hud-kiri">
        <div className="hud-nama">
          <strong>{p.nama}</strong> · Lv {p.level}
        </div>
        <div className="hud-bar hud-hp" role="progressbar" aria-label="Darah" aria-valuemin={0} aria-valuemax={p.hp_maks} aria-valuenow={hp}>
          <span style={{ width: `${persenHp}%` }} />
          <em>HP {hp}/{p.hp_maks}</em>
        </div>
        <div className="hud-bar hud-xp" role="progressbar" aria-label="XP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={persenXp}>
          <span style={{ width: `${persenXp}%` }} />
          <em>XP {p.xp}/{p.xp_butuh}</em>
        </div>
      </div>

      <div className="hud-kanan">
        <span>Gold {format(p.gold)}</span>
        <span>ATK {p.attack} · DEF {p.defense}</span>
        <span className="hud-hadiah">Hadiah {harian.berhadiah}/{harian.batas}</span>
        <small className="hud-detail">{peta === 'server' ? 'Kerajaan' : 'Rumah'} · reset {sisaReset}</small>
        {aman && <strong className="hud-aman">Zona aman</strong>}
      </div>
    </>
  )
}

function BlokMusuh({ target, bos, bosTeks, forage }) {
  return (
    <>
      {(target || bos) && (
        <div className="hud-tengah">
          {target && (
            <div>
              <div className="hud-judul">
                <strong>{target.nama}</strong>
                <small>{target.hp}/{target.hp_maks}</small>
              </div>
              <div className="hud-bar hud-musuh">
                <span style={{ width: `${Math.round((target.hp / target.hp_maks) * 100)}%` }} />
              </div>
            </div>
          )}
          {bos && (
            <div>
              <div className="hud-judul">
                <strong>{bos.nama}</strong>
                <small>{bosTeks}</small>
              </div>
              <div className="hud-bar hud-musuh">
                <span style={{ width: `${Math.round((bos.hp / bos.hp_maks) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {forage && (
        <div className="hud-forage">
          <small>{forage.jenis === 'ore' ? 'Menambang' : 'Mengumpulkan'} {forage.nama}… (gerak untuk batal)</small>
          <div className="hud-bar">
            <span key={forage.mulai} className="hud-isi-anim" style={{ animationDuration: `${forage.durasi}ms` }} />
          </div>
        </div>
      )}
    </>
  )
}

// bagian: 'semua' (PC, di atas layar), 'pemain' (strip di luar layar), 'musuh' (bar tipis di atas layar)
export default function HudGame({ bagian = 'semua', ...props }) {
  if (bagian === 'pemain') {
    return (
      <div className="hud hud-strip">
        <BlokPemain {...props} />
      </div>
    )
  }
  return (
    <div className="hud">
      {bagian === 'semua' && <BlokPemain {...props} />}
      <BlokMusuh {...props} />
    </div>
  )
}