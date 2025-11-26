import { createContext, useContext } from 'react'

export const ToastCtx = createContext({ show: () => {}, dismiss: () => {} })

export const useToast = () => useContext(ToastCtx)

