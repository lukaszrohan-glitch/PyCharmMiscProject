export const AUTO_DISMISS = 4000
export const MAX_TOASTS = 4

export const TYPE_STYLES = {
  info: 'toast-info',
  success: 'toast-success',
  error: 'toast-error'
}

export const createToastId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

