import KartuSatua from './KartuSatua'

export default function BarisKategori({ judul, daftar }) {
  return (
    <section className="baris">
      <h2>{judul}</h2>
      <div className="baris-scroll">
        {daftar.map((s) => (
          <KartuSatua key={s.id} data={s} />
        ))}
      </div>
    </section>
  )
}