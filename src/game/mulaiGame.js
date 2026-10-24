import Phaser from 'phaser'
import DuniaScene from './DuniaScene'
import { warnaDariNama } from './gambar'

export function buatGame(induk, { kontrol, status, userId }) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: induk,
    width: 480,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1d2b1d',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [DuniaScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('kontrol', kontrol)
        game.registry.set('idSaya', userId)
        game.registry.set('warna', warnaDariNama(userId ?? status.pemain.nama))
        game.registry.set('terkunci', false)
        game.registry.set('mati', Boolean(status.pemain.mati_sampai))
        game.registry.set('jedaSerang', status.pemain.jeda_serang_ms)
        game.registry.set('selisihWaktu', Date.parse(status.waktu_server) - Date.now())
        game.registry.set('status', status)
      },
    },
  })
}