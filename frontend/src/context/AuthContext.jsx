import { useEffect, useState } from 'react'
import { getMe, loginUser, registerUser, logoutUser } from '../api/apiClient'
import { AuthContext } from './AuthContextDefinition'

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
