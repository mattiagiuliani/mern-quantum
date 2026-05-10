export function getApiErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage.trim()
  }

  return fallbackMessage
}