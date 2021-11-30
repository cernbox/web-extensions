import {
  plState,
  plMutations,
  plGetters,
  getContents,
  getFilePath
} from '../../common/fileAccess.js'
import * as ipynb2html from 'ipynb2html'

const namespaced = true

const state = {
  loading: false,
  currentFile: '',
  lastError: null,
  notebook: null,
  ...plState
}

const actions = {
  clearLastError({ commit }) {
    commit('ERROR', '')
  },
  loadFile({ commit }, payload) {
    const filePath = getFilePath(commit, payload.public, payload.filePath)
    const client = payload.client

    commit('LOADING', true)
    commit('CURRENT_FILE', filePath)
    getContents(state, client)
      .then((resp) => {
        const jsonResponse = JSON.parse(resp.body)
        const notebookHtml = ipynb2html.render(jsonResponse)
        commit('UPDATE_NOTEBOOK', notebookHtml.innerHTML)
        commit('LOADING', false)
      })
      .catch((error) => {
        commit('ERROR', error.message || error)
        commit('LOADING', false)
      })
  }
}

const mutations = {
  LOADING(state, loading) {
    state.loading = loading
  },
  UPDATE_NOTEBOOK(state, notebook) {
    state.notebook = notebook
  },
  CURRENT_FILE(state, filePath) {
    state.currentFile = filePath
  },
  ERROR(state, errorMessage) {
    state.lastError = errorMessage
  },
  ...plMutations
}

const getters = {
  isLoading: (state) => {
    return state.loading
  },
  renderedNotebook: (state) => {
    return state.notebook
  },
  lastError: (state) => {
    return state.lastError
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
