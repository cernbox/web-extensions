
const DavPermissions = '{http://owncloud.org/ns}permissions'
const DavProperties = [DavPermissions]

const plState = {
  isPublicLink: false,
  plToken: null,
  publicLinkPassword: null
}

const plMutations = {
  PUBLIC_LINK(state, flag) {
    state.isPublicLink = flag
  },
  PL_TOKEN(state, token) {
    state.plToken = token
  },
  PL_PASSWORD(state, password) {
    state.publicLinkPassword = password
  }
}

const plGetters = {
  isPublicLink: (state) => {
    return state.isPublicLink
  },
  plToken: (state) => {
    return state.plToken
  },
  publicLinkPassword: (state) => {
    return state.publicLinkPassword
  }
}

const getContents = (state, client) => {

  if (state.isPublicLink) {
    return new Promise((resolve, reject) => {
      client.publicFiles.download(state.plToken, state.currentFile, state.publicLinkPassword).then(async (res) => {
        res.statusCode = res.status
        resolve({
          response: res,
          body: await res.text(),
          headers: {
            ETag: res.headers.get('etag'),
            'OC-FileId': res.headers.get('oc-fileid')
          }
        })
      })
      .catch(reject)
    })
  } else {
    return client.files.getFileContents(webdavPath(state.currentFile), {
      resolveWithResponseObject: true,
      noCache: true
    })
  }
}

const putContents = (state, client) => {
  if (state.isPublicLink) {
    return client.publicFiles.putFileContents(state.plToken, state.currentFile, state.publicLinkPassword, state.text, {
      previousEntityTag: state.currentETag
    })
  } else {
    return client.files.putFileContents(webdavPath(state.currentFile), state.text, {
      previousEntityTag: state.currentETag
    })
  }
}

const fileInfo = (state, client) => {
  if (state.isPublicLink) {
    return client.publicFiles.getFileInfo(state.plToken + state.currentFile, state.publicLinkPassword, DavProperties)
  } else {
    return client.files.fileInfo(webdavPath(state.currentFile), DavProperties)
  }
}

const filePermissions = (state, client) => {
  return new Promise((resolve, reject) => {
    fileInfo(state, client)
      .then((resp) => {
        resolve(resp.fileInfo[DavPermissions] || '')
      })
      .catch(reject)
  })
}

const getFilePath = (commit, isPublic, filePath, publicLinkPassword = null) => {
  if (isPublic) {
    const path = filePath.split('/')
    path.shift() // remove empty first elem
    const token = path.shift()
    commit('PL_TOKEN', token)
    commit('PUBLIC_LINK', true)
    commit('PL_PASSWORD', publicLinkPassword)
    return '/' + path.join('/')
  } else {
    return filePath
  }
}

const getFileUrl = (client, isPublic, filePath) => {
  if (isPublic) {
    const path = filePath.split('/')
    path.shift() // remove empty first elem
    const token = path.shift()
    const plFile = '/' + path.join('/')
    return client.publicFiles.getFileUrl(token, plFile)
  } else {
    return client.files.getFileUrl(webdavPath(filePath))
  }
}

const getHeadersWithAuth = (isPublic, token, publicLinkPassword) => {
  const headers = new Headers({
    'X-Requested-With': 'XMLHttpRequest'
  })
  if (isPublic) {
    headers.append(
        'Authorization',
        'Basic ' + Buffer.from('public:' + publicLinkPassword).toString('base64')
      )
  } else {
    headers.append('Authorization', 'Bearer ' + token)
  }
  return headers
}

const webdavPath = (path) => {
  const user = window.__$store.state.user.id
  return `files/${user}/${path}`
}

export {
  plState,
  plMutations,
  plGetters,
  getContents,
  putContents,
  fileInfo,
  filePermissions,
  getFilePath,
  getFileUrl,
  getHeadersWithAuth
}