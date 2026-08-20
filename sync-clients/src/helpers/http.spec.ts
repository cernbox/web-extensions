import { isFlowGone, statusOf } from './http'

describe('statusOf', () => {
  it('reads the status off an axios-shaped rejection', () => {
    expect(statusOf({ response: { status: 409 } })).toBe(409)
  })

  it.each([undefined, null, new Error('network'), { response: {} }])(
    'returns undefined for %p',
    (error) => {
      expect(statusOf(error)).toBeUndefined()
    }
  )
})

describe('isFlowGone', () => {
  it.each([404, 409, 410])('treats %i as gone', (status) => {
    expect(isFlowGone({ response: { status } })).toBe(true)
  })

  it.each([400, 429, 500, 503])('does not treat %i as gone', (status) => {
    expect(isFlowGone({ response: { status } })).toBe(false)
  })

  it('does not treat a network error as gone', () => {
    expect(isFlowGone(new Error('network'))).toBe(false)
  })
})
