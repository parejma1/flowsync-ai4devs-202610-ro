import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/auth/auth-context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/profile" replace />
  return children
}
