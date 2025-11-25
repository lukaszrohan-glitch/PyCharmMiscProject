import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const AUTO_DISMISS = 4000
const MAX_TOASTS = 4
const ToastCtx = createContext({ show: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const existing = timers.current.get(id)
    if (existing) {
      clearTimeout(existing)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback((msg, kind = 'success') => {
    const id = crypto?.randomUUID?.() || Date.now() + Math.random()
    setToasts((current) => {
      const next = [...current, { id, msg, kind }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    const timeoutId = setTimeout(() => remove(id), AUTO_DISMISS)
    timers.current.set(id, timeoutId)
  }, [remove])

  useEffect(() => () => {
    timers.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timers.current.clear()
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Powiadomienia">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`} role="status">
            <span>{toast.msg}</span>
            <button className="toast-dismiss" aria-label="Zamknij" onClick={() => remove(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
