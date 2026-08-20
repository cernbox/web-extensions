/**
 * OCS serves XML unless asked otherwise, so every request here carries `?format=json`.
 */
export const ocsUrl = (path: string) => `${path}?format=json`

/**
 * OCS normally wraps payloads in `{ ocs: { meta, data } }`, but the response shapes in the design
 * doc are written as bare JSON. Accept either until backend ticket #4 pins it down - the cost is
 * one property lookup, and guessing wrong means the page renders nothing.
 */
export const unwrapOcs = <T>(payload: unknown): T => {
  const envelope = payload as { ocs?: { data?: T } }
  return (envelope?.ocs?.data ?? payload) as T
}
