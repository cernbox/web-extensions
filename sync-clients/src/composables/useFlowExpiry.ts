import { computed, onUnmounted, ref, unref, type Ref } from 'vue'
import { formatRelativeDateFromISO } from '@ownclouders/web-pkg'
import { useGettext } from 'vue3-gettext'
import type { FlowInfo } from '../types'

/**
 * Drives the "requested 2 minutes ago" line and the live expiry countdown.
 *
 * Both are computed against the browser clock, which can be minutes off. When the server sends
 * `server_time` (backend ticket #9) the difference is measured once on load and applied to every
 * later comparison, so a skewed machine does not show a valid flow as expired.
 */
export const useFlowExpiry = (flow: Ref<FlowInfo | undefined>) => {
  // kept as the object: `current` is reactive on it, destructuring would snapshot it
  const language = useGettext()

  const now = ref(Date.now())
  const skew = ref(0)

  const interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onUnmounted(() => clearInterval(interval))

  /** Call once, as soon as the flow info is in. */
  const syncClock = (info: FlowInfo) => {
    const serverNow = info.server_time ? Date.parse(info.server_time) : NaN
    skew.value = Number.isNaN(serverNow) ? 0 : serverNow - Date.now()
    now.value = Date.now()
  }

  const remainingSeconds = computed(() => {
    const info = unref(flow)
    if (!info) {
      return 0
    }
    const remaining = Date.parse(info.expires_at) - (unref(now) + unref(skew))
    return Math.max(0, Math.floor(remaining / 1000))
  })

  const isExpired = computed(() => !!unref(flow) && unref(remainingSeconds) === 0)

  const countdown = computed(() => {
    const total = unref(remainingSeconds)
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  })

  const relativeAge = computed(() => {
    const info = unref(flow)
    return info ? formatRelativeDateFromISO(info.created_at, language.current) : ''
  })

  return { isExpired, remainingSeconds, countdown, relativeAge, syncClock }
}
