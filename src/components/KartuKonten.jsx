import KartuSatua from './KartuSatua'
import KartuSatuaPersonal from './KartuSatuaPersonal'
import KartuSeniRupa from './KartuSeniRupa'

const kartuPerJenis = {
  satua: KartuSatua,
  satuaPersonal: KartuSatuaPersonal,
  seniRupa: KartuSeniRupa,
  // nanti: tari: KartuTari, tempat: KartuTempat
}

export default function KartuKonten({ item }) {
  const Kartu = kartuPerJenis[item.jenis]
  return Kartu ? <Kartu data={item} /> : null
}