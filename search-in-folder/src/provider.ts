import { SearchList, SearchPreview, SearchProvider } from '@ownclouders/web-pkg'
import Preview from './preview'
import { Store } from 'vuex'
import { Router } from 'vue-router'

function $gettext(msg: string) {
  return msg
}

export class Provider implements SearchProvider {
  public readonly id: string
  public readonly displayName: string
  public readonly previewSearch: SearchPreview
  public readonly listSearch: SearchList
  private readonly store: Store<any>

  constructor(store: Store<any>, router: Router) {
    this.id = 'files.filter'
    this.displayName = $gettext('In this folder')
    this.store = store
    this.previewSearch = new Preview(store, router)
  }

  public get available() {
    return !!this.store.getters.currentFolder
  }
}
