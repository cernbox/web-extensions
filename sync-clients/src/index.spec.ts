import { unref } from 'vue'

const addRoute = vi.fn()

vi.mock('@ownclouders/web-pkg', () => ({
  defineWebApplication: (args: unknown) => args,
  useRouter: () => ({ addRoute })
}))

vi.mock('vue3-gettext', () => ({
  useGettext: () => ({ $gettext: (msg: string) => msg, current: 'en' })
}))

// the views pull in the rest of web-pkg through their own imports; they are irrelevant here
vi.mock('./views/LoginFlowPage.vue', () => ({ default: { name: 'LoginFlowPage' } }))
vi.mock('./components/ConnectedClientsSection.vue', () => ({
  default: { name: 'ConnectedClientsSection' }
}))

import application from './index'
import { isMockMode } from './api'

const run = (applicationConfig: Record<string, unknown> = {}) =>
  application.setup({ applicationConfig })

describe('sync-clients application', () => {
  beforeEach(() => {
    addRoute.mockClear()
  })

  it('registers the login flow at the top level, not under /<appId>', () => {
    run()
    expect(addRoute).toHaveBeenCalledTimes(1)
    const route = addRoute.mock.calls[0][0]
    // the sync client is sent to exactly this path; the runtime would prefix it with
    // /sync-clients if the route went through the `routes` key instead
    expect(route.path).toBe('/login-flow/:logintoken')
  })

  it('requires a user session so the auth guard runs SSO and returns', () => {
    run()
    expect(addRoute.mock.calls[0][0].meta.authContext).toBe('user')
  })

  it('leaves the route unnamed so it gets the plain full-page layout', () => {
    run()
    // useLayout returns 'plain' for any route without a name; its list of named plain-layout
    // routes is hardcoded to runtime pages, so this is the only lever an external app has
    expect(addRoute.mock.calls[0][0].name).toBeUndefined()
  })

  it('scopes the account section to its extension point', () => {
    const { extensions } = run()
    const [extension] = unref(extensions)
    expect(extension.type).toBe('customComponent')
    // without this the extension also renders into every other customComponent point,
    // e.g. app.runtime.global-progress-bar
    expect(extension.extensionPointIds).toEqual(['app.runtime.account.sections'])
  })

  it('leaves mock mode off unless the deployment asks for it', () => {
    run()
    expect(isMockMode()).toBe(false)
    run({ mock: true })
    expect(isMockMode()).toBe(true)
    run({ mock: 'yes' })
    expect(isMockMode()).toBe(false)
  })
})
