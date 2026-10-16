import KartuSatua from './KartuSatua'
import KartuSeniRupa from './KartuSeniRupa'

const kartuPerJenis = {
  satua: KartuSatua,
  seniRupa: KartuSeniRupa,
  // nanti: tari: KartuTari, tempat: KartuTempat
}

export default function KartuKonten({ item }) {
  const Kartu = kartuPerJenis[item.jenis]
  return Kartu ? <Kartu data={item} /> : null
}