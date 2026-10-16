import { ambilSatua } from './satua'
import { ambilSeniRupa } from './seniRupa'

export async function ambilKonten() {
  const [satua, seniRupa] = await Promise.all([ambilSatua(), ambilSeniRupa()])
  return [
    ...satua.map((s) => ({ ...s, jenis: 'satua' })),
    ...seniRupa.map((s) => ({ ...s, jenis: 'seniRupa' })),
  ].sort((a, b) => new Date(b.diperbarui_pada) - new Date(a.diperbarui_pada))
}