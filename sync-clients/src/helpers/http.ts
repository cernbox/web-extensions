/**
 * Reads the HTTP status off an axios rejection without pulling axios in (it is not one of the
 * modules the host provides to extensions, so importing it would bundle a second copy).
 */
export const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status

/**
 * Statuses that mean "this flow is gone": not found, already handled, or lost the
 * compare-and-set race against the polling client. All three land on the same screen.
 */
const GONE = [404, 409, 410]

export const isFlowGone = (error: unknown): boolean => GONE.includes(statusOf(error))
