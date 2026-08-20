/**
 * Flow metadata as returned by `GET /ocs/v2.php/cloud/user/login-flow/{logintoken}`.
 *
 * `client_label` is the sync client's User-Agent, already parsed into a human-readable
 * string server-side, so it is rendered as plain text and never as markup.
 */
export interface FlowInfo {
  client_id: string
  client_label: string
  created_at: string
  expires_at: string
  /**
   * Not part of the agreed contract yet (backend ticket #9). The request age and the expiry
   * countdown are otherwise computed against the browser clock, so a skewed machine shows a
   * valid flow as already expired.
   */
  server_time?: string
}

/** One entry of `GET /ocs/v2.php/cloud/user/clients`. */
export interface ConnectedClient {
  id: string
  /** Chosen by the user when they granted the flow. */
  name: string
  /** What the client reports about itself, parsed server-side, so render as text and never as markup. */
  description: string
  created_at: string
  last_seen_at: string | null
}

/** Terminal states of the confirmation page, each with its own screen. */
export type FlowOutcomeKind = 'granted' | 'denied' | 'expired' | 'error'

export type FlowState = 'loading' | 'pending' | 'submitting' | FlowOutcomeKind
