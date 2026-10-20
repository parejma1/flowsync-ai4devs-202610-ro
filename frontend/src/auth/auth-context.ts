import { createContext, useContext } from 'react'

export type AuthContextValue = {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}
