import { useContext } from 'react'
import { AuthContext } from '../context/AuthContextDefinition'

/**
 * Access the authentication context.
 * Must be used inside {@link AuthProvider}.
 * @returns {import('../context/AuthContext').AuthContextValue | null}
 */
export function useAuth() {
  return useContext(AuthContext)
}
