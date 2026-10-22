import Phaser from 'phaser'
import DuniaScene from './DuniaScene'
import { warnaDariNama } from './gambar'

export function buatGame(induk, { kontrol, status }) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: induk,
    width: 480,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1d2b1d',
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [DuniaScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('kontrol', kontrol)
        game.registry.set('warna', warnaDariNama(status.pemain.nama))
        game.registry.set('terkunci', false)
        game.registry.set('selisihWaktu', Date.parse(status.waktu_server) - Date.now())
        game.registry.set('status', status)
      },
    },
  })
}