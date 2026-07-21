// TODO: replace with a real POST to the feedback endpoint once one exists.
export const submitFeedback = (message: string): Promise<void> => {
  console.debug('[office-app-feedback] mock feedback submission', message)
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}
