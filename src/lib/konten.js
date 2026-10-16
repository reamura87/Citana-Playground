import { ambilPersonal } from './personal'
import { ambilSatua } from './satua'
import { ambilSeniRupa } from './seniRupa'

export async function ambilKonten() {
  const [satua, personal, seniRupa] = await Promise.all([
    ambilSatua(),
    ambilPersonal(),
    ambilSeniRupa(),
  ])
  return [
    ...satua.map((s) => ({ ...s, jenis: 'satua' })),
    ...personal.map((s) => ({ ...s, jenis: 'satuaPersonal', jenisTulisan: s.jenis })),
    ...seniRupa.map((s) => ({ ...s, jenis: 'seniRupa' })),
  ].sort((a, b) => new Date(b.diperbarui_pada) - new Date(a.diperbarui_pada))
}