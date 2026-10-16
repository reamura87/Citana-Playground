import KartuSatua from './KartuSatua'

export default function BarisKategori({ judul, daftar, Kartu = KartuSatua }) {
  return (
    <section className="baris">
      <h2>{judul}</h2>
      <div className="baris-scroll">
        {daftar.map((s) => (
          <Kartu key={s.id} data={s} />
        ))}
      </div>
    </section>
  )
}