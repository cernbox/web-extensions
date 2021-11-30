
const DavPermissions = '{http://owncloud.org/ns}permissions'
const DavProperties = [DavPermissions]

const plState = {
  isPublicLink: false,
  plToken: null
}

const plMutations = {
  PUBLIC_LINK(state, flag) {
    state.isPublicLink = flag
  },
  PL_TOKEN(state, token) {
    state.plToken = token
  }
}

const plGetters = {
  isPublicLink: (state) => {
    return state.isPublicLink
  },
  plToken: (state) => {
    return state.plToken
  }
}

const getContents = (state, client) => {
  if (state.isPublicLink) {
    return new Promise((resolve, reject) => {
      client.publicFiles.download(state.plToken, state.currentFile).then(async (res) => {
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
    return client.files.getFileContents(state.currentFile, {
      resolveWithResponseObject: true,
      noCache: true
    })
  }
}

const putContents = (state, client) => {
  if (state.isPublicLink) {
    return client.publicFiles.putFileContents(state.plToken, state.currentFile, null, state.text, {
      previousEntityTag: state.currentETag
    })
  } else {
    return client.files.putFileContents(state.currentFile, state.text, {
      previousEntityTag: state.currentETag
    })
  }
}

const fileInfo = (state, client) => {
  if (state.isPublicLink) {
    return client.publicFiles.getFileInfo(state.plToken + state.currentFile, null, DavProperties)
  } else {
    return client.files.fileInfo(state.currentFile, DavProperties)
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

const getFilePath = (commit, isPublic, filePath) => {
  if (isPublic) {
    const path = filePath.split('/')
    path.shift() // remove empty first elem
    const token = path.shift()
    commit('PL_TOKEN', token)
    commit('PUBLIC_LINK', true)
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
    return client.files.getFileUrl(filePath)
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