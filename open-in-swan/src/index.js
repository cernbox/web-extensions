import logo from './img/logo-swan.svg'

const appInfo = {
  name: 'SWAN',
  id: 'open-in-swan',
  img: logo,
  extensions: [
    {
      extension: 'ipynb',
      handler: (info) => {
        if (info.filePath.startsWith('/files')) {
          let path = info.filePath.split('/')
          path.splice(0, 3)
          path = path.join('/')
          window.open('https://cern.ch/swanserver/cgi-bin/go?projurl=file://' + path, '_blank')
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
