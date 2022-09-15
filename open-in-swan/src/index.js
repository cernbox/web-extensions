import logo from './img/logo-swan.svg'

const appInfo = {
  name: 'SWAN',
  id: 'open-in-swan',
  img: logo,
  extensions: [
    {
      extension: 'ipynb',
      handler: (info) => {
        const path = `/${info.filePath.split('/')
        .filter(Boolean)
        .slice(1)
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
