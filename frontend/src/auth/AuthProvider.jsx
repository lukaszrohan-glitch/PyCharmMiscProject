import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)

  // No auto-login: start unauthenticated (explicit login required)
  useEffect(() => {
    setChecking(false)
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Using outside provider — return a minimal shim to avoid hard crashes
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
