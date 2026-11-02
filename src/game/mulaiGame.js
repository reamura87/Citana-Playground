import Phaser from 'phaser'
import DuniaScene from './DuniaScene'
import { warnaDariNama } from './gambar'
import UIScene from './ui/UIScene'

// mode 'karakter': hanya jendela pembuat karakter. mode 'dunia': dunia game + UI di atasnya.
export function buatGame(induk, { mode, kontrol, status, userId, katalog, admin, karakterAwal, api }) {
  const dunia = mode === 'dunia'
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: induk,
    width: 480,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1d2b1d',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: dunia ? [DuniaScene, UIScene] : [UIScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('mode', mode)
        game.registry.set('kontrol', kontrol)
        game.registry.set('api', api)
        game.registry.set('katalog', katalog)
        game.registry.set('admin', admin)
        game.registry.set('idSaya', userId)
        game.registry.set('karakterAwal', karakterAwal)
        game.registry.set('uiBuka', false)
        game.registry.set('sibuk', false)
        if (dunia) {
          game.registry.set('warna', warnaDariNama(userId ?? status.pemain.nama))
          game.registry.set('kelas', status.pemain.kelas)
          game.registry.set('kustom', status.pemain.kustom)
          game.registry.set('terkunci', false)
          game.registry.set('mati', Boolean(status.pemain.mati_sampai))
          game.registry.set('jedaSerang', status.pemain.jeda_serang_ms)
          game.registry.set('selisihWaktu', Date.parse(status.waktu_server) - Date.now())
          game.registry.set('status', status)
        }
      },
    },
  })
}