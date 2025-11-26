import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context'
import * as api from '../services/api'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)

  // Startup: check token and fetch profile
  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      setChecking(false)
      return
    }
    (async () => {
      try {
        const me = await api.getProfile()
        // Don't clear token on transient errors; only set profile if available
        setProfile(me || null)
      } catch (e) {
        // Keep token; backend may be unreachable temporarily
        console.warn('Auth bootstrap: profile unavailable, keeping token')
      } finally {
        setChecking(false)
      }
    })()
  }, [])

  const loginWithCredentials = async (email, password, persistLocal=false) => {
    const res = await api.login(email, password)
    const token = res?.access_token || res?.token || res?.tokens?.access_token
    if (token) api.setToken(token, persistLocal ? 'local' : 'session')
    // Prefer server-provided user, otherwise fetch
    const user = res?.user || (await api.getProfile())
    setProfile(user || null)
    return { user, token }
  }

  // Accept an already obtained login result (for compatibility with existing flows)
  const setAuth = (user, token, persistLocal=false) => {
    api.setToken(token || null, persistLocal ? 'local' : 'session')
    setProfile(user || null)
  }

  const refreshProfile = async () => {
    const me = await api.getProfile()
    setProfile(me)
    return me
  }

  const logout = () => {
    api.setToken(null)
    setProfile(null)
  }

  const value = useMemo(() => ({
    profile,
    checkingAuth: checking,
    loginWithCredentials,
    setAuth,
    refreshProfile,
    logout,
  }), [profile, checking])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
