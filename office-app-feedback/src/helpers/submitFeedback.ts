import { urlJoin } from '@ownclouders/web-client'
import type { RequestResult } from '@ownclouders/web-pkg'

interface SubmitFeedbackContext {
  makeRequest: RequestResult['makeRequest']
  serverUrl: string
  username: string
}

export const submitFeedback = async (
  message: string,
  { makeRequest, serverUrl, username }: SubmitFeedbackContext
): Promise<void> => {
  const body = [`User: ${username}`, `URL: ${window.location.href}`, '', message].join('\n')

  const response = await makeRequest('POST', urlJoin(serverUrl, 'app/feedback'), {
    data: body,
    headers: { 'Content-Type': 'text/plain' },
    validateStatus: () => true
  })

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to submit feedback: ${response.status}`)
  }
}
