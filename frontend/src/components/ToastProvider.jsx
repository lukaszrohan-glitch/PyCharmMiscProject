import { useState, useCallback, useRef, useEffect } from 'react'
import classNames from 'classnames'
import { ToastCtx } from '../lib/toastContext'
import { AUTO_DISMISS, MAX_TOASTS, TYPE_STYLES, createToastId } from '../lib/toastHelpers'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  useEffect(() => () => {
    timersRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timersRef.current.clear()
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timeoutId = timersRef.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback((message, type = 'success') => {
    if (!message) return undefined
    const id = createToastId()
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      return next.slice(-MAX_TOASTS)
    })
    const timeoutId = window.setTimeout(() => dismiss(id), AUTO_DISMISS)
    timersRef.current.set(id, timeoutId)
    return id
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ show, dismiss }}>
      {children}
      <div className="toast-stack" role="alert" aria-live="assertive">
        {toasts.map((toast) => (
          <div key={toast.id} className={classNames('toast', TYPE_STYLES[toast.type] || TYPE_STYLES.info)}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

