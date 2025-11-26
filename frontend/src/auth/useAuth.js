import { useContext } from 'react'
import { AuthContext } from './context'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      profile: null,
      checkingAuth: false,
      loginWithCredentials: async () => ({ user: null, token: null }),
      setAuth: () => {},
      refreshProfile: async () => null,
      logout: () => {},
    }
  }
  return ctx
}
