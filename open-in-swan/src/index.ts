import logo from './img/logo-swan.svg?raw'
import { encode } from 'js-base64'

const svg = `data:image/svg+xml;base64,${encode(logo)}`

const appInfo = {
  name: 'SWAN',
  id: 'open-in-swan',
  img: svg,
  extensions: [
    {
      extension: 'ipynb',
      handler: (info) => {
        const path = `/${info.driveAliasAndItem.split('/')
        .filter(Boolean)
        .join('/')}`

        if (path.startsWith('/eos/')) {
          window.open(`https://cern.ch/swanserver/cgi-bin/go?projurl=file:/${path}`, '_blank')
        } else {
          // FIXME
          alert('Cannot open this file in SWAN')
        }
      },
      canBeDefault: false
    }
  ]
}

export default {
  appInfo
}
