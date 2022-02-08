import {
  plState,
  plMutations,
  plGetters,
  getContents,
  putContents,
  filePermissions,
  getFilePath
} from '../../common/fileAccess.js'

const namespaced = true

const state = {
  touched: null,
  loading: false,
  currentETag: null,
  currentFile: '',
  lastError: null,
  text: null,
  isReadOnly: true,
  ...plState
}

// TODO pl with password protection

const actions = {
  updateText({ commit }, text) {
    commit('TOUCHED', true)
    commit('UPDATE_TEXT', text)
  },
  clearLastError({ commit }) {
    commit('ERROR', '')
  },
  loadFile({ commit, state }, payload) {
    const client = payload.client
    const filePath = getFilePath(commit, payload.public, payload.filePath, payload.publicLinkPassword)

    commit('LOADING', true)
    commit('CURRENT_FILE', filePath)

    filePermissions(state, client)
      .then((permissions) => {
        if (permissions.indexOf('W') >= 0) {
          commit('WRITE_MODE')
        }
      })
      .catch((error) => {
        commit('ERROR', error.message || error)
        commit('LOADING', false)
      })

    getContents(state, client)
      .then((resp) => {
        commit('CURRENT_ETAG', resp.headers.ETag)
        commit('UPDATE_TEXT', resp.body)
        commit('LOADING', false)
      })
      .catch((error) => {
        commit('ERROR', error.message || error)
        commit('LOADING', false)
      })
  },
  saveFile({ commit, state }, payload) {
    commit('LOADING', true)
    putContents(state, payload.client)
      .then((resp) => {
        commit('CURRENT_ETAG', resp.ETag)

        // get etag & update
        commit('TOUCHED', false)
        commit('LOADING', false)
      })
      .catch((error) => {
        switch (error.statusCode) {
          case 412:
            commit('ERROR', 'This file was updated outside this window. Please refresh the page (all changes will be lost).')
            break
          case 500:
            commit('ERROR', 'Error when contacting the server')
            break
          case 401:
            commit('ERROR', 'You\'re not authorized to save this file')
            break
          default:
            commit('ERROR', error.message || error)
        }
        commit('LOADING', false)
      })
  },
  resetState({ commit }) {
    commit('TOUCHED', false)
    commit('LOADING', false)
    commit('CURRENT_ETAG', null)
    commit('UPDATE_TEXT', null)
    commit('CURRENT_FILE', '')
    commit('ERROR', '')
  }
}

const mutations = {
  TOUCHED(state, flag) {
    state.touched = flag
  },
  LOADING(state, loading) {
    state.loading = loading
  },
  UPDATE_TEXT(state, text) {
    state.text = text
  },
  CURRENT_ETAG(state, etag) {
    state.currentETag = etag
  },
  CURRENT_FILE(state, filePath) {
    state.currentFile = filePath
  },
  ERROR(state, errorMessage) {
    state.lastError = errorMessage
  },
  WRITE_MODE(state) {
    state.isReadOnly = false
  },
  ...plMutations
}

const getters = {
  isTouched: (state) => {
    return state.touched
  },
  isLoading: (state) => {
    return state.loading
  },
  currentContent: (state) => {
    return state.text
  },
  lastError: (state) => {
    return state.lastError
  },
  isReadOnly: (state) => {
    return state.isReadOnly
  },
  currentFile: (state) => {
    return state.currentFile
  },
  ...plGetters
}

export default {
  namespaced,
  state,
  actions,
  mutations,
  getters
}
