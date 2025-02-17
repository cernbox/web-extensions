import { filterResources, ResourcePreview, SearchPreview, SearchResult } from '@ownclouders/web-pkg'
import { Resource } from '@ownclouders/web-client'
import { Store } from 'vuex'
import { Component, unref } from 'vue'
import { Router } from 'vue-router'

export default class Preview implements SearchPreview {
  public readonly component: Component
  private readonly router: Router
  private readonly store: Store<any>

  constructor(store: Store<any>, router: Router) {
    this.component = ResourcePreview
    this.router = router
    this.store = store
  }

  public search(term: string): Promise<SearchResult> {
    const result = term?.match(new RegExp('name:"\\*(.*?)\\*"'))
    term = result?.[1]

    if (!term) {
      return Promise.resolve({
        totalResults: null,
        values: []
      })
    }

    // no cache required, the filtering is client only and fast enough to recalculate the set
    // of results every time on the fly
    const resources = filterResources(this.store.getters.files as Resource[], term, 5)
    const areHiddenFilesShown: boolean = this.store.getters.areHiddenFilesShown

    const searchResult = resources.reduce((acc, resource) => {
      // filter results if hidden files shouldn't be shown due to settings
      if (!resource.name.startsWith('.') || areHiddenFilesShown) {
        acc.push({ id: resource.id, data: resource })
      }

      return acc
    }, [])

    return Promise.resolve({ totalResults: searchResult.length, values: searchResult })
  }

  public get available() {
    return unref(this.router.currentRoute).name !== 'search-provider-list'
  }
}
