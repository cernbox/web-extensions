import logo from './img/logo-swan.svg'

const appInfo = {
  name: 'SWAN',
  id: 'open-in-swan',
  img: logo,
  extensions: [
    {
      extension: 'ipynb',
      handler: (info) => {
        window.open(
          'https://cern.ch/swanserver/cgi-bin/go?projurl=file:/' + info.filePath,
          '_blank'
        )
      },
      canBeDefault: false
    }
  ]
}

export default {
  appInfo
}
