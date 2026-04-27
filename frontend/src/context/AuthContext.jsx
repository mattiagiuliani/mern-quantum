import { useEffect, useState } from 'react'
import { getMe, loginUser, registerUser, logoutUser } from '../api/apiClient'
import { AuthContext } from './AuthContextDefinition'

/**
 * @typedef {import('../api/apiClient').SafeUser} SafeUser
 *
 * @typedef {{
 *   user: SafeUser | null,
 *   loading: boolean,
 *   login: (email: string, password: string) => Promise<import('../api/apiClient').AuthResponse>,
 *   register: (username: string, email: string, password: string) => Promise<import('../api/apiClient').AuthResponse>,
 *   logout: () => Promise<void>,
 * }} AuthContextValue
 */

/**
 * Provides authentication state to the entire app.
 * On mount calls GET /auth/me to rehydrate the session from the HttpOnly cookie.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await loginUser(email, password)
    setUser(data.user)
    return data
  }

  const register = async (username, email, password) => {
    const data = await registerUser(username, email, password)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
