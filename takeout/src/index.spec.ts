import { unref } from 'vue'

vi.mock('@ownclouders/web-pkg', () => ({
  defineWebApplication: (args: unknown) => args
}))

// the section pulls in the rest of web-pkg through its own imports; irrelevant here
vi.mock('./components/TakeoutSection.vue', () => ({ default: { name: 'TakeoutSection' } }))

import application from './index'

describe('takeout application', () => {
  it('scopes the account section to its extension point', () => {
    const { extensions } = application.setup({ applicationConfig: {} })
    const [extension] = unref(extensions)
    expect(extension.type).toBe('customComponent')
    // without this the extension also renders into every other customComponent point,
    // e.g. app.runtime.global-progress-bar
    expect(extension.extensionPointIds).toEqual(['app.runtime.account.sections'])
  })
})
