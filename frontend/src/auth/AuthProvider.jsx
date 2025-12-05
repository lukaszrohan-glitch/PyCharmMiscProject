import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { AuthContext } from './context'
import * as api from '../services/api'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)
  const lastAuthExpiredRef = useRef(0)

  const logout = useCallback(() => {
    api.setToken(null)
    setProfile(null)
  }, [])

  // Listen for auth:expired events from API
  useEffect(() => {
    const handleAuthExpired = (event) => {
      const { endpoint, timestamp } = event.detail || {}

      // Debounce: ignore if we just handled one
      if (timestamp - lastAuthExpiredRef.current < 2000) return
      lastAuthExpiredRef.current = timestamp

      // Only logout if we actually have a profile (are logged in)
      // and the token is truly invalid
      if (profile) {
        console.warn('Auth expired event received for:', endpoint)
        // Verify token is really invalid by trying to get profile
        api.getProfile().then(me => {
          if (!me) {
            // Token truly invalid - logout
            logout()
          }
          // If profile still works, ignore the 401 - it was a transient error
        }).catch(() => {
          logout()
        })
      }
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [profile, logout])

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
        // If profile is null, token may be expired - but don't clear it yet
        // User might have just refreshed the page during a brief outage
        if (me) {
          setProfile(me)
        } else {
          // Profile returned null - token might be invalid
          // But don't auto-logout - let user try to use the app
          console.warn('Could not fetch profile on startup - token may be expired')
        }
      } catch (e) {
        // Keep token; backend may be unreachable temporarily
        console.warn('Auth bootstrap: profile unavailable, keeping token', e)
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

  const value = useMemo(() => ({
    profile,
    checkingAuth: checking,
    loginWithCredentials,
    setAuth,
    refreshProfile,
    logout,
  }), [profile, checking, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
